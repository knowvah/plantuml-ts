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
 *   {@link routeEdge}'s `'default'` case. `FtileIfDown.java:225-238,284-301`
 *   (`ConnectionIn`/`ConnectionOut#drawTranslate`) and
 *   `FtileWhile.java:200-214` use the byte-identical
 *   `(mp1a.y + mp2b.y) / 2` middle-Y shape, so one function covers the
 *   straight top-down case and every if/while/repeat/switch composite
 *   boundary.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderFork.java:166-184
 *   -- `ConnectionIn#drawTranslate`: `middle = mp1a.getY() + 4`, ported
 *   below as {@link routeEdge}'s `'parallel-in'` case.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderFork.java:220-241
 *   -- `ConnectionOut#drawTranslate`: `middle = mp2b.getY() - 14`, ported
 *   below as {@link routeEdge}'s `'parallel-out'` case.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderSplit.java:207-225
 *   -- same `+ 4` shape for the split's in-connector.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderSplit.java:264-285
 *   -- same `- 14` shape for the split's out-connector.
 */

import type { StringBounder } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import type {
  ActivityEdgeGeo,
  ActivityNodeGeo,
  SwimlaneBandGeo,
  SwimlaneDividerY,
  SwimlaneGeo,
} from '../activity-layout-types.js';
import type { GPoint } from '../tiles/points.js';
import { swimlaneTitleFontSize } from '../activity-style-defaults.js';
import {
  computeLaneWidths,
  measureLaneExtents,
  resolveSwimlaneMinWidth,
  type LaneItem,
  type LaneWidth,
} from './swimlane-context.js';
import type { Reservation } from './hexagon-reservations.js';
import { routeLoopTranslate, type LoopTranslate } from './swimlane-loop-translate.js';
import { computeLaneOrigins } from './swimlane-lane-origins.js';

// `laneAt`/`laneIn`/`laneOut` moved to `swimlane-lanes.ts` (mission
// `activity-lane-capture` T2, this file's 500-line hook); re-exported here
// so existing importers (`walk-fork-branches.ts`, `walk-while-branch.ts`,
// `tile-coordinates.ts`, this file's own tests) are untouched.
export { laneAt, laneIn, laneOut } from './swimlane-lanes.js';

/** Metadata `tile-coordinates.ts` records per edge during the pass-1 walk
 * -- which lane each endpoint's source tile carries, resolved via its
 * `laneIn`/`laneOut` inheritance walk. Never part of the public
 * `ActivityEdgeGeo` shape; consumed here and discarded. */
export interface EdgeMeta {
  readonly lane1: string | undefined;
  readonly lane2: string | undefined;
  /** D6: which cross-lane middle-Y shape {@link routeEdge} applies. Set at
   * `pushEdge`; `'default'` is the average-Y shape every non-parallel
   * connection uses. */
  readonly shape: EdgeShape;
  /** D2 (`activity-loop-lane-translate`): set only on a `ConnectionTranslatable`
   * while/repeat back-edge (`ftile/ConnectionCross.java:47-63`). When set and
   * the lanes differ, {@link routeEdge} delegates to `routeLoopTranslate`.
   * T1 never sets this from a walker -- scaffolding for T2/T3. */
  readonly loop?: LoopTranslate;
}

/** D6: the two fork/split cross-lane elbow shapes, plus the fallback every
 * other connection type uses. `'if-vertical-in'` (mission `activity-if-
 * tile-port` T1 Q4, T5): `ConnectionVerticalIn#drawTranslate`'s own
 * `middle = mp1a.y + 4` -- numerically identical to `'parallel-in'` but a
 * DIFFERENT Java class (`FtileIfLongHorizontal`, not a fork/split
 * builder), so it gets its own semantically-named tag rather than reusing
 * the fork one.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:419-435
 *
 * `LoopTranslate['kind']` (`activity-loop-lane-translate` D2) is folded in
 * so a loop-tagged edge stays self-describing; {@link routeEdge} dispatches
 * on `EdgeMeta.loop`, never `shape`, so `crossLaneMiddleY` treats all five
 * the same as `'default'` via its `default:` branch. */
