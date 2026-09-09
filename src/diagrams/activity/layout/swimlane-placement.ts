/**
 * Phase two of D1's two-phase split
 * (`plans/activity-swimlane-rendering/decisions.md#d1`): given the
 * per-lane content widths T4's `swimlane-context.ts` computes, assign
 * each lane an absolute origin and shift every node/edge from `tile-
 * coordinates.ts`'s single-column pass into its own lane.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:396-449
 *   -- `computeSizeInternal`/`getHalfMissingSpace`, the origin loop ported
 *   below as {@link computeLaneOrigins}.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ConnectionVerticalDown.java:87-100
 *   -- `drawTranslate`, the cross-lane edge shape ported below as
 *   {@link routeEdge}. `FtileIfDown.java:225-238,284-301`
 *   (`ConnectionIn`/`ConnectionOut#drawTranslate`) and
 *   `FtileWhile.java:200-214` use the byte-identical
 *   `(mp1a.y + mp2b.y) / 2` middle-Y shape, so one function covers the
 *   straight top-down case and every if/while/repeat/switch composite
 *   boundary. `ParallelBuilderFork.java:166-184,220-241` (fork/split's
 *   bar-to-branch connections) use a DIFFERENT, offset-based middle-Y
 *   (`mp1a.y + 4`, `mp2b.y - 14`) sized against that class's own
 *   `barHeight`/`justBeforeBar2` fields, which this port's single
 *   `BAR_HEIGHT` constant does not reproduce -- porting those two
 *   literals onto our differently-derived bar geometry would be exactly
 *   the unsound fitting CLAUDE.md forbids, not a faithful port. Fork/
 *   split cross-lane edges fall back to the same average-Y rule as
 *   every other connection type; a named, bounded simplification, not a
 *   tile-restructuring stop (condition 7 does not apply -- no tile
 *   shape changes, only one connector's cross-lane offset is
 *   approximated).
 */

import type { StringBounder, Tile } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import type { ActivityEdgeGeo, ActivityNodeGeo, SwimlaneGeo } from '../activity-layout-types.js';
import type { GPoint } from '../tiles/points.js';
import type { GtileTopDown } from '../tiles/gtile-top-down.js';
import { swimlaneTitleFontSize } from '../activity-style-defaults.js';
import {
  computeLaneWidths,
  halfMissingSpace,
  measureLaneExtents,
  resolveSwimlaneMinWidth,
  type LaneItem,
  type LaneWidth,
  type LaneWidthInput,
} from './swimlane-context.js';

/** Metadata `tile-coordinates.ts` records per edge during the pass-1 walk
 * -- which lane each endpoint's source tile carries, resolved via its
 * `laneIn`/`laneOut` inheritance walk. Never part of the public
 * `ActivityEdgeGeo` shape; consumed here and discarded. */
export interface EdgeMeta {
  readonly lane1: string | undefined;
  readonly lane2: string | undefined;
}

/** A tile's OWN lane if `tile-layout.ts` set one (`Tile.swimlane`), else
 * the inherited ambient lane. */
export function laneAt(tile: Tile, inherited: string | undefined): string | undefined {
  return tile.swimlane ?? inherited;
}

/**
 * A composite's entry lane -- upstream's `getSwimlaneIn()`
 * (`ftile/Swimable.java`). A `GtileTopDown` branch wrapper carries no
 * `.swimlane` of its own (`tile-layout.ts` never wraps it), so its entry
 * lane is its FIRST child's, recursively (a branch may itself switch
 * lanes partway through, e.g. `bideta-97-cezo697`'s else-branch).
 */
export function laneIn(tile: Tile, inherited: string | undefined): string | undefined {
  if (tile.swimlane !== undefined) return tile.swimlane;
  if (tile.kind === 'gtile-top-down') {
    const children = (tile as unknown as GtileTopDown).children;
    if (children.length > 0) return laneIn(children[0]!, inherited);
  }
  return inherited;
}

/** A composite's exit lane -- upstream's `getSwimlaneOut()`; mirrors
 * {@link laneIn} but descends into the LAST child. */
export function laneOut(tile: Tile, inherited: string | undefined): string | undefined {
  if (tile.swimlane !== undefined) return tile.swimlane;
  if (tile.kind === 'gtile-top-down') {
    const children = (tile as unknown as GtileTopDown).children;
    if (children.length > 0) return laneOut(children[children.length - 1]!, inherited);
  }
  return inherited;
}

export interface PlacementResult {
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  swimlanes: SwimlaneGeo[];
}

interface LaneOrigin {
  readonly delta: number;
  readonly geo: SwimlaneGeo;
}

