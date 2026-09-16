/**
 * The `'gtile-repeat'` case's full node/edge emission, split out of
 * `tile-coordinates.ts`'s `walkTile` switch only to keep that already-
 * oversized function (`#lizard forgives`, faithful port of the upstream
 * tile-kind dispatch) from growing further, and to keep `tile-coordinates
 * .ts` itself under the file's 500-line cap (D10, the same reason
 * `walk-while-branch.ts`/`walk-fork-branches.ts` already exist). The logic
 * below is the former case's own code, unchanged, per CLAUDE.md "do not
 * refactor while porting" -- split into `walkRepeat`/{@link pushRepeatBack}/
 * {@link pushRepeatBackwardEdge} only to satisfy the hook's 30-NLOC-per-
 * function limit once the case was pulled out of the exempted switch; no
 * arithmetic or draw order differs.
 *
 * `walkTile`/`pushEdge`/`pushNode` are re-imported from `tile-coordinates
 * .ts`, which itself imports {@link walkRepeat} from here for its
 * `'gtile-repeat'` case -- a circular import between the two modules, safe
 * the same way `tile-coordinates.ts`/`walk-while-branch.ts` already are:
 * both sides are function DEFINITIONS, and neither calls into the other
 * until `assignCoordinates` actually walks the tile tree, well after both
 * modules finish loading.
 */

