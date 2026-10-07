/**
 * `ConditionalBuilder#create`'s dispatch (`ifBuilderOf`, T1's Q0 note) and
 * all three builders (`buildIf`). The legacy single-diamond tile and its
 * `long-horizontal` fallback are retired here (T5, the task that lands the
 * last if-builder, D1). A circular import with `tile-layout.ts` (this
 * module calls back into `tileNodes` to tile a branch's own body;
 * `tile-layout.ts#tileIf` calls `buildIf`) is safe the same way
 * `tile-coordinates.ts`/`walk-fork-branches.ts` already document: both
 * sides are function DEFINITIONS, neither calls the other until a real
 * layout runs, well after both modules finish loading.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/ConditionalBuilder.java:143-191
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileFactoryDelegatorIf.java:85-92
 */

import type { ActivityIf, ActivityNode } from '../ast.js';
import type { Theme } from '../../../core/theme.js';
import { Pragma } from '../../../core/skin/Pragma.js';
import { PragmaKey } from '../../../core/skin/PragmaKey.js';
import type { StringBounder, Tile } from '../tiles/tile.js';
import { GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import type { DiamondConditionTile, DiamondInsideLabels } from '../tiles/gtile-diamond-inside.js';
import { GtileDiamondSquare } from '../tiles/gtile-diamond-square.js';
import { GtileDiamondEmpty } from '../tiles/gtile-diamond-empty.js';
import { GtileIfDown } from '../tiles/gtile-if-down.js';
import { GtileIfWithLinks } from '../tiles/gtile-if-with-links.js';
import type { IfWithLinksBranch } from '../tiles/gtile-if-with-links.js';
import { GtileTopDown } from '../tiles/gtile-top-down.js';
import { measureIfOwnNote } from '../tiles/gtile-note.js';
import { tileNodes } from './tile-layout.js';
import { laneOut } from './swimlane-lanes.js';
import { buildIfLongHorizontal, buildIfLongVertical } from './conditional-builder-long.js';

export type IfBuilder = 'down' | 'with-links' | 'long-horizontal' | 'long-vertical';

/**
 * `laneOrder` (`ast.swimlanes`) + `pragma` (`ast.pragma`, D12/T1p-b),
 * bundled so threading both through `buildIfDown`/`shouldUseElse1` (each
 * already at the file's 5-param cap with `dispatch`/`optionalStop`/`parts`/
 * `swimlane`) does not push them over it. `buildIf`'s own PUBLIC signature
 * keeps them as two separate positional params (matching `tile-layout.ts
 * #tileIf`'s existing call convention); this type is purely an internal
 * bundling device for this file's own private builder helpers.
 */
export interface IfLayoutCtx {
  readonly laneOrder: readonly string[];
  readonly pragma: Pragma;
}

export interface IfBuilderResult {
  readonly builder: IfBuilder;
  /** `true` iff the visual main flow is the ORIGINAL else-branch. Only
   *  meaningful for `builder === 'down'`. */
  readonly swapped?: boolean;
  /** `true` iff the non-main branch is a genuine side box (a lone
   *  stop/end/killed-action), not merely empty. Only meaningful for
   *  `builder === 'down'`. */
  readonly optionalStop?: boolean;
}

/**
 * `InstructionList#isOnlySingleStopOrSpot` mapped onto our AST (T1 Q0,
 * amended T3d/zaloze): a lone `stop`/`end`, OR a lone `spot` (`(X)` with
 * no `detach`/`kill`), OR `[action|spot, kill|detach]` (Java mutates a
 * killed action/spot IN PLACE, `all.size()==1`; our port models
 * `kill`/`detach` as their own node, so the Java-equivalent case is two of
 * ours). `InstructionSpot.isOnlySingleStopOrSpot` returns `true`
 * UNCONDITIONALLY for a bare spot -- `killed` only matters for rendering
 * (`hasPointOut`), never for this routing check, mirroring
 * `InstructionSimple#isKilled()`'s own gate for a plain `action`.
 * `ActivitySpot` (`ast.ts`, mission T2g) gave `(X)` its own AST node kind
 * after this comment was first written; the kind was never added here,
 * so a killed/bare spot else-branch (`zaloze-31-jibo311`) fell through to
 * `with-links` instead of `down`.
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionList.java:90-106
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionSpot.java
 */
function isStopOrSpot(nodes: readonly ActivityNode[]): boolean {
  if (nodes.length === 1 && (nodes[0]!.kind === 'stop' || nodes[0]!.kind === 'end' || nodes[0]!.kind === 'spot')) {
    return true;
  }
  if (nodes.length === 2 && (nodes[0]!.kind === 'action' || nodes[0]!.kind === 'spot')) {
    const second = nodes[1]!.kind;
    return second === 'kill' || second === 'detach';
  }
  return false;
}

function isEmptyOrStopOrSpot(nodes: readonly ActivityNode[]): boolean {
  return nodes.length === 0 || isStopOrSpot(nodes);
}

/**
 * `createDown`'s own re-check (`:170-191`): given the two branches IN THE
 * ORDER `createDown` was called with, decide which is the main flow and
 * whether the other is a genuine `optionalStop` side box. `paramAIsElse`
 * records whether `paramA` is the ORIGINAL else-branch, so the result's
 * `swapped` is relative to the original then/else, not to `paramA`/`paramB`.
 */
function createDownResult(
  paramA: readonly ActivityNode[],
  paramB: readonly ActivityNode[],
  paramAIsElse: boolean,
): IfBuilderResult {
  if (isStopOrSpot(paramB)) return { builder: 'down', swapped: paramAIsElse, optionalStop: true };
  if (isStopOrSpot(paramA)) return { builder: 'down', swapped: !paramAIsElse, optionalStop: true };
  if (paramA.length === 0) return { builder: 'down', swapped: !paramAIsElse };
  // `paramB` is guaranteed empty here (the outer guard only reaches
  // `createDown` when at least one side is empty-or-stop-or-spot).
  return { builder: 'down', swapped: paramAIsElse };
}

/** `node.elseIfBranches.length > 0`'s own builder pick -- split out of
 *  {@link ifBuilderOf} purely to keep that function's own CCN under the
 *  file's limit (the pragma read adds one more branch to an already-at-cap
 *  function). `pragma.isTrue(PragmaKey.USE_VERTICAL_IF)` is the EXACT
 *  upstream call site.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileFactoryDelegatorIf.java:86 */
function chainBuilderOf(pragma: Pragma): IfBuilderResult {
  return { builder: pragma.isTrue(PragmaKey.USE_VERTICAL_IF) ? 'long-vertical' : 'long-horizontal' };
}

/**
 * `FtileFactoryDelegatorIf#createIf` (`thens.size() > 1` -> long-horizontal
 * or, under `!pragma useVerticalIf true`, long-vertical; `:85-92`) composed
 * with `ConditionalBuilder#create`'s own four-condition dispatch
 * (`:149-161`). `branch1`/`branch2` there are `then`/`else`.
 *
 * `pragma` defaults to an empty `Pragma` (`isTrue` always `false` on an
 * empty table) so a direct unit-test caller that only exercises unlaned,
 * unpragma'd fixtures need not pass it -- same convention as `laneOrder`'s
 * own `= []` default immediately below.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileFactoryDelegatorIf.java:85-88
 */
export function ifBuilderOf(node: ActivityIf, pragma: Pragma = Pragma.createEmpty()): IfBuilderResult {
  if (node.elseIfBranches.length > 0) return chainBuilderOf(pragma);

  const thenNodes = node.thenBranch;
  const elseNodes = node.elseBranch;
  const thenSOS = isEmptyOrStopOrSpot(thenNodes);
  const elseSOS = isEmptyOrStopOrSpot(elseNodes);

  if (elseSOS && !thenSOS) return createDownResult(thenNodes, elseNodes, false);
  if (thenNodes.length === 0 && isStopOrSpot(elseNodes)) return createDownResult(thenNodes, elseNodes, false);
  if (thenSOS && !elseSOS) return createDownResult(elseNodes, thenNodes, true);
  if (elseNodes.length === 0 && isStopOrSpot(thenNodes)) return createDownResult(elseNodes, thenNodes, true);
  return { builder: 'with-links' };
}

/**
 * This `if`'s own transitively-touched swimlane set (`getSwimlanes()`,
 * `FtileIfNude.java:79-87`): its own lane plus every lane touched anywhere
 * in either branch, recursively. Judgment call (decision journal): a
 * reasonably faithful recursive collector, not an exhaustive port of every
 * `Swimable` subtype's own `getSwimlanes()` override -- immaterial to T3's
 * own acceptance fixtures (all three representative `with-links` slugs are
 * unlaned, T1 Q1), and only shifts `getYdelta1a/1b`'s spacing on a laned
 * `with-links` fixture elsewhere in the corpus.
 */
function addOwnLanes(n: ActivityNode, acc: Set<string>): void {
  if (n.swimlane !== undefined) acc.add(n.swimlane);
  if ('swimlaneOut' in n && n.swimlaneOut !== undefined) acc.add(n.swimlaneOut);
}

/** The nested branch/body arrays a compound node owns, split out of
 *  {@link collectSwimlanes} only to keep that function's own CCN under the
 *  file's limit. */
function collectNestedLanes(n: ActivityNode, acc: Set<string>): void {
  switch (n.kind) {
    case 'if':
      collectSwimlanes(n.thenBranch, acc);
      collectSwimlanes(n.elseBranch, acc);
      for (const ei of n.elseIfBranches) collectSwimlanes(ei.body, acc);
      return;
    case 'while':
    case 'repeat':
      collectSwimlanes(n.body, acc);
      return;
    case 'fork':
    case 'split':
      for (const b of n.branches) collectSwimlanes(b, acc);
      return;
    default:
      return;
  }
}

function collectSwimlanes(nodes: readonly ActivityNode[], acc: Set<string>): void {
  for (const n of nodes) {
    addOwnLanes(n, acc);
    collectNestedLanes(n, acc);
  }
}

function countIfSwimlanes(node: ActivityIf): number {
  const acc = new Set<string>();
  if (node.swimlane !== undefined) acc.add(node.swimlane);
  collectSwimlanes(node.thenBranch, acc);
  collectSwimlanes(node.elseBranch, acc);
  return acc.size;
}

// A trailing `-> label;` on either branch is discarded here, not wired:
// confirmed by grep (`getSpecial` appears nowhere in `cond/
// FtileIfWithLinks.java`) that the `with-links` builder never reads
// `Branch#special` -- `out2` is hardcoded `null` at both of its
// construction sites (`FtileIfWithLinks.java:548-549`, already noted
// NOT APPLICABLE by `.agent-notes/add3-T1b.md` row 29).
function toBranchTile(nodes: readonly ActivityNode[], bounder: StringBounder, theme: Theme, ctx: IfLayoutCtx): IfWithLinksBranch {
  const { tiles } = tileNodes([...nodes], bounder, theme, ctx.laneOrder, ctx.pragma);
  return { tile: new GtileTopDown(tiles, bounder, theme), isEmpty: nodes.length === 0 };
}

/**
 * `ConditionalBuilder.getShape1` (`:250-277`): `INSIDE_DIAMOND` ->
 * `FtileDiamondSquare` (add2 T3h); `EMPTY_DIAMOND` -> `FtileDiamond`
 * (add3 T3a, CONDSTYLE-EMPTY) -- `.withNorth(tbTest)` in BOTH of
 * `getShape1`'s own `eastWest` branches (`:261,264`), so the condition
 * text always routes to NORTH here too, same as `GtileDiamondInside`/
 * `GtileDiamondSquare`'s own center `label` param slot -- `label` below IS
 * `GtileDiamondEmpty`'s `testLabel` constructor argument, not read via
 * `labels`. Else (default) `FtileDiamondInside`.
 *
 * Only wired for `buildIfDown`'s own caller (`:381` below) -- `buildIf
 * WithLinks` (`:244`) still hardcodes `GtileDiamondInside` regardless of
 * `conditionStyle`, a PRE-EXISTING gap (unrelated to this function) this
 * task's write-set cannot close: `gtile-if-with-links.ts`/`walk-if-with-
 * links.ts` both type `diamond1` as the concrete `GtileDiamondInside`
 * class (verified directly, not the "add2 T3h widened" `DiamondCondition
 * Tile` union that `gtile-diamond-inside.ts`'s own doc comment claims --
 * that claim does not hold up against the current source and is not
 * repeated here), and `walk-if-with-links.ts` is explicitly outside this
 * task's write-set (`layout/walk-if-*.ts`).
 */
function createConditionDiamond(
  label: string,
  labels: DiamondInsideLabels,
  bounder: StringBounder,
  theme: Theme,
): DiamondConditionTile {
  if (theme.conditionStyle === 'emptyDiamond') return new GtileDiamondEmpty(label, labels, bounder, theme);
  if (theme.conditionStyle === 'insideDiamond') return new GtileDiamondSquare(label, labels, bounder, theme);
  return new GtileDiamondInside(label, labels, bounder, theme);
}

/**
 * `createWithLinks` (`ConditionalBuilder.java:213-232`): a `withWestAndEast`
 * hexagon, both branches, and the merge rhombus when both have a point out.
 * `node.notes` (T2a's `ActivityIf.notes` capture) is pre-measured here
 * (never raw inside `gtile-if-with-links.ts`, same convention `buildIfDown`
 * already uses for its own single opale) and threaded into `create`'s own
 * note-geometry pre-pass (add3-T2a-2, the general `FtileIfWithDiamonds`
 * IFNOTE mechanism -- `with-links` is the dispatch EVERY two-real-branch
 * `if` with an own note actually reaches; `GtileIfDown` only owns the
 * empty/stop-or-spot-branch case).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithDiamonds.java:79-111
 */
function buildIfWithLinks(node: ActivityIf, bounder: StringBounder, theme: Theme, ctx: IfLayoutCtx): Tile {
  const labels: { west?: string; east?: string } = {};
  if (node.thenLabel !== undefined) labels.west = node.thenLabel;
  if (node.elseLabel !== undefined) labels.east = node.elseLabel;
  // add2 T3h: NOT createConditionDiamond -- walk-if-with-links.ts (T3f's)
  // still types diamond1 concretely; re-slotted below.
  const diamond1 = new GtileDiamondInside(node.condition, labels, bounder, theme);
  const branch1 = toBranchTile(node.thenBranch, bounder, theme, ctx);
  const branch2 = toBranchTile(node.elseBranch, bounder, theme, ctx);
  const laneCount = countIfSwimlanes(node);
  const notes = (node.notes ?? []).map((n) => measureIfOwnNote(n, bounder, theme));
  return GtileIfWithLinks.create(diamond1, branch1, branch2, laneCount, { conditionEndStyle: theme.conditionEndStyle, notes });
}

// `longHorizontalBranches`/`buildIfLongHorizontal`/`buildIfLongVertical`
// moved to `conditional-builder-long.ts` (hook-enforced 500-line cap,
// add2 T3i: ELSEIFIN wiring needed the room). Imported above.

/**
 * `Swimlane#isSmallerThanAllOthers` (`Swimlane.java:130-137`): `false` when
 * `others` is exactly `{this}` alone (no real switch happened); else
 * `false` the moment some touched lane's `compareTo(this) < 0` --
 * `Swimlane implements Comparable<Swimlane>` compares `order`, the
 * declaration-index each lane is assigned the FIRST time `|name|` is
 * parsed anywhere in the diagram (`Swimlanes.java`'s `getCurrentSwimlane`,
 * mirrored by `laneOrder` here, `ast.swimlanes`, threaded from
 * `layoutActivity` through `tileNodes`/`tileNode`/`tileIf`/`buildIf` --
 * mission `activity-if-tile-port` T4, decision journal: this is a
 * deviation from T4's originally declared write-set, pre-authorised
 * because `tile-layout.ts` is inside T3's write-set already).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlane.java:130-137
 *
 * Exported (not moved) for mission `activity-loop-tile-port` T6: `FtileRepeat
 * .create`'s own back-connection selection (`FtileRepeat.java:186-199`) calls
 * this exact predicate -- `swimlane.isSmallerThanAllOthers(repeat.getSwimlanes
 * ())`, where `repeat` there is the loop's BODY ftile, matching `mainNodes ===
 * node.body` here -- so `tile-layout.ts#tileRepeat` calls this function
 * directly rather than duplicating it.
 */
export function isMainLaneSmallerThanAllOthers(
  ifLane: string | undefined,
  mainNodes: readonly ActivityNode[],
  laneOrder: readonly string[],
): boolean {
  if (ifLane === undefined) return false;
  const touched = new Set<string>();
  collectSwimlanes(mainNodes, touched);
  if (touched.size === 0) return false;
  if (touched.size === 1 && touched.has(ifLane)) return false;

  const ifIndex = laneOrder.indexOf(ifLane);
  for (const lane of touched) {
    const laneIndex = laneOrder.indexOf(lane);
    if (laneIndex !== -1 && laneIndex < ifIndex) return false;
  }
  return true;
}

interface IfDownParts {
  readonly mainTile: Tile;
  readonly sideTile: Tile;
  readonly mainLabel: string | undefined;
  readonly sideLabel: string | undefined;
  readonly mainNodes: readonly ActivityNode[];
}

/** `createDown`'s branch selection (`ConditionalBuilder.java:170-191`):
 *  `swapped` names which ORIGINAL branch is the visual main flow. */
function resolveIfDownParts(node: ActivityIf, swapped: boolean, thenTile: Tile, elseTile: Tile): IfDownParts {
  if (swapped) {
    return {
      mainTile: elseTile,
      sideTile: thenTile,
      mainLabel: node.elseLabel,
      sideLabel: node.thenLabel,
      mainNodes: node.elseBranch,
    };
  }
  return {
    mainTile: thenTile,
    sideTile: elseTile,
    mainLabel: node.thenLabel,
    sideLabel: node.elseLabel,
    mainNodes: node.thenBranch,
  };
}

/**
 * `useElse1`'s own gate, split out of {@link buildIfDown} only to keep that
 * function's own NLOC/CCN under the file's limit. T1p-a: the swimlane-swap
 * check only runs inside `FtileIfDown.java`'s own `conditionEndStyle ==
 * DIAMOND` branch (`:139-146`) -- `hline` never swaps, regardless of lane
 * order.
 */
function shouldUseElse1(
  theme: Theme,
  optionalStop: Tile | null,
  parts: IfDownParts,
  swimlane: string | undefined,
  laneOrder: readonly string[],
): boolean {
  return (
    theme.conditionEndStyle !== 'hline' &&
    optionalStop === null &&
    parts.mainTile.hasPointOut() &&
    isMainLaneSmallerThanAllOthers(swimlane, parts.mainNodes, laneOrder)
  );
}

/**
 * `createDown` (`ConditionalBuilder.java:170-191`) composed with
 * `FtileIfDown.create` (`:124-159`): a `withSouth(mainLabel)
 * .withEast(sideLabel)` hexagon, the main flow's own raw content, and
 * either the merge rhombus or the other branch's own raw content as a side
 * box (`optionalStop`).
 */
/** `optionalStop`'s own exit-lane propagation -- split out of {@link
 *  buildIfDown} purely to keep that function's own NLOC under the file's
 *  limit (pre-existing, surfaced by this task's unrelated edits above). */
function applyIfDownSwimlaneOut(result: GtileIfDown, optionalStop: Tile | null, mainTile: Tile): void {
  if (optionalStop === null) return;
  const out = laneOut(mainTile, undefined);
  if (out !== undefined) result.swimlaneOut = out;
}

/** `new GtileTopDown(tileNodes(nodes, ...), bounder, theme)` -- split out
 *  of {@link buildIfDown} only to keep that function's own NLOC under the
 *  file's limit (the `ctx` bundling above added two call sites back).
 *  A trailing `-> label;` is discarded here too, same grep-confirmed
 *  reason as {@link toBranchTile}: `FtileIfDown.java` never reads
 *  `Branch#special` either. */
function branchBodyTile(nodes: readonly ActivityNode[], bounder: StringBounder, theme: Theme, ctx: IfLayoutCtx): Tile {
  return new GtileTopDown(tileNodes([...nodes], bounder, theme, ctx.laneOrder, ctx.pragma).tiles, bounder, theme);
}

function buildIfDown(node: ActivityIf, bounder: StringBounder, theme: Theme, dispatch: IfBuilderResult, ctx: IfLayoutCtx): Tile {
  const thenTile = branchBodyTile(node.thenBranch, bounder, theme, ctx);
  const elseTile = branchBodyTile(node.elseBranch, bounder, theme, ctx);
  const parts = resolveIfDownParts(node, dispatch.swapped === true, thenTile, elseTile);

  const labels: { south?: string; east?: string } = {};
  if (parts.mainLabel !== undefined) labels.south = parts.mainLabel;
  if (parts.sideLabel !== undefined) labels.east = parts.sideLabel;
  const diamond1 = createConditionDiamond(node.condition, labels, bounder, theme);

  const optionalStop = dispatch.optionalStop === true ? parts.sideTile : null;
  const hasTwoBranches = thenTile.hasPointOut() && elseTile.hasPointOut();
  const useElse1 = shouldUseElse1(theme, optionalStop, parts, node.swimlane, ctx.laneOrder);
  if (useElse1) diamond1.swapEastWest();

  // `FtileIfDown.java:116-120`: EXACTLY one note (either side -- this
  // builder ignores `NotePosition`), else none at all (2+ silently
  // dropped). `activity-divergence-drive-3` T2a, family IFNOTE.
  const ownNote = node.notes?.length === 1 ? node.notes[0] : undefined;
  const opale = ownNote === undefined ? null : measureIfOwnNote(ownNote, bounder, theme);

  const result = new GtileIfDown(diamond1, parts.mainTile, optionalStop, {
    hasTwoBranches,
    useElse1,
    conditionEndStyle: theme.conditionEndStyle,
    opale,
  });
  applyIfDownSwimlaneOut(result, optionalStop, parts.mainTile);
  return result;
}

/**
 * `laneOrder` is `ast.swimlanes` (this diagram's real declaration order),
 * threaded from `layoutActivity` (mission `activity-if-tile-port` T4).
 * `pragma` is `ast.pragma` (D12/T1p-b, `!pragma useVerticalIf true` ->
 * `ifBuilderOf`'s own `pragma.isTrue(PragmaKey.USE_VERTICAL_IF)` read --
 * `FtileFactoryDelegatorIf.java:86`'s exact call site). Both defaulted so
 * a direct unit-test caller that only exercises unlaned, unpragma'd
 * fixtures need not pass either.
 */
export function buildIf(
  node: ActivityIf,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[] = [],
  pragma: Pragma = Pragma.createEmpty(),
): Tile {
  const dispatch = ifBuilderOf(node, pragma);
  const ctx: IfLayoutCtx = { laneOrder, pragma };
  if (dispatch.builder === 'with-links') return buildIfWithLinks(node, bounder, theme, ctx);
  if (dispatch.builder === 'down') return buildIfDown(node, bounder, theme, dispatch, ctx);
  if (dispatch.builder === 'long-vertical') return buildIfLongVertical(node, bounder, theme, ctx);
  return buildIfLongHorizontal(node, bounder, theme, ctx);
}
