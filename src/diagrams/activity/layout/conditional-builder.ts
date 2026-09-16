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

import type { ActivityIf, ActivityElseIf, ActivityNode } from '../ast.js';
import type { Theme } from '../../../core/theme.js';
import type { StringBounder, Tile } from '../tiles/tile.js';
import { GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import { GtileDiamondInside2 } from '../tiles/gtile-diamond-inside2.js';
import { GtileIfDown } from '../tiles/gtile-if-down.js';
import { GtileIfWithLinks } from '../tiles/gtile-if-with-links.js';
import type { IfWithLinksBranch } from '../tiles/gtile-if-with-links.js';
import { GtileIfLongHorizontal } from '../tiles/gtile-if-long-horizontal.js';
import { GtileTopDown } from '../tiles/gtile-top-down.js';
import { tileNodes } from './tile-layout.js';
import { laneOut } from './swimlane-lanes.js';

export type IfBuilder = 'down' | 'with-links' | 'long-horizontal';

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
 * `InstructionList#isOnlySingleStopOrSpot` mapped onto our AST (T1 Q0):
 * a lone `stop`/`end`, or `[action, kill|detach]` (Java mutates a killed
 * action in place, `all.size()==1`; our port models `kill`/`detach` as
 * their own node, so the Java-equivalent case is two of ours).
 * `InstructionSpot` has no AST analogue (zero corpus usage, documented gap).
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionList.java:90-106
 */
function isStopOrSpot(nodes: readonly ActivityNode[]): boolean {
  if (nodes.length === 1 && (nodes[0]!.kind === 'stop' || nodes[0]!.kind === 'end')) return true;
  if (nodes.length === 2 && nodes[0]!.kind === 'action') {
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

/**
 * `FtileFactoryDelegatorIf#createIf` (`thens.size() > 1` -> long-horizontal,
 * `:85-92`) composed with `ConditionalBuilder#create`'s own four-condition
 * dispatch (`:149-161`). `branch1`/`branch2` there are `then`/`else`.
 */
export function ifBuilderOf(node: ActivityIf): IfBuilderResult {
  if (node.elseIfBranches.length > 0) return { builder: 'long-horizontal' };

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

function toBranchTile(
  nodes: readonly ActivityNode[],
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
): IfWithLinksBranch {
  const tiles = tileNodes([...nodes], bounder, theme, laneOrder);
  return { tile: new GtileTopDown(tiles, bounder, theme), isEmpty: nodes.length === 0 };
}

/**
 * `createWithLinks` (`ConditionalBuilder.java:213-232`): a `withWestAndEast`
 * hexagon, both branches, and the merge rhombus when both have a point out.
 */
function buildIfWithLinks(node: ActivityIf, bounder: StringBounder, theme: Theme, laneOrder: readonly string[]): Tile {
  const labels: { west?: string; east?: string } = {};
  if (node.thenLabel !== undefined) labels.west = node.thenLabel;
  if (node.elseLabel !== undefined) labels.east = node.elseLabel;
  const diamond1 = new GtileDiamondInside(node.condition, labels, bounder, theme);
  const branch1 = toBranchTile(node.thenBranch, bounder, theme, laneOrder);
  const branch2 = toBranchTile(node.elseBranch, bounder, theme, laneOrder);
  const laneCount = countIfSwimlanes(node);
  return new GtileIfWithLinks(diamond1, branch1, branch2, laneCount);
}

interface LongHorizontalBranch {
  readonly condition: string;
  readonly label: string | undefined;
  readonly body: readonly ActivityNode[];
}

/** `thens` = `then` plus every `elseif`, in source order (`FtileFactory
 *  DelegatorIf#createIf`'s own `thens` list). */
function longHorizontalBranches(node: ActivityIf): LongHorizontalBranch[] {
  const first: LongHorizontalBranch = { condition: node.condition, label: node.thenLabel, body: node.thenBranch };
  const rest = node.elseIfBranches.map((e: ActivityElseIf): LongHorizontalBranch => ({
    condition: e.condition,
    label: e.label,
    body: e.body,
  }));
  return [first, ...rest];
}

/**
 * Each branch's own hexagon (`.withNorth(tb1)`, the branch's own positive
 * label) plus, on the LAST branch only, the `else` clause's own positive
 * label (`.withEast(tb2)`). `inlabel` (`->label->`, `Branch#getInlabel()`)
 * has no AST analogue (documented gap, `gtile-if-long-horizontal.ts`'s own
 * doc) so every `inlabelSizes` entry this builder produces is `0`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:167-197
 */
function buildLongHorizontalDiamonds(
  branches: readonly LongHorizontalBranch[],
  elseLabel: string | undefined,
  bounder: StringBounder,
  theme: Theme,
): GtileDiamondInside2[] {
  return branches.map((b, i) => {
    const labels: { north?: string; east?: string } = {};
    if (b.label !== undefined) labels.north = b.label;
    if (i === branches.length - 1 && elseLabel !== undefined) labels.east = elseLabel;
    return new GtileDiamondInside2(b.condition, labels, bounder, theme);
  });
}

/**
 * `FtileIfLongHorizontal.create` (`elseif` chains, D1): a hexagon per
 * branch (`then` + every `elseif`), each coupled with its own branch
 * content, plus the `else` branch placed to the right of the row.
 */
function buildIfLongHorizontal(
  node: ActivityIf,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
): Tile {
  const branches = longHorizontalBranches(node);
  const tiles = branches.map(
    (b): Tile => new GtileTopDown(tileNodes([...b.body], bounder, theme, laneOrder), bounder, theme),
  );
  const tile2 = new GtileTopDown(tileNodes([...node.elseBranch], bounder, theme, laneOrder), bounder, theme);
  const diamonds = buildLongHorizontalDiamonds(branches, node.elseLabel, bounder, theme);
  const inlabelSizes = branches.map(() => 0);
  return new GtileIfLongHorizontal(diamonds, tiles, tile2, inlabelSizes);
}

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
 * `createDown` (`ConditionalBuilder.java:170-191`) composed with
 * `FtileIfDown.create` (`:124-159`): a `withSouth(mainLabel)
 * .withEast(sideLabel)` hexagon, the main flow's own raw content, and
 * either the merge rhombus or the other branch's own raw content as a side
 * box (`optionalStop`).
 */
function buildIfDown(
  node: ActivityIf,
  bounder: StringBounder,
  theme: Theme,
  dispatch: IfBuilderResult,
  laneOrder: readonly string[],
): Tile {
  const thenTile = new GtileTopDown(tileNodes([...node.thenBranch], bounder, theme, laneOrder), bounder, theme);
  const elseTile = new GtileTopDown(tileNodes([...node.elseBranch], bounder, theme, laneOrder), bounder, theme);
  const parts = resolveIfDownParts(node, dispatch.swapped === true, thenTile, elseTile);

  const labels: { south?: string; east?: string } = {};
  if (parts.mainLabel !== undefined) labels.south = parts.mainLabel;
  if (parts.sideLabel !== undefined) labels.east = parts.sideLabel;
  const diamond1 = new GtileDiamondInside(node.condition, labels, bounder, theme);

  const optionalStop = dispatch.optionalStop === true ? parts.sideTile : null;
  const hasTwoBranches = thenTile.hasPointOut() && elseTile.hasPointOut();
  const useElse1 =
    optionalStop === null &&
    parts.mainTile.hasPointOut() &&
    isMainLaneSmallerThanAllOthers(node.swimlane, parts.mainNodes, laneOrder);
  if (useElse1) diamond1.swapEastWest();

  const result = new GtileIfDown(diamond1, parts.mainTile, optionalStop, hasTwoBranches, useElse1);
  if (optionalStop !== null) {
    const out = laneOut(parts.mainTile, undefined);
    if (out !== undefined) result.swimlaneOut = out;
  }
  return result;
}

/**
 * `laneOrder` is `ast.swimlanes` (this diagram's real declaration order),
 * threaded from `layoutActivity` (mission `activity-if-tile-port` T4).
 * Defaulted to `[]` so direct unit-test callers that only exercise unlaned
 * fixtures need not pass it.
 */
export function buildIf(
  node: ActivityIf,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[] = [],
): Tile {
  const dispatch = ifBuilderOf(node);
  if (dispatch.builder === 'with-links') return buildIfWithLinks(node, bounder, theme, laneOrder);
  if (dispatch.builder === 'down') return buildIfDown(node, bounder, theme, dispatch, laneOrder);
  return buildIfLongHorizontal(node, bounder, theme, laneOrder);
}
