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
import type { GPoint } from '../tiles/points.js';
import type { Tile } from '../tiles/tile.js';
import { TileComposite } from '../tiles/tile.js';
import { GConnectionSideThenVerticalThenSide } from '../routing/gconnection-side-then-vertical-then-side.js';
import { laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, walkTile } from './tile-coordinates.js';
import type { LoopTranslate } from './swimlane-loop-translate.js';
import { markBigDiamondDuplicate } from './switch-swimlane-duplicate.js';

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

/**
 * Unwraps our single-child `GtileTopDown` -- `tile-layout.ts`'s case-body
 * builder (`tileNodes`) ALWAYS wraps a case's body in one, even a single
 * statement, but upstream's own list-to-Ftile fold
 * (`FtileFactoryDelegatorAssembly#assembly`, `vcompact/
 * FtileFactoryDelegatorAssembly.java:57`) calls `assembly()` N-1 times
 * over an N-element list, so a SINGLE-statement body is never wrapped at
 * all in the jar -- `tiles.get(i)` there IS the bare leaf. Our wrapper is
 * a construction artifact with no Java counterpart; unwrap it so the
 * leaf/composite check below sees what the jar actually dispatches on.
 */
function unwrapSingleChildTopDown(tile: Tile): Tile {
  let current = tile;
  while (current.kind === 'gtile-top-down' && current instanceof TileComposite && current.children.length === 1) {
    current = current.children[0]!;
  }
  return current;
}

interface SwitchCaseArgs {
  readonly c: Tile;
  readonly cX: number;
  readonly caseOffsetY: number;
  readonly label: string | undefined;
  /** `tile.isBigDiamond && !(c instanceof TileComposite)` -- see
   *  `switch-swimlane-duplicate.ts`'s own doc for why only a BIG_DIAMOND
   *  switch's LEAF case tiles get the per-lane redraw tag. */
  readonly duplicatePerLane: boolean;
}

/** Tags every node {@link walkSwitchCase}'s `walkTile` call just pushed
 *  (`out.nodes[nodeStart..]`) -- split out purely to keep that function's
 *  own NLOC under the complexity hook's cap. */
function tagDuplicateNodes(out: Out, nodeStart: number): void {
  for (let i = nodeStart; i < out.nodes.length; i++) markBigDiamondDuplicate(out.nodes[i]!);
}

interface CaseToMergeArgs {
  readonly c: Tile;
  readonly cPos: GPoint;
  readonly mergeDiamond: Tile;
  readonly mPos: GPoint;
}

/** The case-to-merge-diamond edge, tagged with `ConnectionVerticalThen
 *  HorizontalCrossSwimlane`'s loop shape (`FtileSwitchWithManyLinks.java
 *  :352-404`) -- extracted out of {@link walkSwitchCase} purely to keep
 *  that function under the complexity hook's NLOC cap. */
function pushCaseToMergeEdge(args: CaseToMergeArgs, myLane: string | undefined, out: Out): void {
  const { c, cPos, mergeDiamond, mPos } = args;
  const mFrom = { x: cPos.x + c.getCoord(SOUTH_HOOK).x, y: cPos.y + c.getCoord(SOUTH_HOOK).y };
  const mTo = { x: mPos.x + mergeDiamond.getCoord(NORTH_HOOK).x, y: mPos.y + mergeDiamond.getCoord(NORTH_HOOK).y };
  // `getP1`/`getP2` (`:395-403`) are the origin tile's `getPointOut()` (=
  // our SOUTH_HOOK, same `mFrom`) and `diamond2`'s own `getPointIn()` (=
  // our NORTH_HOOK, same `mTo`).
  const vThenHLoop: LoopTranslate = {
    kind: 'switch-v-then-h-cross',
    p1: mFrom,
    p2: mTo,
    diamond2: { width: mergeDiamond.width, height: mergeDiamond.height },
  };
  pushEdge(
    out,
    new GConnectionSideThenVerticalThenSide().getPoints(mFrom, mTo),
    laneOut(c, myLane),
    laneIn(mergeDiamond, myLane),
    { loop: vThenHLoop },
  );
}

