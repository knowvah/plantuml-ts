/**
 * `while`'s one translatable back-edge shape (mission
 * `activity-loop-lane-translate`). STUB for T1 -- `routeWhileBack` returns
 * the same generic middle-Y elbow `swimlane-placement.ts#routeEdge`'s
 * `'default'` case computes today, sourced from the untranslated `p1`/`p2`
 * this module's own {@link WhileBackLoop} carries plus the two lane
 * deltas. T2 replaces this body with `ConnectionBackSimple#drawTranslate`'s
 * real six-point snake (the `y1bis`/`xx` elbow through `Hexagon
 * .hexagonHalfSize`) and its `UEmpty` reservation.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:277-308
 */

import type { ActivityEdgeGeo } from '../activity-layout-types.js';
import type { GPoint } from '../tiles/points.js';
import type { LoopRouteResult, WhileBackLoop } from './swimlane-loop-translate.js';

/**
 * `ConnectionVerticalDown#drawTranslate`'s own average-Y elbow
 * (`swimlane-placement.ts#crossLaneMiddleY`'s `'default'` case), applied to
 * the loop record's own untranslated endpoints. Temporary: exists only so
 * every stub in this mission computes the identical placeholder shape
 * without a cross-module runtime import (D2's fields are used by T2, not
 * this stub).
 */
function genericElbow(p1: GPoint, p2: GPoint, dx1: number, dx2: number): GPoint[] {
  const mp1 = { x: p1.x + dx1, y: p1.y };
  const mp2 = { x: p2.x + dx2, y: p2.y };
  const middle = (mp1.y + mp2.y) / 2;
  return [mp1, { x: mp1.x, y: middle }, { x: mp2.x, y: middle }, mp2];
}

export function routeWhileBack(loop: WhileBackLoop, edge: ActivityEdgeGeo, dx1: number, dx2: number): LoopRouteResult {
  return { edges: [{ ...edge, points: genericElbow(loop.p1, loop.p2, dx1, dx2) }], reservations: [] };
}
