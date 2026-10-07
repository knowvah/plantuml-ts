/**
 * `FtileFactoryDelegatorRepeat.repeat()`'s own break-weld connections
 * (`:132-165`): the first weld (`i == 0`) runs `asToRight` through the
 * tile's own LEFT-margin rail down into the weld diamond's own
 * `WEST_HOOK`; every SUBSEQUENT weld runs `asToLeft` and stops bare on
 * that same rail, at its own break's height -- `Snake.merge`'s
 * endpoint-only semantics (`decisions.md` D12, `connection-census.md` §5)
 * never actually fuse these into one polyline (the later welds' own
 * endpoints sit mid-segment on the first weld's path, not at either of
 * its two ends), so both draw as fully independent edges here, matching
 * the jar's own separate `<line>` runs (confirmed against the oracle,
 * `bizono-61-sasa740`). Split into its own file (not `walk-repeat.ts`,
 * which this task's own `common.md` already flags at 499 lines) per
 * CLAUDE.md "a sibling module when a file would cross the 500-line hook".
 *
 * `GtileRepeat.weldDiamond`'s own doc (D-new) explains why the diamond
 * itself, and the condition-exit-to-diamond-entry edge below, are ALSO
 * owned by this module rather than by `tile-layout.ts`'s sequence
 * builder (outside this task's write-set): `GtileRepeat` exposes its own
 * `SOUTH_HOOK` as the diamond's own exit once a weld exists, so the
 * generic sequence walker (unmodified) automatically draws the diamond
 * -> NEXT-sibling edge the same way it already draws `condition -> NEXT-
 * sibling` when there is no weld.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileFactoryDelegatorRepeat.java:123-169
 */

import type { GPoint } from '../tiles/points.js';
import { SOUTH_HOOK } from '../tiles/points.js';
import { HEXAGON_HALF_SIZE } from './hexagon-reservations.js';
import { pushEdge, pushNode } from './tile-coordinates.js';
import type { RepeatFrame } from './walk-repeat.js';
import { isInsideForkBody } from './walk-fork-branches.js';

/** `FtileDiamond`'s own fixed box (`FtileDiamond.java:108-112`) -- the
 *  SAME constant `gtile-repeat.ts#WELD_DIAMOND_SIZE` computes, re-derived
 *  here (that file does not export it) from the SAME imported {@link
 *  HEXAGON_HALF_SIZE} both sides already share. */
const WELD_DIAMOND_SIZE = 2 * HEXAGON_HALF_SIZE;

/**
 * The weld diamond's own node push (reusing the EXISTING `'repeat-start'`
 * kind: `FtileDiamond` is the SAME Java class upstream reuses for the
 * label-less entry diamond, `gtile-repeat-entry.ts`'s own doc, so this
 * needs no new renderer/`canvas-origin.ts`/`shapes-of.ts` registration --
 * none of those three files are in this task's write-set), then the
 * condition-exit-to-diamond-entry edge the jar's own `assembly(...)`
 * call implies (`GtileRepeat.weldDiamond`'s own doc, D-new).
 */
function pushWeldDiamond(frame: RepeatFrame, dX: number, dY: number): void {
  const { out, condition, condX, condY, conditionOutLane } = frame;
  pushNode(
    out,
    {
      id: out.nextId('repeat-start'),
      kind: 'repeat-start',
      x: dX,
      y: dY,
      width: WELD_DIAMOND_SIZE,
      height: WELD_DIAMOND_SIZE,
    },
    conditionOutLane,
  );
  const conditionExit = { x: condX + condition.getCoord(SOUTH_HOOK).x, y: condY + condition.getCoord(SOUTH_HOOK).y };
  const diamondEntry = { x: dX + WELD_DIAMOND_SIZE / 2, y: dY };
  pushEdge(out, [conditionExit, diamondEntry], conditionOutLane, conditionOutLane);
}

/**
 * One weld per `break` the body walk emitted, appended LAST -- scans
 * `[frame.bodyNodeStart, frame.bodyNodeEnd)` the same way `walk-while-
 * branch.ts#pushWhileWeldings` does (this task's own instruction: "mirror
 * how the while side already does it"), including that function's own
 * documented gap (a `break` nested inside an INNER while/repeat is not
 * excluded from this scan either, since neither this port's `Tile`
 * interface nor its flat walk-time node list models that boundary; no
 * baseline fixture nests a loop with a `break` inside another loop).
 * T3i: a `break` inside a fork/split branch IS excluded, via
 * `isInsideForkBody` -- see that function's doc
 * (`walk-fork-branches.ts`) for the cited mechanism.
 * `tr1` is the break node's own `NORTH_HOOK` (center-top, `GtileBreak
 * .getCoord(NORTH_HOOK)` = `{width/2, 0}`), NOT its raw top-left
 * `breakNode.x`/`.y` -- the jar's own `FtileBreak` is ~0-sized
 * (`FtileEmpty.calculateDimensionEmpty()`), so `genealogy.getTranslate
 * (ftileBreak)`'s origin and its center-top coincide there; this port's
 * `GtileBreak` is a real 20x20 box (`gtile-break.ts`), and EVERY OTHER
 * edge that already targets a break (the if-branch's own exit arrow,
 * `walk-if-down.ts`) connects to that box's CENTER-top, not its corner --
 * using the raw corner here left a `width/2` (10px) horizontal seam
 * between the weld's own start point and where the break is actually
 * drawn to receive an incoming arrow (confirmed against the oracle,
 * `dacuga-41-popo038`: the if-exit edge and this weld must share one x).
 */
function pushBreakWeldings(frame: RepeatFrame, diamondWest: GPoint): void {
  const { out, tileX, conditionOutLane, bodyNodeStart, bodyNodeEnd } = frame;
  let first = true;
  for (let i = bodyNodeStart; i < bodyNodeEnd; i++) {
    const breakNode = out.nodes[i]!;
    if (breakNode.kind !== 'break' || isInsideForkBody(out, i)) continue;
    const tr1 = { x: breakNode.x + breakNode.width / 2, y: breakNode.y };
    const points: GPoint[] = first
      ? [tr1, { x: tileX, y: tr1.y }, { x: tileX, y: diamondWest.y }, diamondWest]
      : [tr1, { x: tileX, y: tr1.y }];
    pushEdge(out, points, breakNode.swimlane, first ? conditionOutLane : undefined);
    first = false;
  }
}

export function pushRepeatWeldings(frame: RepeatFrame): void {
  const { weldDiamond, tileX, tileY } = frame;
  if (weldDiamond === undefined) return;
  const dX = tileX + weldDiamond.offsetX;
  const dY = tileY + weldDiamond.offsetY;
  pushWeldDiamond(frame, dX, dY);
  const diamondWest = { x: dX, y: dY + WELD_DIAMOND_SIZE / 2 };
  pushBreakWeldings(frame, diamondWest);
}
