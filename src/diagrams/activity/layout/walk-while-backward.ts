/**
 * `FtileWhile`'s `ConnectionBackBackward1`/`ConnectionBackBackward2`
 * (`FtileWhile.java:85,154-161,313-408`), split out of `walk-while-
 * branch.ts` only to keep that file under the project's 500-line cap
 * (mission `activity-divergence-drive` T3h).
 *
 * These two connectors REPLACE `ConnectionBackSimple` entirely within the
 * non-empty-body branch (`FtileWhile.create`, `:154-161`: `backward ==
 * null` picks Simple, else both Backward connectors) -- the degenerate
 * `ConnectionBackEmpty` branch (`walk-while-branch.ts#pushWhileBack`'s own
 * `body.width === 0 || body.height === 0` check) never reads `backward` at
 * all, matching the jar (`FtileWhile.create:150-151` tests `dim.getWidth()
 * == 0 || dim.getHeight() == 0` BEFORE `backward` is ever read).
 *
 * `drawTranslate` (cross-lane routing, `ConnectionTranslatable`) is NOT
 * ported here -- same residual `walk-repeat-backward.ts`'s own doc
 * explains: wiring a new `LoopTranslate` variant is `swimlane-loop-
 * translate.ts`'s own seam, outside this task's write-set.
 */

import type { GPoint } from '../tiles/points.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import { HEXAGON_HALF_SIZE, whileHexagonReservation } from './hexagon-reservations.js';
import { pushEdge } from './tile-coordinates.js';
import type { WhileFrame } from './walk-while-branch.js';

/**
 * `Snake.create(...).withLabel(back, BOTTOM)` (`FtileWhile.java:354` /
 * `:261-262`'s own literal `VerticalAlignment.BOTTOM`, T1a's census row
 * 16/17) -- {@link pushBackward1}'s own push site.
 */
const BACKWARD1_LABEL_ALIGN = { vertical: 'BOTTOM' } as const;

/**
 * `arrowHorizontalAlignment()` (`FtileWhile.java:389-390`, T1a's census
 * row 18) -- `AbstractFtile.java:108-110` resolves this through
 * `skinparam arrowMessageAlignment`, default `HorizontalAlignment.LEFT`
 * (`skin/AlignmentParam.java:42`). No seam in this port resolves that
 * skinparam (T1a's census: `ftile/AbstractFtile.ts` is a different,
 * unbuilt `Ftile` graph); adding one is a new core/theme field, outside
 * this task's write-set -- reported, not added. `{horizontal: 'LEFT'}`
 * is upstream's own unconditional default, not a guess.
 */
const BACKWARD2_LABEL_ALIGN = { horizontal: 'LEFT' } as const;

/**
 * `ConnectionBackBackward1#drawU` (`FtileWhile.java:341-364`): from the
 * body's own SOUTH_HOOK (`backFrom`, the SAME point `ConnectionBackSimple`
 * would use) down/across to `backSouth` (backward's own point in, this
 * port's `SOUTH_HOOK`) via the SAME `y1bis` elbow `ConnectionBackSimple`/
 * `ConnectionBackEmpty` already share (`hexagon-reservations.ts
 * #whileHexagonReservation`'s own doc) -- but the elbow's horizontal run
 * ends at `backSouth.x`, never at the tile's own right edge `xx`. No
 * emphasize -- `:354` builds `Snake.create(skinParam(), endInlinkColor,
 * asToUp()).withLabel(back, BOTTOM)` and never calls `emphasizeDirection`,
 * unlike `ConnectionBackSimple`/`ConnectionBackEmpty`'s own UP emphasize
 * (`:261-262,435-436`). Only called when the body has a point out
 * (`frame.body.hasPointOut()`, {@link pushWhileBackwardConnections}'s own
 * guard) -- mirrors `ConnectionBackSimple`'s own `getP1() == null` early
 * return, which skips the connector AND its reservation together.
 * BACKLBL (add2 T3i): `back` ABOVE is `frame.backIncoming` -- the
 * `(incoming)` decoration on `backward:`'s OWN leading paren, drawn
 * `VerticalAlignment.BOTTOM` (upstream's own `withLabel` call, cited
 * above).
 */
function pushBackward1(frame: WhileFrame, backFrom: GPoint, backSouth: GPoint): void {
  const { out, bodyBottomY, bodyOutLane, backInLane, backIncoming } = frame;
  const y1bis = Math.max(backFrom.y, bodyBottomY) + HEXAGON_HALF_SIZE;
  const points = [backFrom, { x: backFrom.x, y: y1bis }, { x: backSouth.x, y: y1bis }, backSouth];
  pushEdge(out, points, bodyOutLane, backInLane);
  if (backIncoming !== undefined) {
    out.edges[out.edges.length - 1]!.label = backIncoming;
    out.edges[out.edges.length - 1]!.labelAlign = BACKWARD1_LABEL_ALIGN;
  }
  out.reservations.push(whileHexagonReservation(backFrom.x, backFrom.y, bodyBottomY));
}

/**
 * `ConnectionBackBackward2#drawU` (`FtileWhile.java:386-407`): from
 * `backNorth` (backward's own point out, this port's `NORTH_HOOK`) left to
 * a vertical run at that same x, then to `headerEast` (`x2 = p2.x +
 * dimDiamond1.w`, `y2 = p2.y + half` -- exactly this port's `headerEast`,
 * `walk-while-branch.ts`'s own `WhileFrame.headerEast` doc). No
 * `emphasizeDirection` call (unlike every other while/repeat back
 * connector) and always drawn, independent of the body's own point-out
 * state -- the Java source has no `hasPointOut` guard on this class at
 * all, unlike {@link pushBackward1}'s own `ConnectionBackBackward1`.
 * BACKLBL (add2 T3i): `back` is `frame.backOutgoing` -- the trailing
 * `(outgoing)` decoration, drawn with `arrowHorizontalAlignment()`.
 */
function pushBackward2(frame: WhileFrame, backNorth: GPoint): void {
  const { out, headerEast, headerInLane, backOutLane, backOutgoing } = frame;
  pushEdge(out, [backNorth, { x: backNorth.x, y: headerEast.y }, headerEast], backOutLane, headerInLane);
  if (backOutgoing !== undefined) {
    out.edges[out.edges.length - 1]!.label = backOutgoing;
    out.edges[out.edges.length - 1]!.labelAlign = BACKWARD2_LABEL_ALIGN;
  }
}

/**
 * Dispatches {@link pushBackward1} (only when the body has a point out)
 * then {@link pushBackward2} (unconditionally), matching `FtileWhile
 * .create`'s own `conns.add` order (`:159-160`). Call site:
 * `walk-while-branch.ts#pushWhileBackNonEmpty`, guarded on
 * `frame.backward !== undefined`.
 */
export function pushWhileBackwardConnections(frame: WhileFrame): void {
  const { body, bX, bY, backward, backPos } = frame;
  const bw = backward!;
  const backSouth = { x: backPos.x + bw.getCoord(SOUTH_HOOK).x, y: backPos.y + bw.getCoord(SOUTH_HOOK).y };
  const backNorth = { x: backPos.x + bw.getCoord(NORTH_HOOK).x, y: backPos.y + bw.getCoord(NORTH_HOOK).y };

  if (body.hasPointOut()) {
    const backFrom = { x: bX + body.getCoord(SOUTH_HOOK).x, y: bY + body.getCoord(SOUTH_HOOK).y };
    pushBackward1(frame, backFrom, backSouth);
  }
  pushBackward2(frame, backNorth);
}
