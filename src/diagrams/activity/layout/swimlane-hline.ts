/**
 * Swimlane-aware extent for the `ConnectionHline` closing bar both
 * `FtileIfWithLinks`/`FtileIfLongHorizontal` draw for `ConditionEndStyle
 * .HLINE`: under swimlanes, `Swimlanes#drawWhenSwimlanes` redraws the
 * WHOLE tree once per lane (`Swimlanes.java:328-343`), so
 * `ConnectionHline#drawU` runs once per pass too, each time choosing a
 * DIFFERENT, pass-local extent via `getMinmax` -- clipped to the lanes
 * that actually contain a branch outcome, NaN (no draw at all) outside
 * them.
 *
 * Ported as a `swimlane-placement.ts#routeEdge` dispatch case (D3: "a
 * routed edge may expand to >1 edge", the SAME extension point
 * `routeLoopTranslate` already uses), NOT a separate pre/post-process
 * step: `measureLanes` (`swimlane-placement.ts`) runs BEFORE `routeEdge`
 * and reads the edge's own UNTOUCHED `.points` (still the walker's own
 * `getMinmaxSimple`-derived extent, tagged `myLane`/`myLane` exactly as
 * before T1p-g) -- so the width-measurement contribution this connector
 * makes is byte-identical to the pre-T1p-g port, and only `routeEdge`'s
 * OWN dispatch (which runs strictly AFTER measurement) ever sees this
 * module's per-lane expansion. Mirrors `UGraphicInterceptorAllSwimlanes`
 * `.draw`'s own `Connection` branch (`vcompact/
 * UGraphicInterceptorAllSwimlanes.java:129-143`): `ConnectionHline`'s
 * `tile1`/`tile2` are always `null` (`super(null, null)`), so EVERY
 * active swimlane's `UGraphicForSnake` measurer gets the SAME
 * `getMinmaxSimple` extent during `computeDrawingWidths`
 * (`Swimlanes.java:378-395`) -- `ug instanceof UGraphicInterceptorOneSwimlane`
 * is false there (the measurer is a `UGraphicForSnake`, never that
 * interceptor), so `ConnectionHline#drawU` never reaches its own
 * per-lane `getMinmax` branch during measurement, only during the REAL
 * draw pass. (Confirmed empirically: routing the expanded per-lane
 * edges through `measureLanes` too -- this module's first implementation
 * -- widened `jucidi-98-zato093`'s "High" lane by the WHOLE tile's own
 * left-edge term and regressed its score 169 -> 179.)
 *
 * Our tile/node model carries exactly ONE lane per node
 * (`swimlane-lanes.ts`'s own doc), never a `Set<Swimlane>`, so
 * `ftileDoesOutcomeInThatSwimlane`'s `getSwimlaneOut() == swimlane &&
 * getSwimlanes().contains(swimlane)` degenerates to the single equality
 * check below.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:459-527
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:518-599
 */

import type { ActivityEdgeGeo } from '../activity-geometry.types.js';

/**
 * One `ConnectionHline`-eligible out-point: `FtileIfWithLinks`'s
 * `tile1`/`tile2`, or `FtileIfLongHorizontal`'s per-branch/`tile2`
 * equivalents -- always already filtered to `hasPointOut()` by the
 * caller (the walker), mirroring `allTiles`'s own filter inside
 * `getMinmax`'s loop.
 */
export interface HlineCandidate {
  readonly x: number;
  readonly lane: string | undefined;
}

/**
 * `low`/`high` are the Java's local `0`/`totalDim.getWidth()`, already
 * shifted into this builder's own absolute pass-1 origin (its own `x`,
 * `x + t.width`) -- every OTHER value here (`candidates[].x`,
 * `unfiltered[]`) is absolute too, so {@link getMinmax}'s folded min/max
 * stays in that one frame throughout (the SAME frame `routeHline`'s own
 * per-lane shift adds a delta to). `unfiltered`:
 * `FtileIfLongHorizontal#getLeftOut` (`:512-517`), this tile's OWN output
 * point, folded into EVERY in-range lane's extent unconditionally (never
 * swimlane-filtered) -- empty for `FtileIfWithLinks`, whose `getMinmax`
 * has no such term.
 */
export interface HlinePayload {
  readonly low: number;
  readonly high: number;
  readonly candidates: readonly HlineCandidate[];
  readonly unfiltered: readonly number[];
  /**
   * add4-T1b: the enclosing tile's own `getSwimlanes()`
   * (`FtileIfLongHorizontal.java:131-141`). During `computeDrawingWidths`
   * (`Swimlanes.java:378-394`) the measurer is `UGraphicInterceptorAllSwimlanes`,
   * whose `Connection` branch (`vcompact/UGraphicInterceptorAllSwimlanes
   * .java:88-101`) treats this connector's `null`/`null` tiles as
   * contained in EVERY active lane -- the active set narrowed to this
   * tile's own lanes when the tile itself was dispatched (`:63-69`). So the
   * unlaned `getMinmaxSimple` edge widens every one of these lanes'
   * `LimitFinder`, not just the walker's `myLane`
   * (`swimlane-placement.ts#sameLaneEdges`). Absent = `myLane` only.
   */
  readonly measureLanes?: readonly string[];
}