/**
 * Ports `Swimlanes#computeSizeInternal`'s origin loop
 * (`Swimlanes.java:416-431`) restricted to the real lanes, plus one extra
 * step for the trailing empty "special" lane
 * (`swimlanesSpecial()`, `:116-124`) that closes the last lane's span --
 * upstream loops over all `n + 1` entries uniformly; splitting the loop
 * here avoids threading a synthetic empty `LaneWidth` through the real
 * per-lane map. `blockOriginX` seeds the accumulator at the lane block's
 * own left edge (`xpos = 0` upstream; this diagram's block starts at
 * `baseX`, not `0`) so every returned `delta` is a ready-to-add absolute
 * offset for pass-1's `baseX`-relative node coordinates.
 */
interface LaneDividers {
  readonly dividerX: number[];
  readonly contentLeft: number[];
}

/**
 * The origin loop itself (`Swimlanes.java:416-431`), split from {@link
 * computeLaneOrigins} only to keep both under the file's function-length
 * limit -- `dividerX`/`contentLeft` are two views of the SAME loop
 * variable, never independently meaningful, so returning them as a pair
 * rather than merging further is the natural seam.
 */
function computeDividers(
  laneNames: readonly string[],
  widths: ReadonlyMap<string, LaneWidth>,
  inputs: readonly LaneWidthInput[],
  min: number,
  blockOriginX: number,
): LaneDividers {
  const dividerX: number[] = [];
  const contentLeft: number[] = [];
  let xpos = blockOriginX;
  for (let i = 0; i < laneNames.length; i++) {
    const w = widths.get(laneNames[i]!)!;
    const x1 = halfMissingSpace(i, inputs, min);
    const x2 = halfMissingSpace(i + 1, inputs, min);
    const dividerWidth = x1 + x2;
    const left = xpos + dividerWidth + (w.width - w.contentWidth) / 2;
    contentLeft.push(left);
    dividerX.push(left - x2);
    xpos += w.width + dividerWidth;
  }
  // Trailing divider (the `i === n` "special" empty lane): its content and
  // minX are both 0 (`MinMax.getEmpty(true)`), so `xx_n` reduces to
  // `xpos + dividerWidth_n + min / 2` and the divider itself to
  // `xpos + x1_n + min / 2` (`min` already resolved, never negative --
  // see `resolveSwimlaneMinWidth`, so this is `Math.max(min, 0) / 2`).
  const x1n = halfMissingSpace(laneNames.length, inputs, min);
  dividerX.push(xpos + x1n + min / 2);
  return { dividerX, contentLeft };
}

function computeLaneOrigins(
  laneNames: readonly string[],
  widths: ReadonlyMap<string, LaneWidth>,
  min: number,
  blockOriginX: number,
): Map<string, LaneOrigin> {
  const inputs: LaneWidthInput[] = laneNames.map((name) => {
    const w = widths.get(name)!;
    return { contentWidth: w.contentWidth, titleWidth: w.titleWidth };
  });
  const { dividerX, contentLeft } = computeDividers(laneNames, widths, inputs, min, blockOriginX);

  const origins = new Map<string, LaneOrigin>();
  for (let i = 0; i < laneNames.length; i++) {
    const name = laneNames[i]!;
    const w = widths.get(name)!;
    const left = contentLeft[i]!;
    origins.set(name, {
      delta: left - w.contentMinX,
      geo: {
        name,
        x: dividerX[i]!,
        width: dividerX[i + 1]! - dividerX[i]!,
        contentWidth: w.contentWidth,
        titleWidth: w.titleWidth,
        contentMinX: w.contentMinX,
        contentX: left,
      },
    });
  }
  return origins;
}

/** `swimlane.getTranslate()` applied to one node
 * (`UGraphicInterceptorOneSwimlane`, `Swimlanes.java:342-343` -- one `dx`
 * shifts a lane's entire sub-tree draw uniformly). Y is untouched:
 * upstream's translate is `UTranslate.dx(xx)`, X-only. */
function shiftNode(node: ActivityNodeGeo, deltas: ReadonlyMap<string, number>): ActivityNodeGeo {
  if (node.swimlane === undefined) return node;
  const delta = deltas.get(node.swimlane);
  if (delta === undefined || delta === 0) return node;
  return { ...node, x: node.x + delta };
}

function shiftPoints(points: readonly GPoint[], delta: number): GPoint[] {
  if (delta === 0) return [...points];
  return points.map((p) => ({ x: p.x + delta, y: p.y }));
}