export type EdgeShape = 'parallel-in' | 'parallel-out' | 'if-vertical-in' | 'default' | LoopTranslate['kind'];

export interface PlacementResult {
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  /**
   * D3/T1b (`plans/activity-loop-lane-translate/stop-1-edgemeta-zip.md`):
   * parallel to {@link edges}, NOT to the walker's own `edgeMeta` input --
   * `routeEdge` may flat-map one input edge into several (the repeat exit's
   * unarrowed-then-arrowed pair), so each output edge repeats its SOURCE
   * meta once per edge `routeEdge` returned for it (same lanes/shape --
   * that is what `shapesForEdge`/`passRank` read). Consumers
   * (`assign-coordinates-full.ts`, `compress/shapes-of.ts`,
   * `edge-draw-order.ts`) must zip `edges[i]` with `edgeMeta[i]`, never with
   * the pre-route `PlacementInput.edgeMeta`.
   */
  edgeMeta: EdgeMeta[];
  swimlanes: SwimlaneGeo[];
  /**
   * One {@link Reservation} per divider line (mission `activity-klimt-
   * compress` T3, D5). Never carries `ignoreX`/`ignoreY` -- a divider's
   * `UEmpty(x1+x2, 1)` always occupies its full box (see
   * {@link Reservation}'s own doc for why `UEmpty` never sets those flags).
   * Internal to `layout/`; not part of the public `ActivityGeometry`.
   */
  reservations: Reservation[];
}

/**
 * D2: the title band's height is the MAX, over lanes, of that lane's own
 * title `TextBlock`'s height (`Swimlanes#getTitlesHeight`, `:309-315`) --
 * never the raw `SwimlaneTitleFontSize` constant. Each title's own height
 * is floored at 10 by `AtomText#calculateDimensionSlow`
 * (`klimt/creole/legacy/AtomText.java:179-181`: `if (h < 10) h = 10;`),
 * which is why a small `SwimlaneTitleFontSize` does not shrink the band
 * proportionally. Confirmed against three pinned fixtures:
 * `SwimlaneTitleFontSize 8` -> band height 10 (`sikino-19-vuca111`, floored);
 * the default 18 -> 18 (`pakema-21-xema183`, already >= 10, unaffected);
 * `TitleFontSize 30` -> 30 (`cemipu-87-dinu624`, unaffected). Shared by
 * `tile-coordinates.ts` (vertical content reservation) and the swimlane
 * chrome renderer (band rect height) so both measure the exact same value
 * -- D2 forbids a second, independent implementation of this number.
 */
export function measureSwimlaneTitlesHeight(
  laneNames: readonly string[],
  bounder: StringBounder,
  theme: Theme,
): number {
  const titleFontSize = swimlaneTitleFontSize(theme);
  let max = 0;
  for (const name of laneNames) {
    max = Math.max(max, bounder.getDimension(name, titleFontSize).height);
  }
  return Math.max(max, 10);
}

export interface SwimlaneVertical {
  readonly contentY: number;
  readonly titlesHeight: number;
}

/**
 * `Swimlanes#drawU`'s own `swimlanes().size() > 1` guard (`:275`): a
 * single lane draws no chrome and reserves no vertical space; a real
 * multi-lane diagram pushes content down by `titlesHeight + 5`
 * (`getTitleHeightTranslate`, `:304-307`). Called once from
 * `assignCoordinates` before the pass-1 walk.
 */
export function resolveSwimlaneVertical(
  laneNames: readonly string[],
  baseY: number,
  bounder: StringBounder,
  theme: Theme,
): SwimlaneVertical {
  if (laneNames.length <= 1) return { contentY: baseY, titlesHeight: 0 };
  const titlesHeight = measureSwimlaneTitlesHeight(laneNames, bounder, theme);
  return { contentY: baseY + titlesHeight + 5, titlesHeight };
}

export interface SwimlaneChrome {
  swimlaneBand: SwimlaneBandGeo;
  swimlaneDividerY: SwimlaneDividerY;
}

