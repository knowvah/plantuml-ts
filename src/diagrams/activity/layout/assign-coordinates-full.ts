/**
 * `assignCoordinatesFull` -- `assignCoordinates`'s own result
 * (`tile-coordinates.ts`) plus the compression side-channel mission
 * `activity-klimt-compress` T3/T4/T5 need: the reservations the if/while
 * walkers and `placeSwimlanes` emit, and the pass-1 `edgeMeta`
 * (`shapesOf`'s `polygonSkipMode` needs each edge's `EdgeShape`). Split out
 * of `tile-coordinates.ts` only to keep that file under the 500-line cap
 * (mission README, "Push forward" -- "a sibling module when a file would
 * cross the 500-line hook"); `tile-coordinates.ts`'s own `assignCoordinates`
 * is a thin wrapper over this. Never merged into the public
 * `ActivityGeometry` (stop 9).
 *
 * Imports `walkTile`/`computeBounds`'s inputs and `Out`
 * back FROM `tile-coordinates.ts`, which in turn imports
 * `assignCoordinatesFull` from here for its own `assignCoordinates` --
 * a circular import between the two modules, safe the same way
 * `tile-coordinates.ts`/`walk-fork-branches.ts` already are: both sides are
 * function DEFINITIONS, and neither calls into the other until a real
 * layout pass runs, well after both modules finish loading.
 */

import type { ActivityDiagramAST } from '../ast.js';
import type { ActivityGeometry, SwimlaneBandGeo } from '../activity-geometry.types.js';
import type { Tile } from '../tiles/tile.js';
import type { StringBounder } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import type { Reservation } from './hexagon-reservations.js';
import { walkTile } from './tile-coordinates.js';
import type { Out } from './tile-coordinates.js';
import { placeSwimlanes, resolveSwimlaneVertical, computeSwimlaneChrome } from './swimlane-placement.js';
import { SWIMLANE_BAND_INSET_X } from './swimlane-chrome.js';
import type { EdgeMeta, PlacementResult } from './swimlane-placement.js';
import { compressGeometry } from './compress/compress-geometry.js';
import { applyEdgeDrawOrder, lanePassOrder } from './edge-draw-order.js';
import { finalizeGeometry } from './canvas-origin.js';
import type { FinalizedGeometry } from './canvas-origin.js';
import { mergeSnakes } from './snake-merge.js';

/**
 * SWIMLANES COUNT TOWARD THE CANVAS TOO (32/268 fixtures once overflowed
 * by up to 216px, `pakema-21-xema183`). T6 replaced the boxed header with
 * real lane origins: the band's right edge (`lanes[0].x + Σwidth - 1`,
 * `swimlane-placement.ts#computeSwimlaneChrome`) is always `lanesRight -
 * 1`, so `lanesRight` alone bounds every drawn X extent. Y is untouched
 * here -- the title-band vertical reservation is folded into `baseY`
 * BEFORE this runs (see `assignCoordinatesFull`'s `contentY`).
 */
