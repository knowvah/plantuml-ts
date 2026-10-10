/**
 * The `'gtile-switch'` case's full node/edge emission, split out of
 * `tile-coordinates.ts`'s `walkTile` switch only to keep that already-
 * oversized function (`#lizard forgives`, faithful port of the upstream
 * tile-kind dispatch) from growing further, and to keep `tile-coordinates
 * .ts` itself under the file's 500-line cap -- the same reason
 * `walk-while-branch.ts`/`walk-repeat.ts`/`walk-fork-branches.ts` already
 * exist.
 *
 * `activity-divergence-drive-3` T3b: diamond1/diamond2 are now real
 * `FtileDiamondInside` hexagons (`tiles/gtile-diamond-inside.ts`, pushed
 * directly as `'if-split'`/`'if-merge'` nodes -- the SAME convention
 * `walk-if-with-links.ts#pushDiamond1`/`#pushMerge` use, since `GtileSwitch`
 * no longer owns a `'gtile-diamond'`-kind child `walkTile` could dispatch
 * on generically), and every connector is `FtileSwitchWithManyLinks`'s/
 * `FtileSwitchWithOneLink`'s own `Connection*` shape (`switch-connection-
 * points.ts`), not the generic `GConnectionSideThenVerticalThenSide`
 * router. Cross-swimlane routing is untouched (`switch-swimlane-duplicate
 * .ts`'s own doc, the pre-existing `loop`-tagged translate path).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchWithManyLinks.java
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchWithOneLink.java
 */