/**
 * Derives the band rect and the divider Y-range from the already-placed
 * lane geometry ({@link placeSwimlanes}'s own `swimlanes` output) plus the
 * block's own top (`baseY`) and content bottom (`contentBottomY`, the
 * `totalHeight - LAYOUT_MARGIN` upstream's own divider height uses).
 *
 * Band x/width: `Swimlanes#drawTitlesBackground` (`:358-367`) draws at
 * `ug.apply(dx(5))` with `width = swimlanesSpecial().last().getTranslate()
 * .getDx() - 2*5 - 1`. The trailing special lane's translate is the LAST
 * divider's own x plus `halfMissingSpace(n+1, ...)`, which is always the
 * fixed outer-edge padding of 5 (`swimlane-context.ts#halfMissingSpace`,
 * the `i > lanes.length` branch) -- the SAME fixed 5 the FIRST divider's
 * own `halfMissingSpace(0, ...)` returns. Those two `+5`/`-5` terms
 * cancel, reducing the band to `x = lanes[0].x`, `width = Σ(lane.width) -
 * 1`. Verified against the pinned jar's `pakema-21-xema183`: dividers at
 * 20, 58.338, 369.275 -> Σwidth = 349.275; band x = 20 (== first divider),
 * band width = 348.275 (== Σ - 1) -- both exact matches.
 *
 * Divider Y-range: `LaneDivider#drawU` draws one full-height `ULine` per
 * boundary, `height = dimensionFull.getHeight() + titleHeightTranslate
 * .getDy()` (`Swimlanes.java:423-424`) -- from the block's own top to its
 * content bottom.
 */
export function computeSwimlaneChrome(
  swimlanes: readonly SwimlaneGeo[],
  baseY: number,
  titlesHeight: number,
  contentBottomY: number,
): Partial<SwimlaneChrome> {
  // Same `size() > 1` guard as {@link resolveSwimlaneVertical}: a single
  // lane draws no chrome, so there is nothing to derive.
  if (swimlanes.length <= 1) return {};
  const first = swimlanes[0]!;
  const widthSum = swimlanes.reduce((acc, s) => acc + s.width, 0);
  return {
    swimlaneBand: { x: first.x, y: baseY, width: widthSum - 1, height: titlesHeight },
    swimlaneDividerY: { y1: baseY, y2: contentBottomY },
  };
}

// `LaneOrigin`/`computeLaneOrigins` and its supporting helpers moved to
// `swimlane-lane-origins.ts` (this file's own 500-line hook, mission
// `activity-loop-lane-translate` T1) -- pure move, re-imported below so the
// one call site in `placeSwimlanes` is unchanged.

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
 * D6's three middle-Y shapes for a cross-lane 4-point jog. `'default'` is
 * `ConnectionVerticalDown#drawTranslate`'s average of both endpoints
 * (`ConnectionVerticalDown.java:87-100`); `'parallel-in'`/`'parallel-out'`
 * are the fork/split builders' bar-relative offsets (see the module doc
 * for the four `file:line` citations) -- `mp1`/`mp2` there are always the
 * bar-side / branch-side endpoint respectively (`pushBranchConnectors`,
 * `walk-fork-branches.ts`, emits bar-to-branch as `[bar, branch]` and
 * branch-to-join as `[branch, join]`, so `mp1.y`/`mp2.y` already select
 * the right endpoint without a shape-specific swap).
 */
function crossLaneMiddleY(shape: EdgeShape, mp1: GPoint, mp2: GPoint): number {
  switch (shape) {
    case 'parallel-in':
    case 'if-vertical-in':
      return mp1.y + 4;
    case 'parallel-out':
      return mp2.y - 14;
    default:
      // 'default' + every loop kind -- the latter never reach here in
      // practice ({@link routeEdge} dispatches on `EdgeMeta.loop` first).
      return (mp1.y + mp2.y) / 2;
  }
}

/** {@link routeEdge}'s return (D3): a non-loop path is one edge, no
 *  reservations; a dispatched translate shape may return more of either. */
interface RoutedEdge {
  readonly edges: ActivityEdgeGeo[];
  readonly reservations: Reservation[];
}

/**
 * D3/T1b's meta-repeating rule, split out as a pure function so it is
 * unit-testable directly: no stub in this mission yet returns more than one
 * edge (`stop-1-edgemeta-zip.md`), so there is no production path that
 * drives `count > 1` end to end today.
 */
