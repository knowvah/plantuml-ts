/**
 * `UEmpty(5, Hexagon.hexagonHalfSize)` compression reservations — small
 * placeholders upstream draws beside a hexagon/diamond's loop-back elbow so
 * `SlotFinder` never lets the compressor collapse the space an adjacent
 * decoration needs. Split out of `tile-coordinates.ts` only to keep that
 * file under the 500-line cap (mission `activity-klimt-compress`, README
 * "Push forward").
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46
 *   -- `hexagonHalfSize = 12`.
 */

/** `Hexagon.hexagonHalfSize`. @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46 */
export const HEXAGON_HALF_SIZE = 12;

/** The fixed `5` in every `UEmpty(5, Hexagon.hexagonHalfSize)` call site
 *  cited below -- never a lane/branch-derived value. */
export const HEXAGON_RESERVATION_WIDTH = 5;

/**
 * Mirrors `Reservation` from `layout/compress/shapes-of.ts` (defined here,
 * not there, since `hexagon-reservations.ts` sits in `layout/` and is a
 * dependency of `layout/compress/`, not the reverse) -- an axis-aligned box
 * `shapesOf` turns into a `CompressShape`. `ignoreX`/`ignoreY` are set only
 * on the swimlane title-band/background reservations
 * (`swimlane-placement.ts`, `Swimlanes.java:339,364-365`); a hexagon
 * reservation never sets either, since `UEmpty` does not implement
 * `UShapeIgnorableForCompression` (only `URectangle` does,
 * `klimt/shape/URectangle.java:48`) and always occupies its full box.
 */
export interface Reservation {
  x: number;
  y: number;
  width: number;
  height: number;
  ignoreX?: boolean;
  ignoreY?: boolean;
}

/**
 * `ConnectionBackSimple#drawU`'s `(x1, y1bis)` placement
 * (`FtileWhile.java:227-273`, cited at `:264,272`): `x1` is the while body's
 * own south exit x (this port's `backFrom.x`, `walk-while-branch.ts`'s
 * `pushWhileBack`); `y1bis = Math.max(y1, getBottom()) + hexagonHalfSize`,
 * where `y1` is that same exit's y and `getBottom()` is the body's own
 * bottom edge (`bY + body.height`). `ConnectionBackEmpty#drawU`
 * (`:410-462`, cited at `:450,459`) draws the byte-identical shape at the
 * SAME `y1bis` formula -- only `x1,y1` differ there (the header's own south
 * exit, not the body's, since the body is empty) -- so this one function
 * covers both call sites, same as `ifElseHexagonReservation` below covers
 * its own pair.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:264
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:272
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:450
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:459
 */
export function whileHexagonReservation(backFromX: number, backFromY: number, bodyBottomY: number): Reservation {
  const y1bis = Math.max(backFromY, bodyBottomY) + HEXAGON_HALF_SIZE;
  return { x: backFromX, y: y1bis, width: HEXAGON_RESERVATION_WIDTH, height: HEXAGON_HALF_SIZE };
}

/**
 * `ConnectionElse1`/`ConnectionElse2#drawU`'s own `UEmpty(5,
 * Hexagon.hexagonHalfSize)` placement: `(x2, y2 - hexagonHalfSize)`, where
 * `(x2, y2)` is that connector's own second endpoint (the merge diamond's
 * D or B point, or -- `ConnectionElseNoDiamond` -- the tile's own point
 * out). Both connectors draw the identical reservation shape at their own
 * endpoint; a single function covers both call sites.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:349
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:401
 */
export function ifElseHexagonReservation(x2: number, y2: number): Reservation {
  return { x: x2, y: y2 - HEXAGON_HALF_SIZE, width: HEXAGON_RESERVATION_WIDTH, height: HEXAGON_HALF_SIZE };
}
