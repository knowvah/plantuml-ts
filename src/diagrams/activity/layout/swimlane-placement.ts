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
 *   and `FtileWhile.java:200-214` use the byte-identical `(mp1a.y +
 *   mp2b.y) / 2` middle-Y shape, covering every if/while/repeat/switch
 *   composite boundary.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderFork.java:166-184
 *   -- `ConnectionIn#drawTranslate`: `middle = mp1a.getY() + 4`, ported
 *   below as {@link routeEdge}'s `'parallel-in'` case.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderFork.java:220-241
 *   -- `ConnectionOut#drawTranslate`: `middle = mp2b.getY() - 14`, ported
 *   below as {@link routeEdge}'s `'parallel-out'` case.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderSplit.java:207-225,264-285
 *   -- same `+4`/`-14` shapes for the split's in/out connectors.
 */

import type { StringBounder } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import type {
  ActivityEdgeGeo,
  ActivityNodeGeo,
  SwimlaneBandGeo,
  SwimlaneDividerY,
  SwimlaneGeo,
} from '../activity-geometry.types.js';
import type { GPoint } from '../tiles/points.js';
import { resolveInlineLinks } from '../../../core/url/inline-links.js';
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
import { routeHline, type HlinePayload } from './swimlane-hline.js';
import { computeLaneOrigins } from './swimlane-lane-origins.js';
import { sameLaneEdges } from './swimlane-measure-edges.js';
import { isBigDiamondDuplicate, withoutBigDiamondDuplicateTag } from './switch-swimlane-duplicate.js';

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
  /** T1p-g: set only on `FtileIfWithLinks`/`FtileIfLongHorizontal`'s
   * `ConnectionHline` (`walk-if-with-links.ts#connectionHlineLinks`,
   * `walk-if-long-horizontal.ts#connectionHline`). When set, {@link
   * routeEdge} delegates to `swimlane-hline.ts#routeHline` BEFORE the
   * normal same/cross-lane dispatch -- this connector fans out to
   * several lanes, never a single uniform shift. `lane1`/`lane2` stay
   * the walker's own unlaned `myLane` tag, read only by `measureLanes`'
   * `sameLaneEdges` (this module doc's own citation for why that keeps
   * measurement byte-identical to pre-T1p-g). */
  readonly hline?: HlinePayload;
  /**
   * T1b (D1): the `FtileGroup`/`partition` nesting active at `pushEdge`
   * time (`undefined` = top level) -- a nested `UGraphicForSnake` flushes
   * before its outer one, so two edges merge only when this matches.
   * Read by `layout/snake-merge.ts`; propagated via `repeatEdgeMeta` for
   * every routed edge except `routeHline`'s fan-out (always `NONE`
   * strategy, so scope never matters there).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGroup.java
   */
  readonly scope?: string;
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
export type EdgeShape =
  | 'parallel-in' | 'parallel-out' | 'parallel-in-split' | 'parallel-out-split'
  | 'if-vertical-in' | 'default' | LoopTranslate['kind'];

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
 * The ASCENT fraction a title's baseline sits at within the band, from
 * `StringBounder#getDescent` = `size / 4.5` (`klimt/font/StringBounder
 * .java:47`) -- the SAME ratio `activity-renderer-shapes.ts#ASCENT_FRACTION`
 * uses for every other activity label. Lives here (not the renderer) so
 * `canvas-origin.ts#extendForSwimlaneTitles` (T3i) can share the exact
 * baseline-Y the renderer draws at, rather than re-deriving it -- layout
 * owns shared geometric constants, the renderer only consumes them.
 * Verified against two pinned fixtures: `sikino-19-vuca111`
 * (`SwimlaneTitleFontSize 8`, band y=16) -> baseline 22.222 = 16 + 8*7/9;
 * `pakema-21-xema183` (default 18, band y=17.5) -> baseline 31.5 = 17.5 +
 * 18*7/9. Both exact.
 */
export const TITLE_ASCENT_FRACTION = 1 - 1 / 4.5;

// `measureSwimlaneTitlesHeight`/`SwimlaneVertical`/`resolveSwimlaneVertical`
// moved to `swimlane-vertical.ts` (mission `activity-divergence-drive-2`
// T1p-g, this file's own 500-line hook); re-exported below so existing
// importers (`assign-coordinates-full.ts`, this file's own tests) are
// untouched.
export { measureSwimlaneTitlesHeight, resolveSwimlaneVertical } from './swimlane-vertical.js';
export type { SwimlaneVertical } from './swimlane-vertical.js';

export interface SwimlaneChrome {
  swimlaneBand: SwimlaneBandGeo;
  swimlaneDividerY: SwimlaneDividerY;
}

