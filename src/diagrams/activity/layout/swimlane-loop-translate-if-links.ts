/**
 * `FtileIfWithLinks`'s three translatable cross-swimlane shapes (mission
 * `activity-divergence-drive-3`, T1c), dispatched from
 * `swimlane-loop-translate.ts#routeLoopTranslate`. Applies the two lane
 * deltas (`dx1`/`dx2`, same X-only translate every `LoopTranslate` shape
 * receives) to the untranslated `p1`/`p2`, then reproduces each Java
 * `drawTranslate` method's arithmetic term for term -- same shape this
 * family's siblings (`swimlane-loop-translate-{repeat,switch,while}.ts`)
 * already follow.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:90-367
 * @see net/sourceforge/plantuml/utils/Direction.java:107-112
 */

import type { ActivityEdgeGeo } from '../activity-geometry.types.js';
import type { GPoint } from '../tiles/points.js';
import { HEXAGON_HALF_SIZE } from './hexagon-reservations.js';
import type {
  IfLinksHThenVLoop,
  IfLinksVThenHDirectLoop,
  IfLinksVThenHLoop,
  LoopRouteResult,
} from './swimlane-loop-translate.js';

/**
 * `Direction.leftOrRight` (`utils/Direction.java:107-112`): which side `a`
 * sits on relative to `b`'s own x. Throws on a tie, mirroring upstream's
 * own `IllegalArgumentException` -- every call site here feeds it two
 * points from DIFFERENT swimlanes once laned, so the two x's are never
 * equal in a conforming fixture, same assumption the Java itself makes.
 */
function leftOrRight(a: GPoint, b: GPoint): 'LEFT' | 'RIGHT' {
  if (a.x < b.x) return 'LEFT';
  if (a.x > b.x) return 'RIGHT';
  throw new Error('leftOrRight: equal x');
}

/** Strips `emphasize` from an edge -- every `FtileIfWithLinks` connector's
 *  `drawTranslate` omits the `branchEmpty`-conditioned `emphasizeDirection`
 *  call its own `drawU` makes (confirmed by reading all three methods: none
 *  references `branchEmpty` at all), so the cross-lane shape must never
 *  inherit it from the same-lane push site's edge. `exactOptionalPropertyTypes`
 *  forbids `emphasize: undefined`, so the key is destructured away instead. */
function withoutEmphasize(edge: ActivityEdgeGeo): ActivityEdgeGeo {
  const { emphasize: _emphasize, ...base } = edge;
  return base;
}

/**
 * `ConnectionHorizontalThenVertical#drawTranslate` (`:148-173`): when the
 * translated direction (`Direction.leftOrRight`) differs from the
 * untranslated one, an extra unarrowed "small" detour snake draws FIRST
 * (`:159-165`), and the main snake starts from its last point instead of
 * `mp1`. The main snake always carries `MergeStrategy.LIMITED` (`:167`);
 * the detour snake never does (`:160`, no `.withMerge` call).
 */
export function routeIfLinksHThenV(
  loop: IfLinksHThenVLoop,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  const originalDirection = leftOrRight(loop.p1, loop.p2);
  const mp1 = { x: loop.p1.x + dx1, y: loop.p1.y };
  const mp2 = { x: loop.p2.x + dx2, y: loop.p2.y };
  const newDirection = leftOrRight(mp1, mp2);

  if (originalDirection === newDirection) {
    const points: GPoint[] = [mp1, { x: mp2.x, y: mp1.y }, mp2];
    return { edges: [{ ...edge, points, mergeable: 'LIMITED' }], reservations: [] };
  }

  const delta = (originalDirection === 'RIGHT' ? -1 : 1) * HEXAGON_HALF_SIZE;
  const detourEnd = { x: mp1.x + delta, y: mp1.y + loop.diamond1.height * 0.75 };
  const detour: ActivityEdgeGeo = {
    ...edge,
    points: [mp1, { x: mp1.x + delta, y: mp1.y }, detourEnd],
    arrowhead: false,
  };
  const main: ActivityEdgeGeo = {
    ...edge,
    points: [detourEnd, { x: mp2.x, y: detourEnd.y }, mp2],
    mergeable: 'LIMITED',
  };
  return { edges: [detour, main], reservations: [] };
}

/** `ConnectionVerticalThenHorizontal#drawTranslate`'s own `delta` term
 *  (`:255,270`): `1.5 * hexagonHalfSize`, signed from the UNTRANSLATED
 *  `x1`/`x2` -- split out so {@link routeIfLinksVThenH}'s two branches
 *  share one computation, keeping that function's own NLOC under the
 *  file's limit. */
