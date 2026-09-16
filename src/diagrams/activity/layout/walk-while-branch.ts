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
import type { GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import { GConnectionVerticalDown } from '../routing/gconnection-vertical-down.js';
import { GConnectionVerticalDownThenBack } from '../routing/gconnection-vertical-down-then-back.js';
import { laneAt, laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';
import { whileHexagonReservation } from './hexagon-reservations.js';
import { emitDiamondLabels } from './diamond-labels.js';

/**
 * The hexagon node then its own side labels, pushed as one atomic unit
 * (`diamond-labels.ts`'s own header cite for why). North is the "is"/entry
 * label, west is the "is not"/exit label. `laneAt` resolves the header's
 * OWN `.swimlane` over the parent's inherited `myLane` -- the same
 * resolution `walkTile`'s own dispatch (`tile-coordinates.ts:117-118`)
 * applies to every tile it walks; pushing a node directly (never through
 * `walkTile`, D1) means this helper must apply it itself. `tileWhile`
 * (`tile-layout.ts`) never calls `withSwimlane` on the header today, so
 * `header.swimlane` is always `undefined` here and `hexLane === myLane` --
 * kept for parity with `pushRepeatCondition`'s own fix and so a future
 * `tileWhile` change that DOES lane the header does not silently regress.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:125-127
 */
function pushWhileHeader(
  header: GtileDiamondInside,
  hX: number,
  hY: number,
  myLane: string | undefined,
  out: Out,
): void {
  const hexLane = laneAt(header, myLane);
  pushNode(
    out,
    {
      id: out.nextId('while-header'),
      kind: 'while-header',
      x: hX,
      y: hY,
      width: header.width,
      height: header.height,
      label: header.label,
    },
    hexLane,
  );
  emitDiamondLabels(header, { x: hX, y: hY }, ['north', 'west'], hexLane, out);
}

export function walkWhile(t: GtileWhile, x: number, y: number, myLane: string | undefined, out: Out): void {
  const rawChildren = t.children;
  // D1: the header is always a `GtileDiamondInside` (`tile-layout.ts#tileWhile`).
  const header = rawChildren[0] as unknown as GtileDiamondInside;
  const body = rawChildren[1]!;
  // Each child sits so its OWN `left` lands under the tile's merged `left`
  // (`FtileWhile.java:621-641`: `x = dimTotal.getLeft() - child.getLeft()`),
  // never centred by `width / 2` -- an asymmetric body (an `if`) would slant
  // the forward and back edges.
  const hX = x + t.headerOffsetX;
  const hY = y + t.headerOffsetY;
  pushWhileHeader(header, hX, hY, myLane, out);

  const bX = x + t.bodyOffsetX;
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