import type { GtileRepeat } from '../tiles/gtile-repeat.js';
import type { GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import type { Tile } from '../tiles/tile.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import { GConnectionVerticalDown } from '../routing/gconnection-vertical-down.js';
import { GConnectionDownThenUp } from '../routing/gconnection-down-then-up.js';
import { laneAt, laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';
import { emitDiamondLabels } from './diamond-labels.js';

/** The values {@link pushRepeatBack} needs, bundled to keep it (and
 *  {@link walkRepeat}, which builds this) within the file's parameter
 *  limit -- the same reason `walk-while-branch.ts`'s `WhileFrame` exists.
 *  Declared ahead of every function in this file (never trailing one): a
 *  lizard 1.23.0 TypeScript tokenizer quirk attributes an `interface` block
 *  placed AFTER a function to that function's own NLOC count, which can
 *  push an otherwise-compliant function over the hook's 30-line cap. */
interface RepeatFrame {
  readonly out: Out;
  readonly x: number;
  readonly y: number;
  readonly t: GtileRepeat;
  readonly condX: number;
  readonly condY: number;
  readonly condition: GtileDiamondInside;
  readonly bodyX: number;
  readonly bodyY: number;
  readonly body: Tile;
  readonly myLane: string | undefined;
}

/**
 * The `'gtile-repeat'` case's condition hexagon: pushed directly (never
 * through `walkTile`'s generic dispatch, same as `if`'s own `diamond1`,
 * `walk-if-down.ts#pushDiamond1`), then its own side labels -- east is the
 * "is"/entry label, south is the "not"/exit label (default, no `backward`,
 * D1). Split out of the `'gtile-repeat'` case only to keep `walkTile`'s own
 * NLOC from growing (the case itself is unchanged besides this call).
 * `laneAt` resolves the condition's OWN `.swimlane` (`tileRepeat`'s
 * `outLane(node.swimlaneOut, node.swimlane)`, `FtileRepeat.java:149,152`)
 * over the parent's inherited `myLane` -- the same resolution `walkTile`'s
 * own dispatch (`:117-118`) applies to every tile it walks; bypassing
 * `walkTile` to push directly means this helper must apply it itself, or a
 * laned repeat's condition silently renders in the wrong lane.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:150-151
 */
function pushRepeatCondition(
  condition: GtileDiamondInside,
  condX: number,
  condY: number,
  myLane: string | undefined,
  out: Out,
): void {
  const hexLane = laneAt(condition, myLane);
  pushNode(
    out,
    {
      id: out.nextId('repeat-cond'),
      kind: 'repeat-cond',
      x: condX,
      y: condY,
      width: condition.width,
      height: condition.height,
      label: condition.label,
    },
    hexLane,
  );
  emitDiamondLabels(condition, { x: condX, y: condY }, ['south', 'east'], hexLane, out);
}

/**
 * The `backwardBody !== null` branch of `pushRepeatBack`: condition south ->
 * backward north, walk the backward body, then backward south -> body
 * north. Split out only to keep `pushRepeatBack` under the hook's 30-NLOC
 * limit (see file header) -- every point/margin computation is unchanged.
 */
function pushRepeatBackwardEdge(frame: RepeatFrame, backwardBody: Tile): void {
  const { out, x, y, t, condX, condY, condition, bodyX, bodyY, body, myLane } = frame;
  const bwX = x + t.backwardOffsetX!;
  const bwY = y + t.backwardOffsetY!;
  const bwFrom = { x: condX + condition.getCoord(SOUTH_HOOK).x, y: condY + condition.getCoord(SOUTH_HOOK).y };
  const bwTo = { x: bwX + backwardBody.getCoord(NORTH_HOOK).x, y: bwY + backwardBody.getCoord(NORTH_HOOK).y };
  pushEdge(
    out,
    new GConnectionVerticalDown().getPoints(bwFrom, bwTo),
    laneOut(condition, myLane),
    laneIn(backwardBody, myLane),
  );

  walkTile(backwardBody, bwX, bwY, { kindHint: null, lane: myLane }, out);

  const backFrom = { x: bwX + backwardBody.getCoord(SOUTH_HOOK).x, y: bwY + backwardBody.getCoord(SOUTH_HOOK).y };
  const backTo = { x: bodyX + body.getCoord(NORTH_HOOK).x, y: bodyY + body.getCoord(NORTH_HOOK).y };
  const leftMargin = backFrom.x - (x + t.backEdgeLeftX);
  pushEdge(
    out,
    new GConnectionDownThenUp(leftMargin).getPoints(backFrom, backTo),
    laneOut(backwardBody, myLane),
    laneIn(body, myLane),
  );
}

/**
 * Back: `backwardBody` present -> {@link pushRepeatBackwardEdge}; otherwise
 * condition south -> body north directly, going left. Split out of
 * `walkRepeat` only to keep that function's own NLOC under the hook's limit
 * -- the branch and every point/margin computation is unchanged.
 */
function pushRepeatBack(frame: RepeatFrame, backwardBody: Tile | null): void {
  if (backwardBody !== null) {
    pushRepeatBackwardEdge(frame, backwardBody);
    return;
  }

  // Back: condition south → body north, going left
  const { out, x, t, condX, condY, condition, bodyX, bodyY, body, myLane } = frame;
  const backFrom = { x: condX + condition.getCoord(SOUTH_HOOK).x, y: condY + condition.getCoord(SOUTH_HOOK).y };
  const backTo = { x: bodyX + body.getCoord(NORTH_HOOK).x, y: bodyY + body.getCoord(NORTH_HOOK).y };
  const leftMargin = backFrom.x - (x + t.backEdgeLeftX);
  pushEdge(
    out,
    new GConnectionDownThenUp(leftMargin).getPoints(backFrom, backTo),
    laneOut(condition, myLane),
    laneIn(body, myLane),
  );
}

export function walkRepeat(t: GtileRepeat, x: number, y: number, myLane: string | undefined, out: Out): void {
  const rawChildren = t.children;
  const body = rawChildren[0]!;
  // D1: the condition is always a `GtileDiamondInside`
  // (`tile-layout.ts#tileRepeat`).
  const condition = rawChildren[1] as unknown as GtileDiamondInside;
  const backwardBody = rawChildren.length > 2 ? rawChildren[2]! : null;
  // Each child sits so its OWN `left` lands under the tile's merged
  // `left` (`FtileRepeat.java:730-765`), never centred by `width / 2`.

  const bodyX = x + t.bodyOffsetX;
  const bodyY = y + t.bodyOffsetY;
  walkTile(body, bodyX, bodyY, { kindHint: null, lane: myLane }, out);

  const condX = x + t.conditionOffsetX;
  const condY = y + t.conditionOffsetY;

  const fFrom = { x: bodyX + body.getCoord(SOUTH_HOOK).x, y: bodyY + body.getCoord(SOUTH_HOOK).y };
  const fTo = { x: condX + condition.getCoord(NORTH_HOOK).x, y: condY + condition.getCoord(NORTH_HOOK).y };
  pushEdge(out, new GConnectionVerticalDown().getPoints(fFrom, fTo), laneOut(body, myLane), laneIn(condition, myLane));

  pushRepeatCondition(condition, condX, condY, myLane, out);

  const frame: RepeatFrame = { out, x, y, t, condX, condY, condition, bodyX, bodyY, body, myLane };
  pushRepeatBack(frame, backwardBody);
}
