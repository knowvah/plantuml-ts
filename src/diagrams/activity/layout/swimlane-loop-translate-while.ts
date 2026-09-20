/**
 * `while`'s one translatable back-edge shape (mission
 * `activity-loop-lane-translate`, T2). `p1`/`p2` are the loop record's own
 * untranslated `getP1`/`getP2` ({@link WhileBackLoop}'s own doc); `dx1`/
 * `dx2` are `translate1.getDx()`/`translate2.getDx()`
 * (`ConnectionCross#drawU`'s two `swimlaneN.getTranslate()`, X-only, so
 * neither ever touches a Y coordinate below).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:277-308
 */

import type { ActivityEdgeGeo } from '../activity-layout-types.js';
import type { GPoint } from '../tiles/points.js';
import type { LoopRouteResult, WhileBackLoop } from './swimlane-loop-translate.js';
import type { Reservation } from './hexagon-reservations.js';
import { HEXAGON_HALF_SIZE, HEXAGON_RESERVATION_WIDTH } from './hexagon-reservations.js';

/**
 * `ConnectionBackSimple#drawTranslate` (`:277-308`), quoted: `p1 =
 * translate1.getTranslated(getP1())`, `p2 = translate2.getTranslated(getP2
 * ())`; `x1 = p1.x; y1 = p1.y; x2 = p2.x + dimDiamond1.width; half =
 * (dimDiamond1.outY - dimDiamond1.inY) / 2; y2 = p2.y + dimDiamond1.inY +
 * half`. The elbow's `y1 + hexagonHalfSize` carries NO `Math.max(y1,
 * getBottom())` term here -- that term belongs to `drawU`'s own `y1bis`
 * (`:264`); `drawTranslate` never calls `getBottom()` at all (`:294-297`).
 * `withMerge(LIMITED)` only affects overlapping-segment welding (D7, never
 * the points) so it has no representation here. NO `emphasizeDirection`
 * (D4): the mid-arrow `asToUp` (`:307`) is drawn explicitly at
 * `(xx, (y1+y2)/2)` instead, via `ActivityEdgeGeo.midArrowAt` -- the
 * caller's `emphasize` is dropped, never carried through.
 */
export function routeWhileBack(loop: WhileBackLoop, edge: ActivityEdgeGeo, dx1: number, dx2: number): LoopRouteResult {
  const { emphasize: _emphasize, ...rest } = edge;

  const x1 = loop.p1.x + dx1;
  const y1 = loop.p1.y;
  const p2x = loop.p2.x + dx2;
  const p2y = loop.p2.y;
  const x2 = p2x + loop.diamond.width;
  const half = (loop.diamond.outY - loop.diamond.inY) / 2;
  const y2 = p2y + loop.diamond.inY + half;

  const y1bis = y1 + HEXAGON_HALF_SIZE;
  const xx = Math.max(dx1, dx2) + loop.dimTotalWidth;

  const points: GPoint[] = [
    { x: x1, y: y1 },
    { x: x1, y: y1bis },
    { x: xx, y: y1bis },
    { x: xx, y: y2 },
    { x: x2, y: y2 },
  ];

  // `ug.apply(new UTranslate(x1, y1 + Hexagon.hexagonHalfSize)).draw(new
  // UEmpty(5, Hexagon.hexagonHalfSize))` (`:305`) -- same box shape as
  // `whileHexagonReservation`'s, at this shape's own (non-`max`) `y1bis`.
  const reservation: Reservation = { x: x1, y: y1bis, width: HEXAGON_RESERVATION_WIDTH, height: HEXAGON_HALF_SIZE };

  return {
    edges: [{ ...rest, points, midArrowAt: { x: xx, y: (y1 + y2) / 2, dir: 'up' } }],
    reservations: [reservation],
  };
}