function computeBounds(
  root: Tile,
  baseX: number,
  baseY: number,
  placed: PlacementResult,
): { maxX: number; maxY: number } {
  let maxX = baseX + root.width;
  let maxY = baseY + root.height;
  for (const n of placed.nodes) {
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  for (const e of placed.edges) {
    for (const p of e.points) {
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (placed.swimlanes.length > 0) {
    const lanesRight = Math.max(...placed.swimlanes.map((s) => s.x + s.width));
    maxX = Math.max(maxX, lanesRight);
  }
  return { maxX, maxY };
}

export interface AssignCoordinatesResult {
  geometry: ActivityGeometry;
  reservations: Reservation[];
  edgeMeta: EdgeMeta[];
  /** D6/T4: total px removed per axis by {@link compressGeometry}'s two
   *  passes -- an internal accessor, never merged into `ActivityGeometry`
   *  (stop 9). */
  removed: { x: number; y: number };
}

/** {@link assignCoordinatesFull}'s six arguments, bundled to keep it under
 *  the file's 5-parameter limit (`assignCoordinates` keeps its own
 *  pre-existing 6-argument signature -- only this new function needs the
 *  bundle). */
export interface AssignCoordinatesInput {
  root: Tile;
  ast: ActivityDiagramAST;
  baseX: number;
  baseY: number;
  bounder: StringBounder;
  theme: Theme;
  /**
   * `false` skips D1's compress pass and returns the pass-1 (uncompressed)
   * geometry -- the "before" snapshot the mission's own invariant test
   * (`tests/diagrams/activity/layout/compress/invariant.test.ts`) needs to
   * compare against the compressed "after". Every other caller wants the
   * default `true`. Internal-only knob on this internal accessor type --
   * not on the public `ActivityGeometry` (stop 9).
   */
  compress?: boolean;
}

/**
 * `Swimlanes#drawTitlesBackground`'s `URectangle.ignoreForCompressionOnX()
 * .ignoreForCompressionOnY()` (`Swimlanes.java:358-367`) -- reuses
 * `computeSwimlaneChrome`'s own band geometry rather than recomputing it,
 * so both the renderer and the compressor read the exact same rect. Split
 * from {@link assignCoordinatesFull} only to keep that function's own NLOC
 * under the file's limit.
 */
function withBandReservation(reservations: readonly Reservation[], band: SwimlaneBandGeo | undefined): Reservation[] {
  if (band === undefined) return [...reservations];
  return [...reservations, { ...band, ignoreX: true, ignoreY: true }];
}

/** {@link assignCoordinatesFull}'s own post-layout half, split out only to
 *  keep that function's NLOC under the file's limit: runs D1's compress
 *  pass over the pass-1 placement and re-derives the chrome (D6/D7) from
 *  the RESULT, per this task's own instructions ("build the returned
 *  geometry from the RESULT's nodes, edges, swimlanes and bounds"). */
interface CompressAndAssembleInput {
  placed: PlacementResult;
  edgeMeta: EdgeMeta[];
  reservations: Reservation[];
  bounds: { maxX: number; maxY: number };
  baseY: number;
  titlesHeight: number;
  bounder: StringBounder;
  theme: Theme;
}

/** Shared tail of {@link pass1Assemble}/{@link compressAndAssemble}: both
 *  reduce to "finalize this (possibly compressed) placement, then wrap it
 *  in the `AssignCoordinatesResult` shape" -- split out only to keep each
 *  caller's own NLOC under the file's limit. */
function assembleFromFinal(
  final: FinalizedGeometry,
  removed: { x: number; y: number },
): Omit<AssignCoordinatesResult, 'edgeMeta'> {
  return {
    geometry: {
      totalWidth: final.totalWidth,
      totalHeight: final.totalHeight,
      // b3/T3a (family E): the un-floored span `renderer.ts#preChromeDims`
      // reads directly -- see `ActivityGeometry.rawWidth`'s own doc.
      rawWidth: final.rawWidth,
      rawHeight: final.rawHeight,
      nodes: final.nodes,
      edges: final.edges,
      swimlanes: final.swimlanes,
      ...final.chrome,
    },
    reservations: final.reservations,
    removed,
  };
}

/** {@link pass1Assemble}'s own inputs, bundled to keep that function under
 *  the file's 5-parameter limit (T3i's `theme` would be a 6th). */
interface Pass1AssembleInput {
  placed: PlacementResult;
  reservations: Reservation[];
  bounds: { maxX: number; maxY: number };
  baseY: number;
  titlesHeight: number;
  theme: Theme;
}

/** {@link assignCoordinatesFull}'s `compress: false` half -- the pass-1
 *  geometry, assembled the same way `compressAndAssemble` does but with no
 *  transform applied and `removed` zeroed. */
function pass1Assemble(input: Pass1AssembleInput): Omit<AssignCoordinatesResult, 'edgeMeta'> {
  const { placed, reservations, bounds, baseY, titlesHeight, theme } = input;
  const final = finalizeGeometry({
    nodes: placed.nodes,
    edges: placed.edges,
    swimlanes: placed.swimlanes,
    reservations,
    bounds,
    baseY,
    titlesHeight,
    theme,
  });
  return assembleFromFinal(final, { x: 0, y: 0 });
}

function compressAndAssemble(input: CompressAndAssembleInput): Omit<AssignCoordinatesResult, 'edgeMeta'> {
  const { placed, edgeMeta, reservations, bounds, baseY, titlesHeight, bounder, theme } = input;
  const compressed = compressGeometry({
    nodes: placed.nodes,
    edges: placed.edges,
    edgeMeta,
    swimlanes: placed.swimlanes,
    reservations,
    bounds,
    bounder,
    theme,
  });
  const final = finalizeGeometry({
    nodes: compressed.nodes,
    edges: compressed.edges,
    swimlanes: compressed.swimlanes,
    reservations: compressed.reservations,
    bounds: compressed.bounds,
    baseY,
    titlesHeight,
    theme,
  });
  return assembleFromFinal(final, compressed.removed);
}

/**
 * D1's last step: rule (b) of mission `activity-edge-draw-order`. Re-emits
 * the assembled edge run in the jar's swimlane pass order
 * (`edge-draw-order.ts`, `Swimlanes.java:328-352`), permuting the geometry's
 * `edges` and the pass-1 `edgeMeta` by ONE index array so the two stay
 * aligned for `shapesOf`/`compressGeometry` (`compress/shapes-of.ts:376-377`,
 * stop 9). Runs AFTER compression: no coordinate is read or written here,
 * only the order of the list.
 */
function inLanePassOrder(
  result: Omit<AssignCoordinatesResult, 'edgeMeta'>,
  edgeMeta: EdgeMeta[],
  laneNames: readonly string[],
): AssignCoordinatesResult {
  const ordered = applyEdgeDrawOrder(result.geometry.edges, edgeMeta, lanePassOrder(edgeMeta, laneNames));
  return {
    ...result,
    geometry: { ...result.geometry, edges: ordered.edges },
    edgeMeta: ordered.edgeMeta,
  };
}

/**
 * D1 (T1b): `layout/snake-merge.ts`'s two-pass connector merge, run on
 * raw pre-compression coordinates, in the jar's own lane-pass draw order
 * (`edge-draw-order.ts#lanePassOrder` -- the SAME order `inLanePassOrder`
 * re-derives post-compression below, so that later call is a stable
 * no-op here, not a second reordering). Returns the same
 * {@link PlacementResult} with `edges`/`edgeMeta` replaced.
 */
/**
 * O (add2 T3i): attaches `|#color|name|`'s background onto each lane's own
 * `SwimlaneGeo`, read back from `ast.swimlaneColors` (keyed by lane name,
 * `dispatch-support.ts#setCurrentSwimlane`). `x`/`width` already match the
 * jar's background-rect bounds exactly (verified against `cejupe-34-
 * muti621`'s oracle SVG) -- no new geometry computed here, just the
 * colour attached onto the SAME `SwimlaneGeo` the renderer already reads.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:332-340
 */
function withLaneBackgrounds(placed: PlacementResult, colors: Record<string, string> | undefined): PlacementResult {
  if (colors === undefined) return placed;
  const swimlanes = placed.swimlanes.map((lane) => {
    const background = colors[lane.name];
    return background === undefined ? lane : { ...lane, background };
  });
  return { ...placed, swimlanes };
}

function mergeBeforeCompress(placed: PlacementResult, laneNames: readonly string[]): PlacementResult {
  const order = lanePassOrder(placed.edgeMeta, laneNames);
  const ordered = applyEdgeDrawOrder(placed.edges, placed.edgeMeta, order);
  const merged = mergeSnakes(ordered.edges, ordered.edgeMeta);
  return { ...placed, edges: merged.edges, edgeMeta: merged.edgeMeta };
}

/** Fresh, empty {@link Out} accumulator -- split out of {@link
 *  assignCoordinatesFull} purely to keep that function's own NLOC under
 *  the file's limit. */
function buildOut(theme: Theme): Out {
  let idCounter = 0;
  return {
    nodes: [],
    edges: [],
    edgeMeta: [],
    reservations: [],
    theme,
    nextId: (prefix: string) => `${prefix}-${++idCounter}`,
  };
}

export function assignCoordinatesFull(input: AssignCoordinatesInput): AssignCoordinatesResult {
  const { root, ast, baseX, baseY, bounder, theme, compress = true } = input;
  const out = buildOut(theme);
  const { nodes, edges, edgeMeta, reservations } = out;
  const { contentY, titlesHeight } = resolveSwimlaneVertical(ast.swimlanes, baseY, bounder, theme);
  walkTile(root, baseX, contentY, { kindHint: null, lane: undefined }, out);

  const lanes = { laneNames: ast.swimlanes, laneDisplays: ast.swimlaneDisplays, walkReservations: reservations };
  const placedRaw = placeSwimlanes({ nodes, edges, edgeMeta, ...lanes, baseX, baseY, theme });
  const placed = mergeBeforeCompress(withLaneBackgrounds(placedRaw, ast.swimlaneColors), ast.swimlanes);
  const bounds = computeBounds(root, baseX, contentY, placed);
  // `drawTitlesBackground`'s `UTranslate.dx(5)` from the block origin, which
  // is `baseX` here (`Swimlanes.java:366`; `computeLaneOrigins` seeds its
  // `xpos = 0` at `baseX`).
  const bandX = baseX + SWIMLANE_BAND_INSET_X;
  const pass1Chrome = computeSwimlaneChrome(placed.swimlanes, baseY, titlesHeight, bounds.maxY, bandX);
  const allReservations = withBandReservation(placed.reservations, pass1Chrome.swimlaneBand);

  if (!compress) {
    const result = pass1Assemble({ placed, reservations: allReservations, bounds, baseY, titlesHeight, theme });
    return inLanePassOrder(result, placed.edgeMeta, ast.swimlanes);
  }
  const result = compressAndAssemble({
    placed,
    edgeMeta: placed.edgeMeta,
    reservations: allReservations,
    bounds,
    baseY,
    titlesHeight,
    bounder,
    theme,
  });
  return inLanePassOrder(result, placed.edgeMeta, ast.swimlanes);
}
