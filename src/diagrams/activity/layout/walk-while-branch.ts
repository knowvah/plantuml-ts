/**
 * The `'gtile-while'` case's full node/edge/reservation emission, split out
 * of `tile-coordinates.ts`'s `walkTile` switch only to keep that already-
 * oversized function (`#lizard forgives`, faithful port of the upstream
 * tile-kind dispatch) from growing further, and to keep `tile-coordinates
 * .ts` itself under the file's 500-line cap (mission `activity-klimt-
 * compress` README, "Push forward" -- "a sibling module when a file would
 * cross the 500-line hook", the same reason `walk-fork-branches.ts`
 * exists). The body below is the former case's own code, unchanged, per
 * CLAUDE.md "do not refactor while porting".
 *
 * `walkTile`/`pushEdge` are re-imported from `tile-coordinates.ts`, which
 * itself imports {@link walkWhile} from here for its `'gtile-while'` case
 * -- a circular import between the two modules, safe the same way
 * `tile-coordinates.ts`/`walk-fork-branches.ts` already are: both sides are
 * function DEFINITIONS, and neither calls into the other until
 * `assignCoordinates` actually walks the tile tree, well after both
 * modules finish loading.
 */

import type { GtileWhile } from '../tiles/gtile-while.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import { GConnectionVerticalDown } from '../routing/gconnection-vertical-down.js';
import { GConnectionVerticalDownThenBack } from '../routing/gconnection-vertical-down-then-back.js';
import { laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, walkTile } from './tile-coordinates.js';
import { whileHexagonReservation } from './hexagon-reservations.js';

export function walkWhile(t: GtileWhile, x: number, y: number, myLane: string | undefined, out: Out): void {
  const rawChildren = t.children;
  const header = rawChildren[0]!;
  const body = rawChildren[1]!;
  // Center of content area (excludes the back-edge lane)
  const contentCenterX = x + t.getCoord(NORTH_HOOK).x;

  const hX = contentCenterX - header.width / 2;
  const hY = y + t.headerOffsetY;
  walkTile(header, hX, hY, { kindHint: 'while-header', lane: myLane }, out);

  const bX = contentCenterX - body.width / 2;
  const bY = y + t.bodyOffsetY;
  walkTile(body, bX, bY, { kindHint: null, lane: myLane }, out);

  // Forward: header south → body north
  const fFrom = { x: hX + header.getCoord(SOUTH_HOOK).x, y: hY + header.getCoord(SOUTH_HOOK).y };
  const fTo = { x: bX + body.getCoord(NORTH_HOOK).x, y: bY + body.getCoord(NORTH_HOOK).y };
  pushEdge(out, new GConnectionVerticalDown().getPoints(fFrom, fTo), laneOut(header, myLane), laneIn(body, myLane));

  // Back: body south → header north, going right
  const backFrom = { x: bX + body.getCoord(SOUTH_HOOK).x, y: bY + body.getCoord(SOUTH_HOOK).y };
  const backTo = { x: hX + header.getCoord(NORTH_HOOK).x, y: hY + header.getCoord(NORTH_HOOK).y };
  // D5: `ConnectionBackSimple`'s `UEmpty(5, hexagonHalfSize)` beside the
  // loop-back elbow -- see `hexagon-reservations.ts` for the citation.
  out.reservations.push(whileHexagonReservation(backFrom.x, backFrom.y, bY + body.height));
  const rightMargin = x + t.backEdgeRightX - backFrom.x;
  pushEdge(
    out,
    new GConnectionVerticalDownThenBack(rightMargin).getPoints(backFrom, backTo),
    laneOut(body, myLane),
    laneIn(header, myLane),
  );
}
