/**
 * `repeat`'s four translatable back-edge shapes plus its exit connector
 * (mission `activity-loop-lane-translate`). STUBS for T1 -- every exported
 * function here returns the same generic middle-Y elbow `swimlane-
 * placement.ts#routeEdge`'s `'default'` case computes today, sourced from
 * the untranslated `p1`/`p2` each loop record carries plus the two lane
 * deltas. T3 replaces these bodies with the real ported shapes:
 *
 * - `routeRepeatOut` -- `ConnectionOut#drawTranslate` (`:309-331`), an
 *   unarrowed snake to the middle-Y elbow THEN a second small arrowed snake
 *   down to `mp2b` (D3's one-to-two edge split).
 * - `routeRepeatSimple1` -- `ConnectionBackSimple1#drawTranslate`
 *   (`:579-606`).
 * - `routeRepeatSimple2` -- `ConnectionBackSimple2#drawTranslate`
 *   (`:651-676`), whose exit side depends on `isOnA`.
 * - `routeRepeatComplex1` -- `ConnectionBackComplex1#drawTranslate`
 *   (`:357-404`), whose elbow depends on `x2 < x1_a`.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:275-331,357-404,537-606,608-683
 */

import type { ActivityEdgeGeo } from '../activity-layout-types.js';
import type { GPoint } from '../tiles/points.js';
import type {
  LoopRouteResult,
  RepeatComplex1Loop,
  RepeatOutLoop,
  RepeatSimple1Loop,
  RepeatSimple2Loop,
} from './swimlane-loop-translate.js';

/**
 * `ConnectionVerticalDown#drawTranslate`'s own average-Y elbow
 * (`swimlane-placement.ts#crossLaneMiddleY`'s `'default'` case), applied to
 * a loop record's own untranslated endpoints. Temporary: exists only so
 * every stub in this file computes the identical placeholder shape without
 * a cross-module runtime import (D2's fields are used by T3, not these
 * stubs).
 */
function genericElbow(p1: GPoint, p2: GPoint, dx1: number, dx2: number): GPoint[] {
  const mp1 = { x: p1.x + dx1, y: p1.y };
  const mp2 = { x: p2.x + dx2, y: p2.y };
  const middle = (mp1.y + mp2.y) / 2;
  return [mp1, { x: mp1.x, y: middle }, { x: mp2.x, y: middle }, mp2];
}

export function routeRepeatOut(loop: RepeatOutLoop, edge: ActivityEdgeGeo, dx1: number, dx2: number): LoopRouteResult {
  return { edges: [{ ...edge, points: genericElbow(loop.p1, loop.p2, dx1, dx2) }], reservations: [] };
}

export function routeRepeatSimple1(
  loop: RepeatSimple1Loop,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  return { edges: [{ ...edge, points: genericElbow(loop.p1, loop.p2, dx1, dx2) }], reservations: [] };
}

export function routeRepeatSimple2(
  loop: RepeatSimple2Loop,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  return { edges: [{ ...edge, points: genericElbow(loop.p1, loop.p2, dx1, dx2) }], reservations: [] };
}

export function routeRepeatComplex1(
  loop: RepeatComplex1Loop,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  return { edges: [{ ...edge, points: genericElbow(loop.p1, loop.p2, dx1, dx2) }], reservations: [] };
}
