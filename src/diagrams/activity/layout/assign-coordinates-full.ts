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
 * Imports `walkTile`/`computeBounds`'s inputs and `Out`/`LAYOUT_MARGIN`
 * back FROM `tile-coordinates.ts`, which in turn imports
 * `assignCoordinatesFull` from here for its own `assignCoordinates` --
 * a circular import between the two modules, safe the same way
 * `tile-coordinates.ts`/`walk-fork-branches.ts` already are: both sides are
 * function DEFINITIONS, and neither calls into the other until a real
 * layout pass runs, well after both modules finish loading.
 */

import type { ActivityDiagramAST } from '../ast.js';
import type { ActivityEdgeGeo, ActivityGeometry, ActivityNodeGeo } from '../layout.old.js';
import type { SwimlaneBandGeo } from '../activity-layout-types.js';
import type { Tile } from '../tiles/tile.js';
import type { StringBounder } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import type { Reservation } from './hexagon-reservations.js';
import { LAYOUT_MARGIN, walkTile } from './tile-coordinates.js';
import type { Out } from './tile-coordinates.js';
import { computeSwimlaneChrome, placeSwimlanes, resolveSwimlaneVertical } from './swimlane-placement.js';
import type { EdgeMeta, PlacementResult } from './swimlane-placement.js';

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

export function assignCoordinatesFull(input: AssignCoordinatesInput): AssignCoordinatesResult {
  const { root, ast, baseX, baseY, bounder, theme } = input;
  const nodes: ActivityNodeGeo[] = [];
  const edges: ActivityEdgeGeo[] = [];
  const edgeMeta: EdgeMeta[] = [];
  const reservations: Reservation[] = [];
  let idCounter = 0;
  const out: Out = { nodes, edges, edgeMeta, reservations, nextId: (prefix: string) => `${prefix}-${++idCounter}` };
  const { contentY, titlesHeight } = resolveSwimlaneVertical(ast.swimlanes, baseY, bounder, theme);
  walkTile(root, baseX, contentY, { kindHint: null, lane: undefined }, out);

  const placed = placeSwimlanes({ nodes, edges, edgeMeta, laneNames: ast.swimlanes, baseX, baseY, bounder, theme });
  const { maxX, maxY } = computeBounds(root, baseX, contentY, placed);
  const chrome = computeSwimlaneChrome(placed.swimlanes, baseY, titlesHeight, maxY);

  return {
    geometry: {
      totalWidth: maxX + LAYOUT_MARGIN,
      totalHeight: maxY + LAYOUT_MARGIN,
      nodes: placed.nodes,
      edges: placed.edges,
      swimlanes: placed.swimlanes,
      ...chrome,
    },
    reservations: withBandReservation([...reservations, ...placed.reservations], chrome.swimlaneBand),
    edgeMeta,
  };
}