/**
 * Derives the band rect and the divider Y-range from the already-placed
 * lane geometry ({@link placeSwimlanes}'s own `swimlanes` output) plus the
 * block's own top (`baseY`) and content bottom (`contentBottomY` -- the
 * real content's own bottom edge, `bounds.maxY` shifted by the SAME
 * `canvas-origin.ts#computeCanvasOrigin` translate `baseY` itself already
 * carries; T1a (D2) replaced the flat `totalHeight - LAYOUT_MARGIN` this
 * used to be with that dynamic shift -- see `assign-coordinates-full.ts
 * #finalizeGeometry`, the one caller).
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

/**
 * T1p-f: a BIG_DIAMOND switch's leaf case tile (`switch-swimlane-
 * duplicate.ts`'s own tag) is drawn once per lane, not shifted into its
 * OWN lane alone -- `Swimlanes#drawWhenSwimlanes` re-walks the whole
 * tree once per lane (module doc), and the case tile's bypassed draw
 * call (`FtileSwitchWithDiamonds.java:136-138`) is reached, ungated, on
 * EVERY one of those passes. One copy per `laneNames` entry, each at
 * that lane's own delta from the SAME pre-shift `x` {@link shiftNode}
 * would have used.
 */
function placeNode(
  node: ActivityNodeGeo,
  laneNames: readonly string[],
  deltas: ReadonlyMap<string, number>,
): ActivityNodeGeo[] {
  if (!isBigDiamondDuplicate(node)) return [shiftNode(node, deltas)];
  return laneNames.map((lane) =>
    withoutBigDiamondDuplicateTag({ ...node, x: node.x + (deltas.get(lane) ?? 0), swimlane: lane }),
  );
}

function shiftPoints(points: readonly GPoint[], delta: number): GPoint[] {
  if (delta === 0) return [...points];
  return points.map((p) => ({ x: p.x + delta, y: p.y }));
}

/**
 * D6's three middle-Y shapes for a cross-lane 4-point jog. `'default'` is
 * `ConnectionVerticalDown#drawTranslate`'s average of both endpoints
 * (`ConnectionVerticalDown.java:87-100`); `'parallel-in'`/`'parallel-out'`
 * (fork/merge) and their `-split` siblings (SAME elbow geometry, only the
 * X-skip in `compress/shapes-of.ts` differs by builder kind) are the
 * fork/split builders' bar-relative offsets (module doc citations) --
 * `mp1`/`mp2` are always the bar-side/branch-side endpoint
 * (`walk-fork-branches.ts` emits `[bar, branch]`/`[branch, join]`).
 */
function crossLaneMiddleY(shape: EdgeShape, mp1: GPoint, mp2: GPoint): number {
  switch (shape) {
    case 'parallel-in':
    case 'parallel-in-split':
    case 'if-vertical-in':
      return mp1.y + 4;
    case 'parallel-out':
    case 'parallel-out-split':
      return mp2.y - 14;
    default:
      // 'default' + every loop kind -- the latter never reach here in
      // practice ({@link routeEdge} dispatches on `EdgeMeta.loop` first).
      return (mp1.y + mp2.y) / 2;
  }
}

/** {@link routeEdge}'s return (D3): a non-loop path is one edge, no
 *  reservations; a dispatched translate shape may return more of either.
 *  `edgeMeta` (T1p-g): set only by the `hline` branch, one entry per
 *  `edges` entry, each carrying ITS OWN lane -- `edge-draw-order.ts`
 *  needs the per-edge lane, not the walker's original (now-stale)
 *  `meta` tag every OTHER branch's caller still repeats via {@link
 *  repeatEdgeMeta}. */
