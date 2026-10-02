/**
 * The `'gtile-switch'` case's full node/edge emission, split out of
 * `tile-coordinates.ts`'s `walkTile` switch only to keep that already-
 * oversized function (`#lizard forgives`, faithful port of the upstream
 * tile-kind dispatch) from growing further, and to keep `tile-coordinates
 * .ts` itself under the file's 500-line cap -- the same reason
 * `walk-while-branch.ts`/`walk-repeat.ts`/`walk-fork-branches.ts` already
 * exist (mission `activity-divergence-drive-2`, T1p-e, batch 1p step 1:
 * "extract... first (no behaviour change, its own commit), then port").
 *
 * T1p-e step 1 is a pure move: `walkSwitch`'s body, `applyLastEdgeLabel`,
 * and the `GConnectionSideThenVerticalThenSide`-based diamond<->case/
 * case<->merge-diamond shape are byte-identical to the code this replaces
 * in `tile-coordinates.ts`. The cross-swimlane port
 * (`FtileSwitchWithManyLinks.java:297-end`) is NOT yet wired into the live
 * render path here -- see this task's handback report for why.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchWithManyLinks.java
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchWithOneLink.java
 */

import type { GtileSwitch } from '../tiles/gtile-switch.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import type { Tile } from '../tiles/tile.js';
import { GConnectionSideThenVerticalThenSide } from '../routing/gconnection-side-then-vertical-then-side.js';
import { laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, walkTile } from './tile-coordinates.js';

/** Labels the edge `pushEdge` just pushed, when non-empty. Extracted out
 *  of `walkTile`'s `'gtile-switch'` arm (mission ubrr-T10 M2, `case
 *  (LABEL)`'s own label -- see `GtileSwitch.caseLabels`'s own doc) purely
 *  to keep `walkTile`'s own NLOC/CCN off the complexity hook's ratchet. */
function applyLastEdgeLabel(out: Out, label: string | undefined): void {
  if (label !== undefined && label !== '') out.edges[out.edges.length - 1]!.label = label;
}

interface SwitchCaseStep {
  readonly diamond: Tile;
  readonly dX: number;
  readonly dY: number;
  readonly mergeDiamond: Tile | null;
  readonly centerX: number;
  readonly mergeOffsetY: number | null;
  readonly myLane: string | undefined;
  readonly y: number;
}

interface SwitchCaseArgs {
  readonly c: Tile;
  readonly cX: number;
  readonly caseOffsetY: number;
  readonly label: string | undefined;
}

/** One `case` tile's walk + its diamond-in edge + (when the switch has a
 *  merge diamond) its own case-to-merge edge. Extracted out of
 *  {@link walkSwitch}'s loop body purely to keep that function under the
 *  complexity hook's NLOC cap -- no behaviour change from the pre-split
 *  `tile-coordinates.ts` code. */
function walkSwitchCase(step: SwitchCaseStep, args: SwitchCaseArgs, out: Out): void {
  const { diamond, dX, dY, mergeDiamond, centerX, mergeOffsetY, myLane, y } = step;
  const { c, cX, caseOffsetY, label } = args;
  const cY = y + caseOffsetY;
  walkTile(c, cX, cY, { kindHint: null, lane: myLane }, out);

  const from = { x: dX + diamond.getCoord(SOUTH_HOOK).x, y: dY + diamond.getCoord(SOUTH_HOOK).y };
  const to = { x: cX + c.getCoord(NORTH_HOOK).x, y: cY + c.getCoord(NORTH_HOOK).y };
  pushEdge(
    out,
    new GConnectionSideThenVerticalThenSide().getPoints(from, to),
    laneOut(diamond, myLane),
    laneIn(c, myLane),
  );
  applyLastEdgeLabel(out, label);

  if (mergeDiamond === null) return;
  const mX = centerX - mergeDiamond.width / 2;
  const mY = y + mergeOffsetY!;
  const mFrom = { x: cX + c.getCoord(SOUTH_HOOK).x, y: cY + c.getCoord(SOUTH_HOOK).y };
  const mTo = { x: mX + mergeDiamond.getCoord(NORTH_HOOK).x, y: mY + mergeDiamond.getCoord(NORTH_HOOK).y };
  pushEdge(
    out,
    new GConnectionSideThenVerticalThenSide().getPoints(mFrom, mTo),
    laneOut(c, myLane),
    laneIn(mergeDiamond, myLane),
  );
}

export function walkSwitch(tile: GtileSwitch, x: number, y: number, myLane: string | undefined, out: Out): void {
  const centerX = x + tile.width / 2;
  const hasMerge = tile.mergeOffsetY !== null;
  const rawChildren = tile.children;
  const diamond = rawChildren[0]!;
  const cases = hasMerge ? rawChildren.slice(1, -1) : rawChildren.slice(1);
  const mergeDiamond = hasMerge ? rawChildren[rawChildren.length - 1]! : null;

  const dX = centerX - diamond.width / 2;
  const dY = y + tile.diamondOffsetY;
  walkTile(diamond, dX, dY, { kindHint: 'if-split', lane: myLane }, out);

  const step: SwitchCaseStep = {
    diamond,
    dX,
    dY,
    mergeDiamond,
    centerX,
    mergeOffsetY: tile.mergeOffsetY,
    myLane,
    y,
  };
  for (let i = 0; i < cases.length; i++) {
    const cX = x + tile.caseOffsets[i]!;
    walkSwitchCase(step, { c: cases[i]!, cX, caseOffsetY: tile.caseOffsetY, label: tile.caseLabels[i] }, out);
  }

  if (mergeDiamond !== null) {
    const mX = centerX - mergeDiamond.width / 2;
    const mY = y + tile.mergeOffsetY!;
    walkTile(mergeDiamond, mX, mY, { kindHint: 'if-merge', lane: myLane }, out);
  }
}
