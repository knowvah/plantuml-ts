/**
 * `FtileRepeat`'s `ConnectionBackBackward1`/`ConnectionBackBackward2`
 * (`FtileRepeat.java:84,181-187,406-535`), split out of `walk-repeat.ts`
 * only to keep that file under the project's 500-line cap (mission
 * `activity-divergence-drive` T3h -- the same reason `walk-while-
 * branch.ts` was already split out of `tile-coordinates.ts`).
 *
 * These two connectors REPLACE whichever of `ConnectionBackSimple1`/
 * `Simple2`/`Complex1` {@link RepeatFrame.backConnection} would otherwise
 * select: `FtileRepeat.create` (`:181-196`) checks `backward != null`
 * FIRST, before `backConnection`'s own selection logic ever runs.
 * `walk-repeat.ts#pushRepeatBackDispatch` is the single call site that
 * enforces this either/or.
 *
 * `drawTranslate` (cross-lane routing, `ConnectionTranslatable`) IS ported
 * (mission `activity-divergence-drive-3` T1c): both Java classes
 * (`FtileRepeat.java:432-459,482-511`) recompute their own side/wraparound
 * decision from the POST-translate coordinates, never the untranslated
 * ones {@link backward1Points}/{@link backward2Points} use for the
 * same-lane `drawU` shape -- the `LoopTranslate` records built below
 * (`'repeat-backward1'`/`'repeat-backward2'`, `swimlane-loop-translate.ts`)
 * carry the diamonds' own width/height so `swimlane-loop-translate-repeat
 * .ts#routeRepeatBackward1/2` can redo that decision once the walker's own
 * lane pass supplies `dx1`/`dx2`. Every edge pushed here now carries a
 * `loop` tag (D1/D2, mission `activity-loop-lane-translate`); the points
 * pushed here stay the same-lane shape regardless (only a translate shape
 * function ever reads the loop record, same convention as
 * `walk-repeat-back-shapes.ts#pushRepeatBack`).
 */

import type { GPoint } from '../tiles/points.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import type { Tile } from '../tiles/tile.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge } from './tile-coordinates.js';
import type { RepeatFrame } from './walk-repeat.js';
import type { LoopTranslate } from './swimlane-loop-translate.js';

/**
 * Both push sites below carry `Snake.create(...).withLabel(tbback,
 * arrowHorizontalAlignment())` (T1a's census rows 9-15: every
 * `FtileRepeat` back-connector variant upstream could pick -- `backConnection`
 * simple1/`ConnectionBackComplex1`/`ConnectionBackSimple2`/
 * `ConnectionBackBackward1`/`2` -- collapses to these two generic pushes
 * in this port). `arrowHorizontalAlignment()` defaults to
 * `HorizontalAlignment.LEFT` (`skin/AlignmentParam.java:42`); no seam in
 * this port resolves the `skinparam arrowMessageAlignment` override (same
 * reported gap as `walk-while-backward.ts`'s own citation) -- outside
 * this task's write-set.
 */
export const BACKWARD_LABEL_ALIGN = { horizontal: 'LEFT' } as const;

/** Attaches `label`/{@link BACKWARD_LABEL_ALIGN} to the edge most
 *  recently pushed onto `out`, when `label` is set -- split out of
 *  {@link pushRepeatBackwardConnections} to keep that function under
 *  this file's NLOC limit. */
function applyBackwardLabel(out: Out, label: string | undefined): void {
  if (label === undefined) return;
  out.edges[out.edges.length - 1]!.label = label;
  out.edges[out.edges.length - 1]!.labelAlign = BACKWARD_LABEL_ALIGN;
}

/**
 * `ConnectionBackBackward1#drawSnake` (`FtileRepeat.java:440-459`): from
 * diamond2's own LEFT or RIGHT edge at mid-height -- LEFT when the
 * backward activity's own x sits left of diamond2's own horizontal centre,
 * RIGHT otherwise -- straight across to `backSouth` (backward's own point
 * in, `getP2` reads `dim.getLeft(), dim.getOutY()` -- exactly this port's
 * `SOUTH_HOOK`, `GtileAction`'s own `getCoord` doc). BACKLBL (add2 T3i):
 * the label (`tbback`/`incoming1`, attached by the caller) is unaffected
 * by this side choice -- `withLabel` positions relative to the Snake's
 * own geometry, not the diamond side.
 */
