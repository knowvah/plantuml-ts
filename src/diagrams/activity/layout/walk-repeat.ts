/**
 * The `'gtile-repeat'` case's full node/edge emission, split out of
 * `tile-coordinates.ts`'s `walkTile` switch only to keep that already-
 * oversized function (`#lizard forgives`, faithful port of the upstream
 * tile-kind dispatch) from growing further, and to keep `tile-coordinates
 * .ts` itself under the file's 500-line cap (D10, the same reason
 * `walk-while-branch.ts`/`walk-fork-branches.ts` already exist).
 *
 * `walkTile`/`pushEdge`/`pushNode` are re-imported from `tile-coordinates
 * .ts`, which itself imports {@link walkRepeat} from here for its
 * `'gtile-repeat'` case -- a circular import between the two modules, safe
 * the same way `tile-coordinates.ts`/`walk-while-branch.ts` already are:
 * both sides are function DEFINITIONS, and neither calls into the other
 * until `assignCoordinates` actually walks the tile tree, well after both
 * modules finish loading.
 *
 * altp-T5: places `GtileRepeat`'s three children (entry, body, condition)
 * at their jar-derived offsets. The prior interim's `backward:` third-child
 * branch is retired with `GtileRepeat`'s own constructor (out of scope, 0
 * fixtures, `activity-loop-backward`); the default back edge still goes
 * left at `x = 0` (D5's real jar selection is T6's).
 */

import type { GtileRepeat } from '../tiles/gtile-repeat.js';
import type { GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import { GConnectionVerticalDown } from '../routing/gconnection-vertical-down.js';
import { GConnectionDownThenUp } from '../routing/gconnection-down-then-up.js';
import { laneAt, laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';
import { emitDiamondLabels } from './diamond-labels.js';

/**
 * The repeat's entry point: pushed directly (never through `walkTile`'s
 * generic dispatch, which has no `'gtile-repeat-entry'` case and would fall
 * through to the unknown-kind default) as a `repeat-start` node -- the
 * label-less diamond `FtileRepeat.create` builds when `entry == null`
 * (`FtileRepeat.java:135-136`, `GtileRepeatEntry`'s own class doc). An
 * inline `repeat :label;` entry is a real action tile instead and walks
 * through `walkTile` like any other node (D2, {@link walkRepeat}).
 */
function pushRepeatEntry(
  entry: { width: number; height: number },
  x: number,
  y: number,
  myLane: string | undefined,
  out: Out,
): void {
  pushNode(
    out,
    { id: out.nextId('repeat-start'), kind: 'repeat-start', x, y, width: entry.width, height: entry.height },
    myLane,
  );
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
 * laned repeat's condition silently renders in the wrong lane. The pushed
 * node's `height` is the hexagon-ALONE height (`condition.getCoord(SOUTH_
 * HOOK).y`), not `condition.height` (which would add a north label's height
 * below it) -- the repeat condition never sets a north label (D1), so the
 * two are equal today, but this keeps the walker correct if one ever does.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:150-151
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:87-89
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
      height: condition.getCoord(SOUTH_HOOK).y,
      label: condition.label,
    },
    hexLane,
  );
  emitDiamondLabels(condition, { x: condX, y: condY }, ['south', 'east'], hexLane, out);
}

export function walkRepeat(t: GtileRepeat, x: number, y: number, myLane: string | undefined, out: Out): void {
  const [entry, body, condition] = t.children;

  const entryX = x + t.entryOffsetX;
  const entryY = y + t.entryOffsetY;
  if (entry.kind === 'gtile-repeat-entry') {
    pushRepeatEntry(entry, entryX, entryY, myLane, out);
  } else {
    walkTile(entry, entryX, entryY, { kindHint: null, lane: myLane }, out);
  }

  // Each child sits so its OWN `left` lands under the tile's merged `left`
  // (`FtileRepeat.java:730-765`), never centred by `width / 2` -- except
  // the entry, whose OWN `width / 2` is used even when it is asymmetric
  // (`:744-748`, `GtileRepeat`'s own class doc).
  const bodyX = x + t.bodyOffsetX;
  const bodyY = y + t.bodyOffsetY;
  walkTile(body, bodyX, bodyY, { kindHint: null, lane: myLane }, out);

  const condX = x + t.conditionOffsetX;
  const condY = y + t.conditionOffsetY;

  const fFrom = { x: bodyX + body.getCoord(SOUTH_HOOK).x, y: bodyY + body.getCoord(SOUTH_HOOK).y };
  const fTo = { x: condX + condition.getCoord(NORTH_HOOK).x, y: condY + condition.getCoord(NORTH_HOOK).y };
  pushEdge(out, new GConnectionVerticalDown().getPoints(fFrom, fTo), laneOut(body, myLane), laneIn(condition, myLane));

  pushRepeatCondition(condition, condX, condY, myLane, out);

  // Back: condition south → body north, going left (D5's default; T6 ports
  // the jar's own selection, which for the no-lane case goes right instead).
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