/** @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:525-527
 *  @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:597-599
 *  -- single-lane-per-node model, see module doc. */
function ftileDoesOutcomeInThatSwimlane(candidate: HlineCandidate, swimlane: string): boolean {
  return candidate.lane === swimlane;
}

/** @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:518-523
 *  @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:588-595 */
function atLeastOne(candidates: readonly HlineCandidate[], swimlane: string): boolean {
  return candidates.some((c) => ftileDoesOutcomeInThatSwimlane(c, swimlane));
}

/**
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:502-508
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:565-571
 * -- mirrors the Java's own `throw` on an all-empty search. Provably
 * unreachable: both walkers only push a `ConnectionHline` when at least
 * one candidate has a point out, and {@link routeHline} is only ever
 * reached for a cross-lane-capable diagram (`laneNames.length > 1`,
 * `swimlane-placement.ts#placeSwimlanes`'s own early-return guard).
 */
function getFirstSwimlane(candidates: readonly HlineCandidate[], laneNames: readonly string[]): number {
  for (let i = 0; i < laneNames.length; i++) if (atLeastOne(candidates, laneNames[i]!)) return i;
  throw new Error('ConnectionHline.getMinmax: no swimlane contains a branch outcome');
}

/** @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:510-516
 *  @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:573-579 */
function getLastSwimlane(candidates: readonly HlineCandidate[], laneNames: readonly string[]): number {
  for (let i = laneNames.length - 1; i >= 0; i--) if (atLeastOne(candidates, laneNames[i]!)) return i;
  throw new Error('ConnectionHline.getMinmax: no swimlane contains a branch outcome');
}

/**
 * This lane pass's own `[minX, maxX]`, or `null` for the Java's
 * `{NaN, NaN}` (this lane draws nothing at all).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:459-485
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:518-547
 */
function getMinmax(
  payload: HlinePayload,
  current: number,
  laneNames: readonly string[],
): { minX: number; maxX: number } | null {
  const { low, high, candidates, unfiltered } = payload;
  const first = getFirstSwimlane(candidates, laneNames);
  const last = getLastSwimlane(candidates, laneNames);
  if (current < first || current > last) return null;

  let minX = current === first ? high : low;
  let maxX = current === last ? low : high;
  for (const u of unfiltered) {
    minX = Math.min(minX, u);
    maxX = Math.max(maxX, u);
  }
  const swimlane = laneNames[current]!;
  for (const c of candidates) {
    if (!ftileDoesOutcomeInThatSwimlane(c, swimlane)) continue;
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x);
  }
  return { minX, maxX };
}

/** One expanded edge's own meta: `lane1 === lane2 === <that lane>`,
 *  structurally compatible with `swimlane-placement.ts#EdgeMeta` (never
 *  imports that type -- a leaf module, see the module doc) so `routeEdge`
 *  can push it straight into its own `EdgeMeta[]` output. Each expanded
 *  edge needs ITS OWN lane here, not the walker's original `myLane` tag:
 *  `edge-draw-order.ts#passOf` groups edges by this field to mirror
 *  upstream's per-lane redraw SEQUENCE (`Swimlanes.java:328-347`), and
 *  `myLane` for every expanded edge would wrongly group them all into
 *  ONE pass instead of each into its own. */
export interface RoutedHlineMeta {
  readonly lane1: string;
  readonly lane2: string;
  readonly shape: 'default';
}

/** `routeHline`'s own return, matching `swimlane-placement.ts#RoutedEdge`
 *  structurally (never imports that type -- a leaf module, see the
 *  module doc) so `routeEdge` can return it directly. */
export interface RoutedHline {
  readonly edges: ActivityEdgeGeo[];
  readonly edgeMeta: RoutedHlineMeta[];
}

/**
 * Called from `swimlane-placement.ts#routeEdge`, which already has
 * `laneNames`/`deltas` in scope -- dispatches BEFORE the normal same/
 * cross-lane logic (this connector is neither: it fans out to SEVERAL
 * lanes, each shifted by ITS OWN delta, never a single uniform shift).
 * One edge per in-range lane (`getMinmax` non-`null`); zero edges when
 * no lane is in range (provably unreachable per {@link getFirstSwimlane}'s
 * own doc, but falls out of the loop naturally rather than needing a
 * separate guard). Both output points share `edge`'s own `y` (the
 * closing bar is always horizontal).
 */
export function routeHline(
  payload: HlinePayload,
  edge: ActivityEdgeGeo,
  laneNames: readonly string[],
  deltas: ReadonlyMap<string, number>,
): RoutedHline {
  const y = edge.points[0]!.y;
  const edges: ActivityEdgeGeo[] = [];
  const edgeMeta: RoutedHlineMeta[] = [];
  for (let i = 0; i < laneNames.length; i++) {
    const range = getMinmax(payload, i, laneNames);
    if (range === null) continue;
    const lane = laneNames[i]!;
    const delta = deltas.get(lane) ?? 0;
    edges.push({ ...edge, points: [{ x: range.minX + delta, y }, { x: range.maxX + delta, y }] });
    edgeMeta.push({ lane1: lane, lane2: lane, shape: 'default' });
  }
  return { edges, edgeMeta };
}
