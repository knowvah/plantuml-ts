/**
 * Rule (b) of mission `activity-edge-draw-order`: the order in which an
 * activity diagram's edges are DRAWN, when the diagram declares swimlanes.
 *
 * Upstream draws the whole diagram once per lane and then once more for the
 * lane crossings, so its edge run is lane-GROUPED where ours was in walk
 * order. `Swimlanes#drawWhenSwimlanes` loops over `swimlanesSpecial()` and
 * draws `full` through a `UGraphicInterceptorOneSwimlane` per lane
 * (`Swimlanes.java:328-347`), then builds one final `Cross` and draws
 * `full` through that too (`:350-352`). Only the `Connection`s are filtered
 * per pass; the boxes are re-drawn every pass at the same coordinates, so
 * this is an edge-order concern and nothing else. Connections are buffered
 * `Snake`s flushed at the end (`svek/UGraphicForSnake.java:137-165`), which
 * is why our node-then-edge split already matches and only the order WITHIN
 * the edge run needed fixing.
 *
 * Applied as the LAST step of `assignCoordinatesFull`, permuting
 * `geometry.edges` and `edgeMeta` together by ONE index array (D1,
 * `plans/activity-edge-draw-order/decisions.md`) — `compressGeometry` and
 * `shapesOf` read `edges[i]` with `edgeMeta[i]`
 * (`compress/shapes-of.ts:376-377`), so the two arrays are only ever
 * permuted as a pair (stop 9).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:318-353
 *   -- `drawWhenSwimlanes`: the per-lane pass loop, then the `Cross` pass.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/UGraphicInterceptorOneSwimlane.java:92-103
 *   -- `draw`: a `Connection` is drawn in this pass only when
 *   `tile1.getSwimlaneOut()` and `tile2.getSwimlaneIn()` are each null or
 *   equal to the pass's own lane (`contained1 && contained2`), ported below
 *   as {@link passOf}'s same-lane and lane-less branches.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:178-216
 *   -- `Cross#draw`: the final pass admits a `Connection` only when
 *   `tile1.getSwimlaneOut() != tile2.getSwimlaneIn()`, ported below as
 *   {@link passOf}'s `null` return.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:116-124
 *   -- `swimlanesSpecial`: the passes run over `swimlanesRaw` in
 *   DECLARATION order (D3). Its one appended empty trailing lane is not
 *   ported: it can hold no edge, so it contributes no index.
 */

import type { EdgeMeta } from './swimlane-placement.js';

/**
 * The lane whose pass draws this edge, or `null` for the final cross pass.
 *
 * The rule, in the order `.agent-notes/aedo-T1.md` Q1 states it:
 * 1. both ends resolve to the same defined lane -> that lane
 *    (`UGraphicInterceptorOneSwimlane.java:96-101`);
 * 2. both defined and different -> the cross pass
 *    (`Swimlanes.java:178-216`);
 * 3. either end `undefined` -> the FIRST pass it qualifies for, i.e. the
 *    known end's lane, or the first declared lane when both are undefined.
 *    A null lane is `contained` in EVERY pass upstream
 *    (`UGraphicInterceptorOneSwimlane.java:96-99`'s `== null` disjuncts), so
 *    the first pass is the one that draws it first.
 *
 * Branch 3 is unreachable from user markup — the jar latches
 * `SWIMLANE_FORBIDDEN` on the first non-swimlane instruction and rejects any
 * later `|lane|` (`activitydiagram3/ActivityDiagram3.java:80-91`), so in a
 * laned diagram every connection endpoint carries a lane (T1 measured 0 of
 * 59 laned baseline fixtures carrying an `undefined` end). It is kept as a
 * defined answer rather than a `throw` because it is unreachable through the
 * PARSER, not through the type.
 */
export function passOf(meta: EdgeMeta, laneNames: readonly string[]): string | null {
  const { lane1, lane2 } = meta;
  if (lane1 !== undefined && lane2 !== undefined) return lane1 === lane2 ? lane1 : null;
  return lane1 ?? lane2 ?? laneNames[0] ?? null;
}

/**
 * Which pass an edge belongs to, as a sortable rank: a lane's index in
 * declaration order, or `laneNames.length` for the cross pass, which runs
 * last (`Swimlanes.java:350-352`, after the loop at `:328-347`).
 *
 * A lane name outside `laneNames` cannot arise — `EdgeMeta`'s lanes are
 * resolved from the same `ast.swimlanes` that is passed here — and is ranked
 * with the cross pass rather than dropped, so this function can only ever
 * permute the edge list, never shorten it.
 */
function passRank(meta: EdgeMeta, laneNames: readonly string[]): number {
  const pass = passOf(meta, laneNames);
  if (pass === null) return laneNames.length;
  const index = laneNames.indexOf(pass);
  return index === -1 ? laneNames.length : index;
}

/**
 * Index order in which edges are drawn: each lane's own edges in
 * declaration order, then every cross-lane edge in walk order. Within one
 * pass the original walk order is preserved — upstream re-draws the SAME
 * `full` text block each pass and merely filters it, so a pass emits its
 * members in the order the block already holds them.
 *
 * The identity order when no lane is declared: `Swimlanes#drawGtile` runs
 * the per-lane passes only when `swimlanes().size() > 1`, drawing `full`
 * once otherwise (`Swimlanes.java:275-280`). With a single declared lane
 * every edge shares that lane and therefore one rank, so the stable sort
 * below returns the identity there too.
 */
export function lanePassOrder(meta: readonly EdgeMeta[], laneNames: readonly string[]): number[] {
  const identity = meta.map((_, i) => i);
  if (laneNames.length === 0) return identity;
  const ranks = meta.map((m) => passRank(m, laneNames));
  // Stable by construction: ties keep the smaller index, i.e. walk order.
  return identity.sort((a, b) => ranks[a]! - ranks[b]! || a - b);
}

/**
 * Applies one index order to both arrays, keeping them aligned (D1). Both
 * inputs are read-only and two fresh arrays are returned — `shapesOf` pairs
 * them by index (`compress/shapes-of.ts:376-377`), so they may only ever be
 * permuted together.
 */
export function applyEdgeDrawOrder<T>(
  edges: readonly T[],
  meta: readonly EdgeMeta[],
  order: readonly number[],
): { edges: T[]; edgeMeta: EdgeMeta[] } {
  return {
    edges: order.map((i) => edges[i]!),
    edgeMeta: order.map((i) => meta[i]!),
  };
}