function backward1Points(frame: RepeatFrame, backSouth: GPoint): GPoint[] {
  const { condition, condX, condY } = frame;
  const diamondCenterX = condX + condition.width / 2;
  const x1 = backSouth.x < diamondCenterX ? condX : condX + condition.width;
  const y1 = condY + condition.height / 2;
  return [{ x: x1, y: y1 }, { x: backSouth.x, y: y1 }, backSouth];
}

/**
 * `ConnectionBackBackward2#drawU` (`FtileRepeat.java:513-533`): from
 * `backNorth` (backward's own point out, `getP1` reads `dim.getLeft(),
 * dim.getInY()` -- this port's `NORTH_HOOK`) left to a vertical run at
 * that same x, then to the entry's own RIGHT edge at mid-height --
 * UNCONDITIONALLY the right edge, never the left (unlike
 * {@link backward1Points}'s own side choice). BACKLBL (add2 T3i):
 * carries `backArrowLabel`/`incoming2`, attached by the caller.
 */
function backward2Points(frame: RepeatFrame, backNorth: GPoint): GPoint[] {
  const { entry, entryX, entryY } = frame;
  const x2 = entryX + entry.width;
  const y2 = entryY + entry.height / 2;
  return [backNorth, { x: backNorth.x, y: y2 }, { x: x2, y: y2 }];
}

/**
 * The two {@link LoopTranslate} records {@link pushRepeatBackwardConnections}
 * attaches to its own two edges -- split out purely to keep that function's
 * own NLOC under the file's limit. `p1`/`p2` are each connection's own
 * untranslated `getP1`/`getP2` (module doc), never the mid-height points
 * {@link backward1Points}/{@link backward2Points} compute for the
 * same-lane `drawU` shape.
 */
function buildBackwardLoops(
  frame: RepeatFrame,
  backSouth: GPoint,
  backNorth: GPoint,
): { loop1: LoopTranslate; loop2: LoopTranslate } {
  const { condition, condX, condY, entry, entryX, entryY } = frame;
  return {
    loop1: {
      kind: 'repeat-backward1',
      p1: { x: condX, y: condY },
      p2: backSouth,
      diamond2: { width: condition.width, height: condition.height },
    },
    loop2: {
      kind: 'repeat-backward2',
      p1: backNorth,
      p2: { x: entryX, y: entryY },
      diamond1: { width: entry.width, height: entry.height },
    },
  };
}

/**
 * Pushes `ConnectionBackBackward1` (diamond2 -> backward, `asToUp`, NO
 * emphasize -- `FtileRepeat.java:450-452` builds
 * `Snake.create(skinParam(), arrowColor, asToUp()).withLabel(tbback,
 * arrowHorizontalAlignment())` and never calls `emphasizeDirection`) then
 * `ConnectionBackBackward2` (backward -> diamond1/entry, `asToLeft`, also
 * no emphasize -- `:500-501` never calls `emphasizeDirection` either),
 * matching `FtileRepeat.create`'s own `conns.add` order (`:183,187`).
 * `backPos` is `backward`'s own translated
 * origin (`walk-repeat.ts`'s `backX`/`backY` = `t.backwardOffsetX/Y`
 * applied to this tile's own placement); `lanes` is backward's own
 * `laneIn`/`laneOut` (`swimlane-lanes.ts`), computed by the caller so this
 * function stays within the file's 5-parameter limit -- `backIncoming`/
 * `backOutgoing` (BACKLBL, add2 T3i) join the same bag for that reason.
 */
export function pushRepeatBackwardConnections(
  frame: RepeatFrame,
  backward: Tile,
  backPos: GPoint,
  lanes: {
    readonly backIn: string | undefined;
    readonly backOut: string | undefined;
    readonly backIncoming: string | undefined;
    readonly backOutgoing: string | undefined;
  },
): void {
  const { out, conditionOutLane, entryInLane } = frame;
  const backSouth = {
    x: backPos.x + backward.getCoord(SOUTH_HOOK).x,
    y: backPos.y + backward.getCoord(SOUTH_HOOK).y,
  };
  const backNorth = {
    x: backPos.x + backward.getCoord(NORTH_HOOK).x,
    y: backPos.y + backward.getCoord(NORTH_HOOK).y,
  };
  const { loop1, loop2 } = buildBackwardLoops(frame, backSouth, backNorth);

  pushEdge(out, backward1Points(frame, backSouth), conditionOutLane, lanes.backIn, { loop: loop1 });
  applyBackwardLabel(out, lanes.backIncoming);
  pushEdge(out, backward2Points(frame, backNorth), lanes.backOut, entryInLane, { loop: loop2 });
  applyBackwardLabel(out, lanes.backOutgoing);
}