interface RoutedEdge {
  readonly edges: ActivityEdgeGeo[];
  readonly reservations: Reservation[];
  readonly edgeMeta?: EdgeMeta[];
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
 * `meta.hline` (T1p-g) dispatches FIRST, before either lane check: a
 * `ConnectionHline` fans out to several lanes, each shifted by ITS OWN
 * delta -- never the single uniform shift either branch below applies.
 */
function routeEdge(
  edge: ActivityEdgeGeo,
  meta: EdgeMeta,
  deltas: ReadonlyMap<string, number>,
  laneNames: readonly string[],
): RoutedEdge {
  if (meta.hline !== undefined) {
    const routed = routeHline(meta.hline, edge, laneNames, deltas);
    return { edges: routed.edges, reservations: [], edgeMeta: routed.edgeMeta };
  }

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

/** {@link measureLanes}'s own inputs, bundled to keep that function under
 *  the file's 5-parameter limit (T3i's same-lane `edges`/`edgeMeta` would
 *  be a 5th/6th). */
interface MeasureLanesInput {
  readonly nodes: readonly ActivityNodeGeo[];
  readonly edges: readonly ActivityEdgeGeo[];
  readonly edgeMeta: readonly EdgeMeta[];
  readonly laneNames: readonly string[];
  readonly bounder: StringBounder;
  readonly theme: Theme;
}

// `sameLaneEdges` moved to `swimlane-measure-edges.ts` (add4-T1b, this
// file's own 500-line hook).

/**
 * T1p-f: `computeDrawingWidths`'s own draw-interception pass
 * (`Swimlanes.java:379-395`) measures widths through
 * `UGraphicInterceptorAllSwimlanes` (`vcompact/
 * UGraphicInterceptorAllSwimlanes.java:88-99`), which has the SAME
 * bypass as the draw pass itself: `FtileSwitchWithDiamonds#drawU`'s
 * direct `tile.drawU(...)` call (`switch-swimlane-duplicate.ts`'s own
 * doc) skips `withActiveSwimlanes`' narrowing, so a bypassed case tile's
 * own shapes get dispatched to EVERY still-active lane's `LimitFinder`,
 * not just its own tag's -- widening every lane's measured content to
 * fit the duplicate, not only the lane it is structurally tagged to.
 * One {@link LaneItem} per {@link laneNames} entry for a tagged node,
 * mirroring {@link placeNode}'s own per-lane fan-out.
 */
function laneItemsOf(node: ActivityNodeGeo, laneNames: readonly string[]): LaneItem[] {
  if (!isBigDiamondDuplicate(node)) {
    return [
      node.swimlane !== undefined
        ? { swimlane: node.swimlane, kind: node.kind, x: node.x, width: node.width }
        : { kind: node.kind, x: node.x, width: node.width },
    ];
  }
  return laneNames.map((lane) => ({ swimlane: lane, kind: node.kind, x: node.x, width: node.width }));
}

/**
 * `computeDrawingWidths` (`Swimlanes.java:379-395`) plus the `min`
 * resolution step from `computeSizeInternal` (`:399-403`) -- measures
 * each lane's content extent and title width, then resolves the lane
 * width floor once so both `computeLaneWidths` and the origin loop reuse
 * the SAME resolved value (upstream does too, `:399` then `:409,441`).
 * SLURL: title width uses `resolveInlineLinks`, not raw `|[[url]]|`
 * markup (`getTitle`, `Swimlanes.java:285-293`); `nesozi-09-zezu092`.
 */
function measureLanes(input: MeasureLanesInput): { widths: Map<string, LaneWidth>; min: number } {
  const { nodes, edges, edgeMeta, laneNames, bounder, theme } = input;
  const items: LaneItem[] = nodes.flatMap((n) => laneItemsOf(n, laneNames));
  const extents = measureLaneExtents(items, sameLaneEdges(edges, edgeMeta), laneNames);

  const titleFontSize = swimlaneTitleFontSize(theme);
  const titleWidths = new Map<string, number>();
  for (const name of laneNames)
    titleWidths.set(name, bounder.getDimension(resolveInlineLinks(name), titleFontSize).width);

  // `skinparam swimlaneWidth` (`Swimlanes.java:399`); absent reads `0`,
  // not the `"same"` sentinel (`SkinParam.java:1121-1130`).
  const contentWidths = [...extents.values()].map((e) => e.maxX - e.minX);
  const min = resolveSwimlaneMinWidth(contentWidths, theme.swimlaneWidth ?? 0);

  return { widths: computeLaneWidths(extents, titleWidths, min), min };
}

/**
 * Orchestrates T4 + the origin loop + the shift, called once from
 * `assignCoordinates` after the pass-1 single-column walk. Returns
 * pass-1's `nodes`/`edges` byte-identical (same array contents, new
 * arrays) when there are no swimlanes -- acceptance criterion "no
 * swimlanes -> byte-identical geometry". A SINGLE named lane gets the
 * same passthrough (T3i, `bulasi-17-vafa634`): `Swimlanes#ensureSizeComputed`
 * only runs `computeSizeInternal` -- the ENTIRE origin-loop/translate
 * mechanism this function ports -- `if (swimlanes().size() > 1)`
 * (`Swimlanes.java:224-226`); `drawU`'s own `size() > 1` guard (`:253`)
 * then skips `drawWhenSwimlanes` too, so a one-lane diagram draws through
 * the plain `full.drawU(ug)` branch with no swimlane translate applied at
 * all -- the SAME `<= 1` convention `resolveSwimlaneVertical`/
 * `computeSwimlaneChrome` (this file) already use. Before this fix, a
 * single named lane still ran the full origin loop, giving it a non-zero
 * `delta` no upstream diagram ever gets.
 */
export function placeSwimlanes(input: PlacementInput): PlacementResult {
  const { nodes, edges, edgeMeta, laneNames, baseX, baseY, bounder, theme } = input;
  if (laneNames.length <= 1) {
    return { nodes: [...nodes], edges: [...edges], edgeMeta: [...edgeMeta], swimlanes: [], reservations: [] };
  }

  const { widths, min } = measureLanes({ nodes, edges, edgeMeta, laneNames, bounder, theme });
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
  const routed = edges.map((e, i) => routeEdge(e, edgeMeta[i]!, deltas, laneNames));

  return {
    nodes: nodes.flatMap((n) => placeNode(n, laneNames, deltas)),
    edges: routed.flatMap((r) => r.edges),
    edgeMeta: routed.flatMap((r, i) => r.edgeMeta ?? repeatEdgeMeta(edgeMeta[i]!, r.edges.length)),
    swimlanes,
    reservations: [...dividerGeo, ...routed.flatMap((r) => r.reservations)],
  };
}