import type { GtileSwitch } from '../tiles/gtile-switch.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../tiles/points.js';
import type { GPoint } from '../tiles/points.js';
import type { Tile } from '../tiles/tile.js';
import { TileComposite } from '../tiles/tile.js';
import { laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';
import type { LoopTranslate } from './swimlane-loop-translate.js';
import { markBigDiamondDuplicate } from './switch-swimlane-duplicate.js';
import { compositeLaneGate, nonTranslatableConnectionDrawn } from './swimlane-connection-gate.js';
import { applyInLabel, applyOutLabel } from './tile-layout-inlabel.js';
import type { SnakeTextAlign } from './snake-text-position.js';
import {
  horizontalThenVerticalPoints,
  oneLinkBottomPoints,
  oneLinkVerticalPoints,
  verticalBottomPoints,
  verticalThenHorizontalPoints,
  verticalTopPoints,
} from './switch-connection-points.js';
import type { HexagonCorners } from './switch-connection-points.js';
import { wrappedSpread } from './diamond-wrap.js';

/** Labels the edge `pushEdge` just pushed, when non-empty, with its own
 *  alignment ({@link caseInLabelAlign}) -- through {@link applyInLabel},
 *  the SAME attach-plus-reservation path every other connector's in-label
 *  takes: the case label is `Branch#getTextBlockPositive()`, drawn by the
 *  connector as a `UText` that `SlotFinder#drawText` (`klimt/compress/
 *  SlotFinder.java`) counts as an occupant, so the compressor must see its
 *  real placed box, not the generic mid-point estimate. */
function applyLastEdgeLabel(out: Out, label: string | undefined, align: SnakeTextAlign): void {
  if (label === undefined || label === '') return;
  applyInLabel(out, { inLabel: { label, wrapped: true } }, align);
}

/**
 * `ConnectionHorizontalThenVertical`/`ConnectionVerticalTop`'s own label
 * alignment: `arrowHorizontalAlignment()` for the first/last case (also
 * `FtileSwitchWithOneLink`'s single case, which is simultaneously first
 * and last), `VerticalAlignment.CENTER` for every interior case.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchWithManyLinks.java:91-92,218-219
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchWithOneLink.java:82-83
 */
function caseInLabelAlign(i: number, total: number): SnakeTextAlign {
  if (i === 0 || i === total - 1) return { horizontal: 'LEFT' };
  return { vertical: 'CENTER' };
}

/** `VerticalAlignment.CENTER` -- the exit-label alignment every outgoing
 *  case-to-merge connector uses (`FtileSwitchWithManyLinks.java:176-177,
 *  274-275`); `FtileSwitchWithOneLink`'s own case-to-merge connector never
 *  calls `.withLabel()` at all, so a single-case switch never draws one. */
const CASE_OUT_LABEL_ALIGN: SnakeTextAlign = { vertical: 'CENTER' };

/**
 * Unwraps our single-child `GtileTopDown` -- `tile-layout.ts`'s case-body
 * builder (`tileNodes`) ALWAYS wraps a case's body in one, even a single
 * statement, but upstream's own list-to-Ftile fold never does for a
 * single-statement body.
 */
function unwrapSingleChildTopDown(tile: Tile): Tile {
  let current = tile;
  while (current.kind === 'gtile-top-down' && current instanceof TileComposite && current.children.length === 1) {
    current = current.children[0]!;
  }
  return current;
}

function hexagonCorners(tile: Tile, pos: GPoint): HexagonCorners {
  const w = tile.getCoord(WEST_HOOK);
  const e = tile.getCoord(EAST_HOOK);
  const s = tile.getCoord(SOUTH_HOOK);
  return {
    west: { x: pos.x + w.x, y: pos.y + w.y },
    east: { x: pos.x + e.x, y: pos.y + e.y },
    south: { x: pos.x + s.x, y: pos.y + s.y },
  };
}

/**
 * Both switch diamonds are `FtileDiamondInside` hexagons, whatever the
 * `ConditionStyle`: `getDiamond1` returns `new FtileDiamondInside(tbTest,
 * ...)` and `getDiamond2` returns `new FtileDiamondInside(TextBlockUtils
 * .empty(0, 0), ...)` (`FtileFactoryDelegatorSwitch.java:147,159-160`), whose
 * `drawU` always draws `Hexagon.asPolygon(shadowing, width, height)`
 * (`FtileDiamondInside.java:89-90`, `Hexagon.java:65-74`) -- the 7-point
 * hexagon, even over a 0x0 label.
 */
const SWITCH_DIAMOND_SHAPE = 'inside' as const;

/** `FtileFactoryDelegatorAddNote#addNote`-adjacent pushes for diamond1/
 *  diamond2 -- the SAME `'if-split'`/`'if-merge'`/`'if-own-label'` node
 *  shape `walk-if-with-links.ts#pushDiamond1`/`#pushMerge` push, no
 *  west/east labels (the switch never sets them, `tile-layout-structural
 *  .ts#tileSwitch`'s own doc). */
function pushSwitchDiamond(
  diamond: Tile,
  pos: GPoint,
  kind: 'if-split' | 'if-merge',
  myLane: string | undefined,
  out: Out,
): void {
  const own = diamond as unknown as { label: string; wrapped: boolean };
  const label = kind === 'if-split' ? own.label : '';
  pushNode(
    out,
    {
      id: out.nextId(kind),
      kind,
      x: pos.x,
      y: pos.y,
      width: diamond.width,
      height: diamond.height,
      label,
      diamondShape: SWITCH_DIAMOND_SHAPE,
    },
    myLane,
  );
  if (kind === 'if-split' && label !== '') {
    pushNode(
      out,
      {
        id: out.nextId('if-own-label'),
        kind: 'if-own-label',
        x: pos.x,
        y: pos.y,
        width: diamond.width,
        height: diamond.height,
        label,
        ...wrappedSpread(own),
      },
      myLane,
    );
  }
}

interface SwitchCaseStep {
  readonly diamond: Tile;
  readonly dPos: GPoint;
  readonly mergeDiamond: Tile | null;
  readonly mPos: GPoint | null;
  readonly myLane: string | undefined;
  readonly y: number;
  readonly totalCases: number;
  readonly isBigDiamond: boolean;
  /** `FtileSwitchNude#getSwimlanes()` (`FtileSwitchNude.java:70-79`). */
  readonly gate: ReadonlySet<string> | undefined;
}

/** Tags every node {@link walkSwitchCase}'s `walkTile` call just pushed. */
function tagDuplicateNodes(out: Out, nodeStart: number): void {
  for (let i = nodeStart; i < out.nodes.length; i++) markBigDiamondDuplicate(out.nodes[i]!);
}

/** The diamond1-to-case edge's same-lane points, dispatching on this
 *  case's position (first/last -> `horizontalThenVerticalPoints`, middle
 *  -> `verticalTopPoints`). */
function diamondToCasePoints(step: SwitchCaseStep, i: number, cPos: GPoint, c: Tile): GPoint[] {
  const { diamond, dPos, totalCases } = step;
  const to = { x: cPos.x + c.getCoord(NORTH_HOOK).x, y: cPos.y + c.getCoord(NORTH_HOOK).y };
  if (totalCases === 1) {
    const south = diamond.getCoord(SOUTH_HOOK);
    return oneLinkVerticalPoints({ x: dPos.x + south.x, y: dPos.y + south.y }, to);
  }
  const hex1 = hexagonCorners(diamond, dPos);
  if (i === 0) return horizontalThenVerticalPoints(hex1.west, to, false, diamond.height);
  if (i === totalCases - 1) return horizontalThenVerticalPoints(hex1.east, to, true, diamond.height);
  return verticalTopPoints(hex1, to);
}

interface SwitchCaseArgs {
  readonly i: number;
  readonly c: Tile;
  readonly cPos: GPoint;
  readonly label: string | undefined;
  /** `tile.isBigDiamond && !(unwrap(c) instanceof TileComposite)` -- only a
   *  BIG_DIAMOND switch's LEAF case tiles get the per-lane redraw tag
   *  (`switch-swimlane-duplicate.ts`'s own doc). */
  readonly duplicatePerLane: boolean;
}

/** One `case` tile's walk, split out of {@link walkSwitchCaseIn} purely to
 *  keep that function under the complexity hook's NLOC cap. */
function walkSwitchCaseBody(step: SwitchCaseStep, args: SwitchCaseArgs, out: Out): void {
  const nodeStart = out.nodes.length;
  walkTile(args.c, args.cPos.x, args.cPos.y, { kindHint: null, lane: step.myLane }, out);
  if (args.duplicatePerLane) tagDuplicateNodes(out, nodeStart);
}

/** The diamond1-to-case edge, pushed + labelled -- body-only, NO node
 *  walk (that's {@link walkSwitchCaseBody}, run in a SEPARATE, earlier
 *  pass -- `addIngoingArrows`'s own push order, `first, last, then
 *  interior ascending` (`FtileSwitchWithManyLinks.java:432-444`), differs
 *  from the natural left-to-right order the case BOXES draw in, so the
 *  two can't share one ascending loop). */
function pushCaseInEdge(step: SwitchCaseStep, args: OneCaseArgs, out: Out): void {
  const { diamond, myLane, totalCases } = step;
  const { i, c, cPos, label } = args;

  // `FtileSwitchWithOneLink`'s connections (`:64-121`) are untranslatable and
  // have no cross-swimlane variant: across lanes, no in-link and no label.
  const lanes = [laneOut(diamond, myLane), laneIn(c, myLane)] as const;
  if (totalCases === 1 && !nonTranslatableConnectionDrawn(step.gate, ...lanes)) return;
  const points = diamondToCasePoints(step, i, cPos, c);
  const to = points[points.length - 1]!;
  const south = diamond.getCoord(SOUTH_HOOK);
  const hThenVLoop: LoopTranslate = {
    kind: 'switch-h-then-v-cross',
    p1: { x: step.dPos.x + south.x, y: step.dPos.y + south.y },
    p2: to,
    diamond1: { width: diamond.width, height: diamond.height },
  };
  pushEdge(out, points, laneOut(diamond, myLane), laneIn(c, myLane), { loop: hThenVLoop });
  applyLastEdgeLabel(out, label, caseInLabelAlign(i, totalCases));
}

/**
 * `differentSwimlane(this, tile)` (`FtileSwitchWithManyLinks.java:406-410`)
 * gates {@link getFirstOutgoingArrow}/{@link getLastOutgoingArrow}'s window
 * (`:489-507`) on `this.getSwimlaneOut() != tile.getSwimlaneIn()`. `this`
 * here is the SWITCH itself: `FtileSwitchNude#getSwimlaneOut()` returns
 * `getSwimlaneIn()` (`FtileSwitchNude.java:85-86`), which returns the
 * switch's own single `in` field -- set once at construction
 * (`FtileSwitchWithDiamonds.java:67-68`, `FtileSwitchNude.java:52-58`) and
 * shared, unconditionally, by every branch. `tile.getSwimlaneIn()` for a
 * DIRECT case of the switch is therefore ALWAYS that same `in` lane -- a
 * branch's entry lane is a property of the switch dispatching into it, not
 * of what the branch's own first statement later does (an internal
 * `|lane|` directive changes the lane AFTER entry, never retroactively).
 * `differentSwimlane(this, tile)` is thus structurally always false at
 * THIS call site: no case is ever excluded from the window on lane
 * grounds (contrast `FtileSwitchWithManyLinks.java:466-471`'s SEPARATE
 * loop, `pushOneMergeEdge`'s own `switch-v-then-h-cross` tag below, which
 * compares the REAL leaf-resolved exit lane and genuinely can differ).
 * No port-side `sameLane` check belongs here at all -- `hasPointOut()` is
 * the only live condition upstream ever applies.
 */

/** `FtileSwitchWithManyLinks#getFirstOutgoingArrow` (`:489-497`): the
 *  FIRST case (index `0..n-2`, the last index is NEVER checked here) with
 *  an out point; `tiles.size()` (the sentinel, "none found") otherwise. */
function getFirstOutgoingArrow(caseTiles: readonly Tile[]): number {
  const n = caseTiles.length;
  for (let i = 0; i < n - 1; i++) {
    if (caseTiles[i]!.hasPointOut()) return i;
  }
  return n;
}

/** `FtileSwitchWithManyLinks#getLastOutgoingArrow` (`:499-507`): the LAST
 *  case (full `n-1..0` range) with an out point; `-1` ("none found")
 *  otherwise. */
function getLastOutgoingArrow(caseTiles: readonly Tile[]): number {
  for (let i = caseTiles.length - 1; i >= 0; i--) {
    if (caseTiles[i]!.hasPointOut()) return i;
  }
  return -1;
}

function hexagonInOut(tile: Tile, pos: GPoint): { west: GPoint; east: GPoint; north: GPoint } {
  const w = tile.getCoord(WEST_HOOK);
  const e = tile.getCoord(EAST_HOOK);
  const nIn = tile.getCoord(NORTH_HOOK);
  return {
    west: { x: pos.x + w.x, y: pos.y + w.y },
    east: { x: pos.x + e.x, y: pos.y + e.y },
    north: { x: pos.x + nIn.x, y: pos.y + nIn.y },
  };
}

interface MergeEdgeStep {
  readonly diamond: Tile;
  readonly dPos: GPoint;
  readonly mergeDiamond: Tile;
  readonly mPos: GPoint;
  readonly myLane: string | undefined;
  readonly gate: ReadonlySet<string> | undefined;
}

/** One case-to-merge edge push (`ConnectionVerticalThenHorizontal` when
 *  `asFirstOrLast`, else `ConnectionVerticalBottom`) -- extracted out of
 *  {@link pushCaseToMergeEdges} purely to keep that function's NLOC
 *  under the complexity hook's cap. T1d row 32: the case's own trailing
 *  `-> label;` (`c.outLabel`) is drawn CENTER-aligned, gated on >1 case
 *  (`FtileSwitchWithOneLink`'s own connector never calls `.withLabel()`).
 *  `add3` T3b-2: when the case's real exit lane differs from the merge
 *  diamond's (the SAME comparison `routeEdge`'s own `isCrossLane` makes
 *  downstream, duplicated here since the label decision must be made at
 *  push time, before `swimlane-placement.ts` runs), the connector that
 *  actually draws is `ConnectionVerticalThenHorizontalCrossSwimlane`
 *  (`FtileSwitchWithManyLinks.java:352-356`), whose constructor takes no
 *  label param at all -- unlike the same-lane classes' own `.withLabel()`
 *  call (`:176-177,274-275`), it never attaches one. */
function pushOneMergeEdge(step: MergeEdgeStep, c: Tile, cPos: GPoint, asFirstOrLast: boolean, out: Out): void {
  const southC = c.getCoord(SOUTH_HOOK);
  const p1 = { x: cPos.x + southC.x, y: cPos.y + southC.y };
  const hex1 = hexagonCorners(step.diamond, step.dPos);
  const hex2 = hexagonInOut(step.mergeDiamond, step.mPos);
  const vThenH = asFirstOrLast ? verticalThenHorizontalPoints(p1, hex2) : undefined;
  const points = vThenH?.points ?? verticalBottomPoints(p1, hex1, hex2);
  const vThenHLoop: LoopTranslate = {
    kind: 'switch-v-then-h-cross',
    p1,
    p2: hex2.north,
    diamond2: { width: step.mergeDiamond.width, height: step.mergeDiamond.height },
  };
  const laneOutC = laneOut(c, step.myLane);
  const laneInMerge = laneIn(step.mergeDiamond, step.myLane);
  pushEdge(out, points, laneOutC, laneInMerge, { loop: vThenHLoop });
  if (laneOutC !== laneInMerge) return;
  // add4-T1f (R1): same-lane only -- the cross-lane class picks its own
  // LEFT/RIGHT arrow from the translated points (`:363-381`).
  if (vThenH !== undefined) out.edges[out.edges.length - 1]!.endDirection = vThenH.direction;
  // isw-T2-act F5: `getTextBlockSpecial()` (`FtileSwitchWithManyLinks.java:455-462`).
  if (c.outLabel !== undefined)
    applyOutLabel(out, { outLabel: { ...c.outLabel, wrapped: true } }, CASE_OUT_LABEL_ALIGN);
}

/**
 * `FtileSwitchWithManyLinks#addOutgoingArrows`'s first loop (`:447-465`):
 * the window is never lane-filtered ({@link getFirstOutgoingArrow}'s own
 * doc), so `pushOneMergeEdge` runs for every case in range, same-lane or
 * not -- `loop`-tagging inside it (unconditional, like {@link
 * pushCaseInEdge}'s own `hThenVLoop`) is what makes a genuinely cross-lane
 * push resolve to the right shape downstream (`routeEdge`'s own
 * `isCrossLane` dispatch), never a second, separate code path here. Two
 * independent `if`s -- NOT `else if` -- for the first/last pushes: when
 * the only qualifying case is both (`firstOutgoingArrow ===
 * lastOutgoingArrow > 0`), upstream really does push the SAME connector
 * twice (verified against the literal `:454-458` source, not "fixed").
 */
function pushCaseToMergeEdges(
  step: MergeEdgeStep,
  caseTiles: readonly Tile[],
  positions: readonly GPoint[],
  out: Out,
): void {
  const n = caseTiles.length;
  const firstIdx = getFirstOutgoingArrow(caseTiles);
  const lastIdx = getLastOutgoingArrow(caseTiles);
  if (lastIdx === -1) return;
  // Per-case body position: each case sits its OWN in-label height below
  // the row (`FtileDecorateInLabel#drawU`, `gtile-switch.ts#decorateCase`).
  const posOf = (i: number): GPoint => positions[i]!;
  if (firstIdx < n) pushOneMergeEdge(step, caseTiles[firstIdx]!, posOf(firstIdx), true, out);
  if (lastIdx > 0) pushOneMergeEdge(step, caseTiles[lastIdx]!, posOf(lastIdx), true, out);
  for (let i = firstIdx + 1; i < lastIdx; i++) {
    if (caseTiles[i]!.hasPointOut()) pushOneMergeEdge(step, caseTiles[i]!, posOf(i), false, out);
  }
}

/** `FtileSwitchWithOneLink$ConnectionVerticalBottom#drawU` (`:107-121`):
 *  the single-case switch's only case-to-merge edge, no cross-swimlane
 *  variant (that class exists only on `FtileSwitchWithManyLinks`) and no
 *  `.withLabel()` call (so no `applyOutLabel`, unlike the many-case path). */
function pushOneLinkMergeEdge(step: MergeEdgeStep, c: Tile, cPos: GPoint, out: Out): void {
  const southC = c.getCoord(SOUTH_HOOK);
  const p1 = { x: cPos.x + southC.x, y: cPos.y + southC.y };
  const northM = step.mergeDiamond.getCoord(NORTH_HOOK);
  const p2 = { x: step.mPos.x + northM.x, y: step.mPos.y + northM.y };
  const lane1 = laneOut(c, step.myLane);
  const lane2 = laneIn(step.mergeDiamond, step.myLane);
  if (!nonTranslatableConnectionDrawn(step.gate, lane1, lane2)) return; // as `pushCaseInEdge`
  pushEdge(out, oneLinkBottomPoints(p1, p2), lane1, lane2);
}

interface OneCaseArgs {
  readonly i: number;
  readonly c: Tile;
  readonly cPos: GPoint;
  readonly label: string | undefined;
}

/** One case's own box/body walk -- extracted out of {@link walkSwitchCases}'s
 *  first pass purely to keep that function's NLOC under the complexity
 *  hook's cap. Case-to-merge edges are pushed after every in-edge, by
 *  {@link pushMergeEdges}. */
function walkOneCaseBody(step: SwitchCaseStep, args: OneCaseArgs, out: Out): void {
  const { c } = args;
  const duplicatePerLane = step.isBigDiamond && !(unwrapSingleChildTopDown(c) instanceof TileComposite);
  walkSwitchCaseBody(step, { ...args, duplicatePerLane }, out);
}

/** The case-to-merge edges, pushed AFTER the diamond1-in edges. One case:
 *  `FtileSwitchWithOneLink#addLinks` adds `ConnectionVerticalTop` (the
 *  labelled in-link) and only then `ConnectionVerticalBottom`
 *  (`FtileSwitchWithOneLink.java:134-143`). Many cases:
 *  {@link pushCaseToMergeEdges}. */
function pushMergeEdges(step: SwitchCaseStep, cases: readonly Tile[], positions: readonly GPoint[], out: Out): void {
  if (step.mergeDiamond === null || step.mPos === null) return;
  const mergeStep: MergeEdgeStep = {
    diamond: step.diamond,
    dPos: step.dPos,
    mergeDiamond: step.mergeDiamond,
    mPos: step.mPos,
    myLane: step.myLane,
    gate: step.gate,
  };
  if (step.totalCases > 1) {
    pushCaseToMergeEdges(mergeStep, cases, positions, out);
    return;
  }
  const c = cases[0];
  if (c !== undefined && c.hasPointOut()) pushOneLinkMergeEdge(mergeStep, c, positions[0]!, out);
}

/** The diamond1-in edges for every case, in `addIngoingArrows`'s own push
 *  order -- first case, then last case, then every interior case
 *  ascending (`FtileSwitchWithManyLinks.java:432-444`) -- NOT the cases'
 *  own left-to-right array order. Extracted out of {@link walkSwitchCases}
 *  purely to keep that function's NLOC under the complexity hook's cap. */
function pushCaseInEdges(
  step: SwitchCaseStep,
  cases: readonly Tile[],
  positions: readonly GPoint[],
  tile: GtileSwitch,
  out: Out,
): void {
  const n = cases.length;
  const pushAt = (i: number): void =>
    pushCaseInEdge(step, { i, c: cases[i]!, cPos: positions[i]!, label: tile.caseLabels[i] }, out);
  pushAt(0);
  if (n > 1) pushAt(n - 1);
  for (let i = 1; i < n - 1; i++) pushAt(i);
}

/** {@link walkSwitch}'s own case-tile loop, split out purely to keep that
 *  function's NLOC under the complexity hook's cap. Three passes, each in
 *  upstream's own order (not necessarily the same order as each other):
 *  case boxes left-to-right, diamond1-in edges `first,last,interior`
 *  ({@link pushCaseInEdges}), then the case-to-merge edges
 *  ({@link pushMergeEdges}). */
function walkSwitchCases(tile: GtileSwitch, x: number, step: SwitchCaseStep, out: Out): void {
  const cases = tile.children.slice(1, 1 + tile.caseOffsets.length);
  const positions: GPoint[] = [];
  for (let i = 0; i < cases.length; i++) {
    const cPos = { x: x + tile.caseOffsets[i]!.x, y: step.y + tile.caseOffsets[i]!.y };
    positions.push(cPos);
    walkOneCaseBody(step, { i, c: cases[i]!, cPos, label: tile.caseLabels[i] }, out);
  }
  pushCaseInEdges(step, cases, positions, tile, out);
  pushMergeEdges(step, cases, positions, out);
}

export function walkSwitch(tile: GtileSwitch, x: number, y: number, myLane: string | undefined, out: Out): void {
  const rawChildren = tile.children;
  const diamond = rawChildren[0]!;
  const hasMerge = tile.mergeOffset !== null;
  const mergeDiamond = hasMerge ? rawChildren[rawChildren.length - 1]! : null;

  const dPos = { x: x + tile.diamondOffset.x, y: y + tile.diamondOffset.y };
  pushSwitchDiamond(diamond, dPos, 'if-split', myLane, out);

  const mPos = tile.mergeOffset !== null ? { x: x + tile.mergeOffset.x, y: y + tile.mergeOffset.y } : null;
  const step: SwitchCaseStep = {
    diamond,
    dPos,
    mergeDiamond,
    mPos,
    myLane,
    y,
    totalCases: tile.caseOffsets.length,
    isBigDiamond: tile.isBigDiamond,
    gate: compositeLaneGate(myLane, tile.children.slice(1, 1 + tile.caseOffsets.length), myLane),
  };
  walkSwitchCases(tile, x, step, out);

  // `FtileSwitchWithDiamonds#drawU` draws diamond2 only `if
  // (calculateDimension(stringBounder).hasPointOut())` (`:142-143`) -- a
  // switch whose every case ends in `stop`/`kill`/`detach` has no merge.
  if (mergeDiamond !== null && mPos !== null && tile.hasPointOut())
    pushSwitchDiamond(mergeDiamond, mPos, 'if-merge', myLane, out);
}
