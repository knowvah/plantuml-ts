/**
 * `ConditionalBuilder#create`'s dispatch (`ifBuilderOf`, T1's Q0 note) and
 * the `with-links` builder (`buildIf`) -- `down`/`long-horizontal` still
 * fall back to the legacy `GtileIf` (T4/T5 replace them). A circular import
 * with `tile-layout.ts` (this module calls back into `tileNodes` to tile a
 * branch's own body; `tile-layout.ts#tileIf` calls `buildIf`) is safe the
 * same way `tile-coordinates.ts`/`walk-fork-branches.ts` already document:
 * both sides are function DEFINITIONS, neither calls the other until a
 * real layout runs, well after both modules finish loading.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/ConditionalBuilder.java:143-191
 */

import type { ActivityIf, ActivityNode } from '../ast.js';
import type { Theme } from '../../../core/theme.js';
import type { StringBounder, Tile } from '../tiles/tile.js';
import { GtileDiamond } from '../tiles/gtile-diamond.js';
import { GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import { GtileIf } from '../tiles/gtile-if.js';
import { GtileIfWithLinks } from '../tiles/gtile-if-with-links.js';
import type { IfWithLinksBranch } from '../tiles/gtile-if-with-links.js';
import { GtileTopDown } from '../tiles/gtile-top-down.js';
import { tileNodes } from './tile-layout.js';

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

function toBranchTile(nodes: readonly ActivityNode[], bounder: StringBounder, theme: Theme): IfWithLinksBranch {
  const tiles = tileNodes([...nodes], bounder, theme);
  return { tile: new GtileTopDown(tiles, bounder, theme), isEmpty: nodes.length === 0 };
}

/**
 * `createWithLinks` (`ConditionalBuilder.java:213-232`): a `withWestAndEast`
 * hexagon, both branches, and the merge rhombus when both have a point out.
 */
function buildIfWithLinks(node: ActivityIf, bounder: StringBounder, theme: Theme): Tile {
  const labels: { west?: string; east?: string } = {};
  if (node.thenLabel !== undefined) labels.west = node.thenLabel;
  if (node.elseLabel !== undefined) labels.east = node.elseLabel;
  const diamond1 = new GtileDiamondInside(node.condition, labels, bounder, theme);
  const branch1 = toBranchTile(node.thenBranch, bounder, theme);
  const branch2 = toBranchTile(node.elseBranch, bounder, theme);
  const laneCount = countIfSwimlanes(node);
  return new GtileIfWithLinks(diamond1, branch1, branch2, laneCount);
}

/**
 * The pre-T3 `tileIf` body verbatim: one `GtileDiamond` condition, every
 * branch (`then`, each `elseif`, `else`) as a plain child, no merge
 * diamond. Kept byte-identical for `down`/`long-horizontal` answers until
 * T4/T5 replace them with their own builders (D1).
 */
function buildLegacyIf(node: ActivityIf, bounder: StringBounder, theme: Theme): Tile {
  const diamond = new GtileDiamond(node.condition, bounder, theme);
  const branches: Array<{ tile: Tile; label?: string }> = [];

  const thenTiles = tileNodes(node.thenBranch, bounder, theme);
  const thenEntry: { tile: Tile; label?: string } = { tile: new GtileTopDown(thenTiles, bounder, theme) };
  if (node.thenLabel !== undefined) thenEntry.label = node.thenLabel;
  branches.push(thenEntry);

  for (const elseif of node.elseIfBranches) {
    const elseifTiles = tileNodes(elseif.body, bounder, theme);
    const entry: { tile: Tile; label?: string } = { tile: new GtileTopDown(elseifTiles, bounder, theme) };
    if (elseif.label !== undefined) entry.label = elseif.label;
    branches.push(entry);
  }

  const elseTiles = tileNodes(node.elseBranch, bounder, theme);
  const elseEntry: { tile: Tile; label?: string } = { tile: new GtileTopDown(elseTiles, bounder, theme) };
  if (node.elseLabel !== undefined) elseEntry.label = node.elseLabel;
  branches.push(elseEntry);

  return new GtileIf(diamond, branches, null, bounder, theme);
}

export function buildIf(node: ActivityIf, bounder: StringBounder, theme: Theme): Tile {
  const dispatch = ifBuilderOf(node);
  if (dispatch.builder === 'with-links') return buildIfWithLinks(node, bounder, theme);
  return buildLegacyIf(node, bounder, theme);
}