function vThenHDelta(x1: number, x2: number): number {
  return (x2 > x1 ? -1 : 1) * 1.5 * HEXAGON_HALF_SIZE;
}

/**
 * `ConnectionVerticalThenHorizontal#drawTranslate`'s same-direction branch
 * (`:254-268`): a `MergeStrategy.LIMITED` unarrowed elbow to `mp2bc`, then a
 * SEPARATE `MergeStrategy.LIMITED` arrowed snake from `mp2bc` to `mp2b`.
 */
function vThenHSameDirection(
  edge: ActivityEdgeGeo,
  mp1a: GPoint,
  mp2b: GPoint,
  delta: number,
): LoopRouteResult {
  const middle = (mp1a.y + mp2b.y) / 2;
  const mp2bc = { x: mp2b.x + delta, y: mp2b.y };
  const base = withoutEmphasize(edge);
  const main: ActivityEdgeGeo = {
    ...base,
    points: [mp1a, { x: mp1a.x, y: middle }, { x: mp2bc.x, y: middle }, mp2bc],
    arrowhead: false,
    mergeable: 'LIMITED',
  };
  const small: ActivityEdgeGeo = {
    ...base,
    points: [mp2bc, { x: mp2bc.x, y: mp2b.y }, mp2b],
    mergeable: 'LIMITED',
  };
  return { edges: [main, small], reservations: [] };
}

/**
 * `ConnectionVerticalThenHorizontal#drawTranslate`'s flipped-direction
 * branch (`:269-282`): the same two-snake split as {@link
 * vThenHSameDirection}, but `mp2bb` also drops `1.5 * hexagonHalfSize` in Y.
 */
function vThenHFlippedDirection(
  edge: ActivityEdgeGeo,
  mp1a: GPoint,
  mp2b: GPoint,
  delta: number,
): LoopRouteResult {
  const mp2bb = { x: mp2b.x + delta, y: mp2b.y - 1.5 * HEXAGON_HALF_SIZE };
  const base = withoutEmphasize(edge);
  const main: ActivityEdgeGeo = {
    ...base,
    points: [mp1a, { x: mp1a.x, y: mp2bb.y }, mp2bb],
    arrowhead: false,
    mergeable: 'LIMITED',
  };
  const small: ActivityEdgeGeo = {
    ...base,
    points: [mp2bb, { x: mp2bb.x, y: mp2b.y }, mp2b],
    mergeable: 'LIMITED',
  };
  return { edges: [main, small], reservations: [] };
}

/**
 * `ConnectionVerticalThenHorizontal#drawTranslate` (`:237-285`): branches on
 * whether the translated direction matches the untranslated one -- the
 * `delta` sign itself always comes from the UNTRANSLATED `p1`/`p2` (`:248-
 * 249`, read BEFORE `mp1a`/`mp2b` are computed), never the translated pair.
 */
export function routeIfLinksVThenH(
  loop: IfLinksVThenHLoop,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  const originalDirection = leftOrRight(loop.p1, loop.p2);
  const mp1a = { x: loop.p1.x + dx1, y: loop.p1.y };
  const mp2b = { x: loop.p2.x + dx2, y: loop.p2.y };
  const newDirection = leftOrRight(mp1a, mp2b);
  const delta = vThenHDelta(loop.p1.x, loop.p2.x);
  return originalDirection === newDirection
    ? vThenHSameDirection(edge, mp1a, mp2b, delta)
    : vThenHFlippedDirection(edge, mp1a, mp2b, delta);
}

/**
 * `ConnectionVerticalThenHorizontalDirect#drawTranslate` (`:327-354`): a
 * single always-`MergeStrategy.LIMITED`, never-arrowed 4-point path --
 * `mp2b`'s own Y drops `Hexagon.hexagonHalfSize` below `loop.p2.y` (`:337`),
 * but the path's FINAL point returns to the untranslated `loop.p2.y`
 * (`:351`, `dimTotal.getHeight()` unchanged by any translate).
 */
export function routeIfLinksVThenHDirect(
  loop: IfLinksVThenHDirectLoop,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  const mp1a = { x: loop.p1.x + dx1, y: loop.p1.y };
  const mp2b = { x: loop.p2.x + dx2, y: loop.p2.y - HEXAGON_HALF_SIZE };
  const points: GPoint[] = [mp1a, { x: mp1a.x, y: mp2b.y }, mp2b, { x: mp2b.x, y: loop.p2.y }];
  return { edges: [{ ...withoutEmphasize(edge), points, mergeable: 'LIMITED' }], reservations: [] };
}
