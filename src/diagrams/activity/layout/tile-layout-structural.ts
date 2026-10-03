/**
 * `tileFork`/`tileSplit`/`tileSwitch`/`tileGroup` -- split out of
 * `tile-layout.ts` (D12/T1p-b) purely to keep that file under the
 * project's 500-line cap (threading a `pragma` parameter through every
 * `tileX` builder, mirroring `laneOrder`'s own existing convention,
 * pushed it over). Pure mechanical move: no behavior change, same doc
 * comments, same call sites (now imported).
 */

import type { ActivityFork, ActivityGroup, ActivitySplit, ActivitySwitch } from '../ast.js';
import type { StringBounder, Tile } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import type { Pragma } from '../../../core/skin/Pragma.js';
import { GtileDiamond } from '../tiles/gtile-diamond.js';
import { GtileFork } from '../tiles/gtile-fork.js';
import { GtileMerge } from '../tiles/gtile-merge.js';
import { GtileSplit } from '../tiles/gtile-split.js';
import { GtileSwitch } from '../tiles/gtile-switch.js';
import { GtileGroup } from '../tiles/gtile-group.js';
import { GtilePartition } from '../tiles/gtile-partition.js';
import { GtileTopDown } from '../tiles/gtile-top-down.js';
import { tileNodes, withSwimlane, withSwimlaneOut } from './tile-layout.js';

/**
 * D12/T1p-c: `node.style === 'merge'` (`fork ... end merge`) builds a
 * `GtileMerge` instead -- same branch tiling, different join shape
 * (`gtile-merge.ts`'s own doc). `withSwimlane`/`withSwimlaneOut` reuse the
 * AST's captured fields for both styles (`walk-fork-branches.ts
 * #pushMergeDiamondNode`'s own doc covers the one divergence this elides).
 */
export function tileFork(
  node: ActivityFork,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
  pragma: Pragma,
): GtileFork {
  const branches = node.branches.map((b) => {
    const tiles = tileNodes(b, bounder, theme, laneOrder, pragma);
    return new GtileTopDown(tiles, bounder, theme);
  });
  const built = node.style === 'merge' ? new GtileMerge(branches, bounder) : new GtileFork(branches, bounder);
  return withSwimlaneOut(withSwimlane(built, node.swimlane), node.swimlaneOut);
}

export function tileSplit(
  node: ActivitySplit,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
  pragma: Pragma,
): GtileSplit {
  const branches = node.branches.map((b) => {
    const tiles = tileNodes(b, bounder, theme, laneOrder, pragma);
    return new GtileTopDown(tiles, bounder, theme);
  });
  return withSwimlaneOut(withSwimlane(new GtileSplit(branches, bounder), node.swimlane), node.swimlaneOut);
}

/**
 * Builds a {@link GtileSwitch} from an `ActivitySwitch` node (mission
 * ubrr-T10 M2). DIVERGENCE, documented: upstream's real switch shape is
 * `GtileIfHexagon` (`activitydiagram3/gtile/GtileIfHexagon.java`) -- a
 * hexagon opener with 1/2-branch-only side labels and N-branch-dependent
 * connection routing, a materially different (and materially larger)
 * class than anything else in `tiles/`. This reuses the already-ported,
 * already-tested `GtileSwitch` (a plain diamond opener/closer, case
 * labels drawn as ordinary edge text) instead: same topology (opener ->
 * N cases -> merge), same landing engine (D3), different diamond/hexagon
 * shape and label placement. The merge diamond is unconditional, matching
 * `GtileIfHexagon`'s own `shape2` (always built and drawn, independent of
 * whether any case continues).
 */
export function tileSwitch(
  node: ActivitySwitch,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
  pragma: Pragma,
): GtileSwitch {
  const diamond = new GtileDiamond(node.condition, bounder, theme);
  const cases = node.cases.map((kase) => {
    const tile = new GtileTopDown(tileNodes(kase.body, bounder, theme, laneOrder, pragma), bounder, theme);
    return kase.label !== undefined ? { tile, label: kase.label } : { tile };
  });
  const mergeDiamond = new GtileDiamond('', bounder, theme);
  return withSwimlane(new GtileSwitch(diamond, cases, mergeDiamond, bounder, theme), node.swimlane);
}

/**
 * Builds a {@link GtileGroup}/{@link GtilePartition} from an
 * `ActivityGroup` node (mission ubrr-T10 M6). `groupType === 'group'`
 * builds `GtileGroup`; the other four (`partition`/`package`/`rectangle`/
 * `card`) all build `GtilePartition` -- upstream draws a DIFFERENT
 * `USymbol` per type (`CommandPartition3#getUSymbol`), but this port has
 * only the two tile classes (`gtile-group.ts`/`gtile-partition.ts`,
 * identical geometry, `kind` differs), so `package`/`rectangle`/`card`
 * collapse onto `GtilePartition`'s shape -- a documented divergence, not
 * a silent one. The bracket-less-form warning banner (`CommandPartition3`
 * `hasBracket == false` -> `addWarning(...)`, `CommandCloseGroupLegacy3`
 * likewise) is NOT rendered -- `ActivityGroup.hasBracket` is carried on
 * the AST for a future task, unread here.
 */
export function tileGroup(
  node: ActivityGroup,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
  pragma: Pragma,
): Tile {
  const body = new GtileTopDown(tileNodes(node.body, bounder, theme, laneOrder, pragma), bounder, theme);
  const tile =
    node.groupType === 'group'
      ? new GtileGroup(node.title, body, bounder, theme)
      : new GtilePartition(node.title, body, bounder, theme);
  return withSwimlane(tile, node.swimlane);
}