export function repeatEdgeMeta(meta: EdgeMeta, count: number): EdgeMeta[] {
  return Array.from({ length: count }, () => meta);
}

/** `lane`'s own delta, or 0 when the endpoint carries no lane. */
function laneDelta(lane: string | undefined, deltas: ReadonlyMap<string, number>): number {
  return lane !== undefined ? (deltas.get(lane) ?? 0) : 0;
}

/** True only when both endpoints are laned and the lanes differ. */
function isCrossLane(meta: EdgeMeta): boolean {
  return meta.lane1 !== undefined && meta.lane2 !== undefined && meta.lane1 !== meta.lane2;
}

/**
 * Same-lane edges shift uniformly. A cross-lane edge tagged with a
 * {@link LoopTranslate} (D1) delegates to `routeLoopTranslate`; any other
 * cross-lane edge draws the generic 4-point jog (module doc); only the
 * path's two endpoints matter, never the same-lane shape's interior elbow.
 */
function routeEdge(edge: ActivityEdgeGeo, meta: EdgeMeta, deltas: ReadonlyMap<string, number>): RoutedEdge {
  const d1 = laneDelta(meta.lane1, deltas);
  const d2 = laneDelta(meta.lane2, deltas);

  if (!isCrossLane(meta)) {
    return { edges: [{ ...edge, points: shiftPoints(edge.points, d1) }], reservations: [] };
  }

  if (meta.loop !== undefined) {
    return routeLoopTranslate(meta.loop, edge, d1, d2);
  }

  const p1 = edge.points[0]!;
  const p2 = edge.points[edge.points.length - 1]!;
  const mp1 = { x: p1.x + d1, y: p1.y };
  const mp2 = { x: p2.x + d2, y: p2.y };
  const middle = crossLaneMiddleY(meta.shape, mp1, mp2);
  return {
    edges: [{ ...edge, points: [mp1, { x: mp1.x, y: middle }, { x: mp2.x, y: middle }, mp2] }],
    reservations: [],
  };
}

/**
 * Every input `placeSwimlanes` needs, bundled to keep the function's own
 * parameter count under the file's limit -- these values are always
 * supplied together by `assignCoordinates`, never independently.
 */
export interface PlacementInput {
  readonly nodes: readonly ActivityNodeGeo[];
  readonly edges: readonly ActivityEdgeGeo[];
  readonly edgeMeta: readonly EdgeMeta[];
  readonly laneNames: readonly string[];
  readonly baseX: number;
  /** The swimlane block's own top -- every divider's `UEmpty(x1+x2, 1)`
   *  reservation sits here, OUTSIDE the title-band translate
   *  (`Swimlanes.java:337`'s divider draw takes no `dy`). Mission
   *  `activity-klimt-compress` T3. */
  readonly baseY: number;
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
  const { nodes, edges, edgeMeta, laneNames, baseX, baseY, bounder, theme } = input;
  if (laneNames.length === 0) {
    return { nodes: [...nodes], edges: [...edges], edgeMeta: [...edgeMeta], swimlanes: [], reservations: [] };
  }

  const { widths, min } = measureLanes(nodes, laneNames, bounder, theme);
  const { origins, dividerReservations } = computeLaneOrigins(laneNames, widths, min, baseX);

  const deltas = new Map<string, number>();
  const swimlanes: SwimlaneGeo[] = [];
  for (const name of laneNames) {
    const origin = origins.get(name)!;
    deltas.set(name, origin.delta);
    swimlanes.push(origin.geo);
  }

  const dividerGeo: Reservation[] = dividerReservations.map((d) => ({ x: d.x, y: baseY, width: d.width, height: 1 }));
  // D3/D4: a routed edge may expand to >1 edge/reservation -- flat-map both.
  const routed = edges.map((e, i) => routeEdge(e, edgeMeta[i]!, deltas));

  return {
    nodes: nodes.map((n) => shiftNode(n, deltas)),
    edges: routed.flatMap((r) => r.edges),
    edgeMeta: routed.flatMap((r, i) => repeatEdgeMeta(edgeMeta[i]!, r.edges.length)),
    swimlanes,
    reservations: [...dividerGeo, ...routed.flatMap((r) => r.reservations)],
  };
}