/**
 * Same-lane edges shift uniformly by that lane's own delta. Cross-lane
 * edges discard the pass-1 shape entirely and draw a fresh 4-point jog
 * through both lanes' own translates -- see the module doc for the
 * upstream citations; only the path's two endpoints matter (upstream's
 * `getP1()`/`getP2()`), never any interior elbow the same-lane shape had.
 */
function routeEdge(edge: ActivityEdgeGeo, meta: EdgeMeta, deltas: ReadonlyMap<string, number>): ActivityEdgeGeo {
  const d1 = meta.lane1 !== undefined ? (deltas.get(meta.lane1) ?? 0) : 0;
  const d2 = meta.lane2 !== undefined ? (deltas.get(meta.lane2) ?? 0) : 0;

  if (meta.lane1 === meta.lane2 || meta.lane1 === undefined || meta.lane2 === undefined) {
    return { ...edge, points: shiftPoints(edge.points, d1) };
  }

  const p1 = edge.points[0]!;
  const p2 = edge.points[edge.points.length - 1]!;
  const mp1 = { x: p1.x + d1, y: p1.y };
  const mp2 = { x: p2.x + d2, y: p2.y };
  const middle = (mp1.y + mp2.y) / 2;
  return {
    ...edge,
    points: [mp1, { x: mp1.x, y: middle }, { x: mp2.x, y: middle }, mp2],
  };
}

/**
 * Every input `placeSwimlanes` needs, bundled to keep the function's own
 * parameter count under the file's limit -- these seven values are
 * always supplied together by `assignCoordinates`, never independently.
 */
export interface PlacementInput {
  readonly nodes: readonly ActivityNodeGeo[];
  readonly edges: readonly ActivityEdgeGeo[];
  readonly edgeMeta: readonly EdgeMeta[];
  readonly laneNames: readonly string[];
  readonly baseX: number;
  readonly bounder: StringBounder;
  readonly theme: Theme;
}

/**
 * `computeDrawingWidths` (`Swimlanes.java:379-395`) plus the `min`
 * resolution step from `computeSizeInternal` (`:399-403`) -- measures
 * each lane's content extent and title width, then resolves the lane
 * width floor once so both `computeLaneWidths` and the origin loop reuse
 * the SAME resolved value (upstream does too, `:399` then `:409,441`).
 */
function measureLanes(
  nodes: readonly ActivityNodeGeo[],
  laneNames: readonly string[],
  bounder: StringBounder,
  theme: Theme,
): { widths: Map<string, LaneWidth>; min: number } {
  const items: LaneItem[] = nodes.map((n) =>
    n.swimlane !== undefined ? { swimlane: n.swimlane, x: n.x, width: n.width } : { x: n.x, width: n.width },
  );
  const extents = measureLaneExtents(items, laneNames);

  const titleFontSize = swimlaneTitleFontSize(theme);
  const titleWidths = new Map<string, number>();
  for (const name of laneNames) titleWidths.set(name, bounder.getDimension(name, titleFontSize).width);

  // `skinparam swimlaneWidth` is unparsed (no `swimlanewidth` key in
  // `skinparam-key-handlers-table-*.ts`); its default is the literal `0`,
  // not the `"same"` sentinel (`SkinParam.java:1121-1129`).
  const contentWidths = [...extents.values()].map((e) => e.maxX - e.minX);
  const min = resolveSwimlaneMinWidth(contentWidths, 0);

  return { widths: computeLaneWidths(extents, titleWidths, min), min };
}

/**
 * Orchestrates T4 + the origin loop + the shift, called once from
 * `assignCoordinates` after the pass-1 single-column walk. Returns
 * pass-1's `nodes`/`edges` byte-identical (same array contents, new
 * arrays) when there are no swimlanes -- acceptance criterion "no
 * swimlanes -> byte-identical geometry".
 */
export function placeSwimlanes(input: PlacementInput): PlacementResult {
  const { nodes, edges, edgeMeta, laneNames, baseX, bounder, theme } = input;
  if (laneNames.length === 0) {
    return { nodes: [...nodes], edges: [...edges], swimlanes: [] };
  }

  const { widths, min } = measureLanes(nodes, laneNames, bounder, theme);
  const origins = computeLaneOrigins(laneNames, widths, min, baseX);

  const deltas = new Map<string, number>();
  const swimlanes: SwimlaneGeo[] = [];
  for (const name of laneNames) {
    const origin = origins.get(name)!;
    deltas.set(name, origin.delta);
    swimlanes.push(origin.geo);
  }

  return {
    nodes: nodes.map((n) => shiftNode(n, deltas)),
    edges: edges.map((e, i) => routeEdge(e, edgeMeta[i]!, deltas)),
    swimlanes,
  };
}