/** One `case` tile's walk + its diamond-in edge + (when the switch has a
 *  merge diamond) its own case-to-merge edge. Extracted out of
 *  {@link walkSwitch}'s loop body purely to keep that function under the
 *  complexity hook's NLOC cap -- no behaviour change from the pre-split
 *  `tile-coordinates.ts` code (beyond the `loop` tags T1p-e adds). */
function walkSwitchCase(step: SwitchCaseStep, args: SwitchCaseArgs, out: Out): void {
  const { diamond, dX, dY, mergeDiamond, centerX, mergeOffsetY, myLane, y } = step;
  const { c, cX, caseOffsetY, label, duplicatePerLane } = args;
  const cY = y + caseOffsetY;
  const nodeStart = out.nodes.length;
  walkTile(c, cX, cY, { kindHint: null, lane: myLane }, out);
  if (duplicatePerLane) tagDuplicateNodes(out, nodeStart);

  const from = { x: dX + diamond.getCoord(SOUTH_HOOK).x, y: dY + diamond.getCoord(SOUTH_HOOK).y };
  const to = { x: cX + c.getCoord(NORTH_HOOK).x, y: cY + c.getCoord(NORTH_HOOK).y };
  // `ConnectionHorizontalThenVerticalCrossSwimlane` (`FtileSwitchWithManyLinks
  // .java:297-350`): `getP1`/`getP2` (`:341-349`) are `diamond1`'s own
  // `getPointOut()` (= our SOUTH_HOOK, same `from` the uniform shape above
  // already uses) and the case tile's `getPointIn()` (= our NORTH_HOOK, same
  // `to`) -- so this tag is attached to the SAME edge, not a second one;
  // `routeEdge` (`swimlane-placement.ts`) only dispatches it when the two
  // endpoints' lanes actually differ, same as every other `loop`-tagged edge.
  const hThenVLoop: LoopTranslate = {
    kind: 'switch-h-then-v-cross',
    p1: from,
    p2: to,
    diamond1: { width: diamond.width, height: diamond.height },
  };
  const dcPts = new GConnectionSideThenVerticalThenSide().getPoints(from, to);
  pushEdge(out, dcPts, laneOut(diamond, myLane), laneIn(c, myLane), { loop: hThenVLoop });
  applyLastEdgeLabel(out, label);

  if (mergeDiamond === null) return;
  const mPos = { x: centerX - mergeDiamond.width / 2, y: y + mergeOffsetY! };
  pushCaseToMergeEdge({ c, cPos: { x: cX, y: cY }, mergeDiamond, mPos }, myLane, out);
}

/** {@link walkSwitch}'s own case-tile loop, split out purely to keep that
 *  function's NLOC under the complexity hook's cap -- no behaviour
 *  change beyond the `duplicatePerLane` tag T1p-f adds. */
function walkSwitchCases(tile: GtileSwitch, x: number, step: SwitchCaseStep, out: Out): void {
  const cases = tile.children.slice(1, 1 + tile.caseOffsets.length);
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i]!;
    const cX = x + tile.caseOffsets[i]!;
    const duplicatePerLane = tile.isBigDiamond && !(unwrapSingleChildTopDown(c) instanceof TileComposite);
    walkSwitchCase(step, { c, cX, caseOffsetY: tile.caseOffsetY, label: tile.caseLabels[i], duplicatePerLane }, out);
  }
}

export function walkSwitch(tile: GtileSwitch, x: number, y: number, myLane: string | undefined, out: Out): void {
  const centerX = x + tile.width / 2;
  const hasMerge = tile.mergeOffsetY !== null;
  const rawChildren = tile.children;
  const diamond = rawChildren[0]!;
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
  walkSwitchCases(tile, x, step, out);

  if (mergeDiamond !== null) {
    const mX = centerX - mergeDiamond.width / 2;
    const mY = y + tile.mergeOffsetY!;
    walkTile(mergeDiamond, mX, mY, { kindHint: 'if-merge', lane: myLane }, out);
  }
}
