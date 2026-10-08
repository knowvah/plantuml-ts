/**
 * `FtileWhile`'s `specialOut` child and its `ConnectionOutSpecial`, split out
 * of `walk-while-branch.ts` (500-line cap) with the swimlane gate they need.
 *
 * `FtileWhile#getSwimlanes()` is `whileBlock`'s lanes plus `getSwimlaneIn()`
 * (= `diamond1`'s) -- never `specialOut`'s (`FtileWhile.java:96-108`). So a
 * `specialOut` in another lane is reached by no lane pass
 * (`UGraphicInterceptorOneSwimlane.java:68-75`), and `ConnectionOutSpecial`
 * (`super(diamond1, specialOut)`, `:517`, not `ConnectionTranslatable`) is
 * drawn by none either (`UGraphicInterceptorOneSwimlane.java:93-104`,
 * `ConnectionCross.java:49-64`).
 *
 * `walkTile`/`pushEdge` come from `tile-coordinates.ts` -- the same safe
 * circular import every walker documents: both sides are function
 * definitions, neither runs until a real layout does.
 */

import { NORTH_HOOK } from '../tiles/points.js';
import { childTileDrawn, compositeLaneGate, nonTranslatableConnectionDrawn } from './swimlane-connection-gate.js';
import { pushEdge, walkTile } from './tile-coordinates.js';
import type { WhileFrame } from './walk-while-branch.js';

/** `FtileWhile#getSwimlanes()` (`FtileWhile.java:96-100`) as a
 *  {@link compositeLaneGate}. */
export function whileLaneGate(frame: WhileFrame, myLane: string | undefined): ReadonlySet<string> | undefined {
  return compositeLaneGate(frame.headerInLane, [frame.body], myLane);
}

/** `drawU`'s `if (specialOut != null) ug.apply(...).draw(specialOut)`
 *  (`FtileWhile.java:558-559`), behind the interceptor's `Ftile` gate. */
export function walkWhileSpecialOut(
  frame: WhileFrame,
  gate: ReadonlySet<string> | undefined,
  myLane: string | undefined,
): void {
  const special = frame.specialOut;
  if (special === undefined || !childTileDrawn(gate, special, myLane)) return;
  walkTile(special, frame.specialPos.x, frame.specialPos.y, { kindHint: null, lane: myLane }, frame.out);
}

/**
 * `ConnectionOutSpecial` (`FtileWhile.java:513-552`): REPLACES
 * `ConnectionOut` entirely when `specialOut` is set (`FtileWhile.create`,
 * `:163-166`). `p1 = translateDiamond1 + (0,0)`, `y1 = p1.y + inY + half`
 * with `inY = 0` and `half = hexHeight / 2` -- exactly this port's
 * `WEST_HOOK` (`frame.headerWest`, same mid-height point `pushWhileOut`
 * reads). `p2` is the special tile's own `NORTH_HOOK`, translated by
 * `frame.specialPos` (`getTranslateForSpecial`, `GtileWhile`'s own class
 * doc). Draw: `(x1,y1) -> (x2,y1) -> (x2,y2)`, `asToDown`, no emphasize,
 * default merge (FULL, `Snake.create(skinParam, color, arrow)`, `:533`).
 * Mission add2-T3b, family WSPEC. Not drawn when `specialOut` sits in
 * another lane (this module's doc).
 */
export function pushWhileOutSpecial(frame: WhileFrame, gate: ReadonlySet<string> | undefined): void {
  const { out, headerWest, specialPos, specialOut, headerOutLane, specialInLane } = frame;
  if (!nonTranslatableConnectionDrawn(gate, headerOutLane, specialInLane)) return;
  const special = specialOut!;
  const p2 = { x: specialPos.x + special.getCoord(NORTH_HOOK).x, y: specialPos.y + special.getCoord(NORTH_HOOK).y };
  pushEdge(out, [headerWest, { x: p2.x, y: headerWest.y }, p2], headerOutLane, specialInLane);
}
