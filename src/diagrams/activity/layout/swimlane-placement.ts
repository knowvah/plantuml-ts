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

import type { StringBounder, Tile } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import type {
  ActivityEdgeGeo,
  ActivityNodeGeo,
  SwimlaneBandGeo,
  SwimlaneDividerY,
  SwimlaneGeo,
} from '../activity-layout-types.js';
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
import type { Reservation } from './hexagon-reservations.js';

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
}

/** D6: the two fork/split cross-lane elbow shapes, plus the fallback every
 * other connection type uses. */
export type EdgeShape = 'parallel-in' | 'parallel-out' | 'default';

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

interface LaneOrigin {
  readonly delta: number;
  readonly geo: SwimlaneGeo;
}

interface LaneOrigins {
  readonly origins: Map<string, LaneOrigin>;
  readonly dividerReservations: DividerReservation[];
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
/** One divider's `UEmpty(x1+x2, 1)` reservation, in block-relative X only
 *  -- {@link placeSwimlanes} adds `y: baseY` and `height: 1`. */
interface DividerReservation {
  readonly x: number;
  readonly width: number;
}

interface LaneDividers {
  readonly dividerX: number[];
  readonly contentLeft: number[];
  readonly dividerReservations: DividerReservation[];
}

/**
 * The trailing "special" divider (the `i === n` empty lane closing the
 * last real lane's span): its content and minX are both 0
 * (`MinMax.getEmpty(true)`), so `xx_n` reduces to `xpos + dividerWidth_n +
 * min / 2` and the divider itself to `xpos + x1_n + min / 2` (`min`
 * already resolved, never negative -- see `resolveSwimlaneMinWidth`, so
 * this is `Math.max(min, 0) / 2`). Split from {@link computeDividers} only
 * to keep that function's own NLOC under the file's limit.
 */
function trailingDivider(
  laneNames: readonly string[],
  inputs: readonly LaneWidthInput[],
  min: number,
  xpos: number,
): { dividerX: number; reservation: DividerReservation } {
  const x1n = halfMissingSpace(laneNames.length, inputs, min);
  const x2n = halfMissingSpace(laneNames.length + 1, inputs, min);
  return { dividerX: xpos + x1n + min / 2, reservation: { x: xpos, width: x1n + x2n } };
}

/**
 * The origin loop itself (`Swimlanes.java:416-431`), split from {@link
 * computeLaneOrigins} only to keep both under the file's function-length
 * limit -- `dividerX`/`contentLeft` are two views of the SAME loop
 * variable, never independently meaningful, so returning them as a pair
 * rather than merging further is the natural seam. `dividerReservations`
 * is each boundary's `LaneDivider#drawU` `UEmpty(x1+x2, 1)`
 * (`LaneDivider.java:85-97`), at its own `xpos` -- BEFORE this divider's
 * own `x1` padding -- matching `Swimlanes.java:347-348`'s `ug.apply
 * (UTranslate.dx(xpos - dividerWith))` composed with `LaneDivider#drawU`'s
 * own local `UEmpty` at (0, 0).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/LaneDivider.java:85-97
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
  const dividerReservations: DividerReservation[] = [];
  let xpos = blockOriginX;
  for (let i = 0; i < laneNames.length; i++) {
    const w = widths.get(laneNames[i]!)!;
    const x1 = halfMissingSpace(i, inputs, min);
    const x2 = halfMissingSpace(i + 1, inputs, min);
    const dividerWidth = x1 + x2;
    const left = xpos + dividerWidth + (w.width - w.contentWidth) / 2;
    contentLeft.push(left);
    dividerX.push(left - x2);
    dividerReservations.push({ x: xpos, width: dividerWidth });
    xpos += w.width + dividerWidth;
  }
  const trailing = trailingDivider(laneNames, inputs, min, xpos);
  dividerX.push(trailing.dividerX);
  dividerReservations.push(trailing.reservation);
  return { dividerX, contentLeft, dividerReservations };
}

/** One lane's {@link LaneOrigin}, split from {@link computeLaneOrigins}
 *  only to keep that function's own NLOC under the file's limit. */
function buildLaneOrigin(name: string, w: LaneWidth, x: number, width: number, left: number): LaneOrigin {
  return {
    delta: left - w.contentMinX,
    geo: {
      name,
      x,
      width,
      contentWidth: w.contentWidth,
      titleWidth: w.titleWidth,
      contentMinX: w.contentMinX,
      contentX: left,
    },
  };
}

function computeLaneOrigins(
  laneNames: readonly string[],
  widths: ReadonlyMap<string, LaneWidth>,
  min: number,
  blockOriginX: number,
): LaneOrigins {
  const inputs: LaneWidthInput[] = laneNames.map((name) => {
    const w = widths.get(name)!;
    return { contentWidth: w.contentWidth, titleWidth: w.titleWidth };
  });
  const { dividerX, contentLeft, dividerReservations } = computeDividers(laneNames, widths, inputs, min, blockOriginX);

  const origins = new Map<string, LaneOrigin>();
  for (let i = 0; i < laneNames.length; i++) {
    const name = laneNames[i]!;
    const w = widths.get(name)!;
    const width = dividerX[i + 1]! - dividerX[i]!;
    origins.set(name, buildLaneOrigin(name, w, dividerX[i]!, width, contentLeft[i]!));
  }
  return { origins, dividerReservations };
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
      return mp1.y + 4;
    case 'parallel-out':
      return mp2.y - 14;
    case 'default':
      return (mp1.y + mp2.y) / 2;
  }
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
  const middle = crossLaneMiddleY(meta.shape, mp1, mp2);
  return {
    ...edge,
    points: [mp1, { x: mp1.x, y: middle }, { x: mp2.x, y: middle }, mp2],
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
    return { nodes: [...nodes], edges: [...edges], swimlanes: [], reservations: [] };
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

  const reservations: Reservation[] = dividerReservations.map((d) => ({ x: d.x, y: baseY, width: d.width, height: 1 }));

  return {
    nodes: nodes.map((n) => shiftNode(n, deltas)),
    edges: edges.map((e, i) => routeEdge(e, edgeMeta[i]!, deltas)),
    swimlanes,
    reservations,
  };
}
