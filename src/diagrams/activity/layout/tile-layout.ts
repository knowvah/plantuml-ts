import type {
  ActivityDiagramAST,
  ActivityNode,
  ActivityIf,
  ActivityWhile,
  ActivityRepeat,
  ActivityFork,
  ActivitySplit,
  ActivitySwitch,
  ActivityGroup,
} from '../ast.js';
import type { StringMeasurer } from '../../../core/measurer.js';
import type { Theme } from '../../../core/theme.js';
import type { StringBounder, Tile } from '../tiles/tile.js';
import { GtileStart } from '../tiles/gtile-start.js';
import { GtileStop } from '../tiles/gtile-stop.js';
import { GtileEnd } from '../tiles/gtile-end.js';
import { GtileKill } from '../tiles/gtile-kill.js';
import { GtileBreak } from '../tiles/gtile-break.js';
import { GtileAction } from '../tiles/gtile-action.js';
import { GtileNote } from '../tiles/gtile-note.js';
import { GtileDiamond } from '../tiles/gtile-diamond.js';
import { GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import { GtileWhile } from '../tiles/gtile-while.js';
import { GtileRepeat } from '../tiles/gtile-repeat.js';
import { GtileRepeatEntry } from '../tiles/gtile-repeat-entry.js';
import { GtileFork } from '../tiles/gtile-fork.js';
import { GtileSplit } from '../tiles/gtile-split.js';
import { GtileSwitch } from '../tiles/gtile-switch.js';
import { GtileGroup } from '../tiles/gtile-group.js';
import { GtilePartition } from '../tiles/gtile-partition.js';
import { GtileTopDown } from '../tiles/gtile-top-down.js';
import { assignCoordinates, LAYOUT_MARGIN } from './tile-coordinates.js';
import { buildIf, isMainLaneSmallerThanAllOthers } from './conditional-builder.js';
import type { RepeatBackConnection } from '../tiles/gtile-repeat.js';

// Re-export geometry types so renderer and index can import from one place.
export type { ActivityGeometry, ActivityNodeGeo, ActivityEdgeGeo, SwimlaneGeo } from '../activity-geometry.types.js';

function makeBounder(measurer: StringMeasurer, theme: Theme): StringBounder {
  return {
    getDimension(text: string, fontSizePt: number) {
      return measurer.measure(text, { family: theme.fontFamily, size: fontSizePt });
    },
  };
}

/**
 * Threads `ActivityNode.swimlane` (`ast.ts`) onto the tile built for it
 * (asr-T3). See `Tile.swimlane` (`tiles/tile.ts`) for the upstream
 * citation. Constrained on a writable-`swimlane` structural type, not on
 * `Tile` itself, because `Tile.swimlane` is `readonly` to consumers
 * (T4/T5) — every concrete `Gtile*` still satisfies both, since a mutable
 * class field structurally satisfies a `readonly` interface member.
 */
function withSwimlane<T extends { swimlane?: string | undefined }>(tile: T, swimlane: string | undefined): T {
  tile.swimlane = swimlane;
  return tile;
}

/** Mirrors {@link withSwimlane} for a tile's exit lane (T5, D1). */
function withSwimlaneOut<T extends { swimlaneOut?: string | undefined }>(tile: T, swimlaneOut: string | undefined): T {
  tile.swimlaneOut = swimlaneOut;
  return tile;
}

/**
 * A compound's OUT lane, falling back to its opener when it never set one
 * (mission `activity-lane-capture` D1: repeat is the only kind this file
 * builds an out-lane-aware child from so far).
 */
function outLane(swimlaneOut: string | undefined, swimlane: string | undefined): string | undefined {
  return swimlaneOut ?? swimlane;
}

export function tileNodes(
  nodes: ActivityNode[],
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[] = [],
): Tile[] {
  const tiles: Tile[] = [];
  for (const node of nodes) {
    const t = tileNode(node, bounder, theme, laneOrder);
    if (t !== null) tiles.push(t);
  }
  return tiles;
}

/**
 * Dispatches to `conditional-builder.ts#buildIf` (mission
 * `activity-if-tile-port` D1): `'with-links'` builds `GtileIfWithLinks`,
 * `'down'` builds `GtileIfDown`, `'long-horizontal'` builds
 * `GtileIfLongHorizontal` (T5, the last of the three -- the legacy
 * single-diamond tile is retired). `laneOrder` (`ast.swimlanes`, this
 * diagram's real declaration order) is threaded down for `down`'s own
 * `ConnectionElse1` vs `Else2` selection (`Swimlane#isSmallerThanAllOthers`,
 * `Swimlane.java:130-137`) -- see `conditional-builder.ts`'s own doc.
 */
function tileIf(node: ActivityIf, bounder: StringBounder, theme: Theme, laneOrder: readonly string[]): Tile {
  return withSwimlane(buildIf(node, bounder, theme, laneOrder), node.swimlane);
}

/**
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:125-127
 *   -- `.withNorth(yesTb).withWest(outTb)`: the "is"/entry label sits north,
 *   the "is not"/exit label sits west.
 */
function tileWhile(
  node: ActivityWhile,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
): GtileWhile {
  const labels: { north?: string; west?: string } = {};
  if (node.yesLabel !== undefined) labels.north = node.yesLabel;
  if (node.exitLabel !== undefined) labels.west = node.exitLabel;
  const header = new GtileDiamondInside(node.condition, labels, bounder, theme);
  const bodyTiles = tileNodes(node.body, bounder, theme, laneOrder);
  const body = new GtileTopDown(bodyTiles, bounder, theme);
  return withSwimlane(new GtileWhile(header, body, bounder, theme), node.swimlane);
}

/**
 * `swimlaneOut` on the repeat tile feeds `laneOut` for any sequential
 * sibling that follows it (`tile-coordinates.ts`'s `gtile-top-down` case).
 * The condition diamond's own lane is `swimlaneOut ?? swimlane`
 * (`FtileRepeat.java:149,152` -- `diamond2`'s INSIDE_HEXAGON branch). This
 * port models only the hexagon condition style: no `conditionStyle`/
 * `ConditionStyle` name appears anywhere under `src/diagrams/activity`, and
 * `ConditionStyle.fromString` defaults to `INSIDE_HEXAGON` when no style is
 * configured (`ConditionStyle.java:43,56`), so the EMPTY_DIAMOND/
 * INSIDE_DIAMOND styles -- which read `swimlane` instead -- are out of
 * scope, not a divergence.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:101-106
 *   -- `getSwimlaneIn`/`getSwimlaneOut`, the outer tile's own pair.
 */

/**
 * `entry`'s own tile: the inline `repeat :label;` action when present, else
 * a label-less entry diamond in the repeat's OPENER lane (D2). `tileNode`
 * never returns `null` for an `'action'` node (only `'arrow-label'` does,
 * `tileNode`'s own switch) -- the assertion documents that invariant rather
 * than re-checking it.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:77-80
 *   -- `if (entry == null) diamond1 = new FtileDiamond(skinParam,
 *   diamondColor1, borderColor, swimlane); else diamond1 = entry;`.
 */
function tileRepeatEntry(
  node: ActivityRepeat,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
): Tile {
  if (node.entry !== undefined) return tileNode(node.entry, bounder, theme, laneOrder)!;
  return withSwimlane(new GtileRepeatEntry(), node.swimlane);
}

/**
 * `FtileRepeat.create`'s back-connection selection (`FtileRepeat.java:
 * 186-199`, `backward == null`, D5): `swimlane == null || swimlane ==
 * swimlaneOut` picks `'simple1'` when the repeat's own lane sorts before
 * every lane its BODY touches (`Swimlane#isSmallerThanAllOthers`,
 * `Swimlane.java:130-137`, shared here as `isMainLaneSmallerThanAllOthers`
 * -- see that function's own doc for why `node.body` there is exactly
 * `repeat.getSwimlanes()` here), else `'simple2'`; a repeat that opens in
 * one lane and closes (`repeat while`) in another always takes
 * `'complex1'`.
 */
function selectRepeatBackConnection(node: ActivityRepeat, laneOrder: readonly string[]): RepeatBackConnection {
  const { swimlane, swimlaneOut } = node;
  if (swimlane === undefined || swimlane === swimlaneOut) {
    return isMainLaneSmallerThanAllOthers(swimlane, node.body, laneOrder) ? 'simple1' : 'simple2';
  }
  return 'complex1';
}

/**
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:150-151
 *   -- `.withEast(yesTb).withSouth(outTb)`: the default (no `backward`,
 *   D1) branch puts the "is"/entry label east, the "not"/exit label south.
 */
function tileRepeat(
  node: ActivityRepeat,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
): GtileRepeat {
  const entry = tileRepeatEntry(node, bounder, theme, laneOrder);
  const bodyTiles = tileNodes(node.body, bounder, theme, laneOrder);
  const body = new GtileTopDown(bodyTiles, bounder, theme);
  const labels: { east?: string; south?: string } = {};
  if (node.yesLabel !== undefined) labels.east = node.yesLabel;
  if (node.outLabel !== undefined) labels.south = node.outLabel;
  const condition = withSwimlane(
    new GtileDiamondInside(node.condition, labels, bounder, theme),
    outLane(node.swimlaneOut, node.swimlane),
  );
  const backConnection = selectRepeatBackConnection(node, laneOrder);
  return withSwimlaneOut(
    withSwimlane(new GtileRepeat(entry, body, condition, backConnection, { bounder, theme }), node.swimlane),
    node.swimlaneOut,
  );
}

function tileFork(node: ActivityFork, bounder: StringBounder, theme: Theme, laneOrder: readonly string[]): GtileFork {
  const branches = node.branches.map((b) => {
    const tiles = tileNodes(b, bounder, theme, laneOrder);
    return new GtileTopDown(tiles, bounder, theme);
  });
  return withSwimlaneOut(withSwimlane(new GtileFork(branches, bounder), node.swimlane), node.swimlaneOut);
}

function tileSplit(
  node: ActivitySplit,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
): GtileSplit {
  const branches = node.branches.map((b) => {
    const tiles = tileNodes(b, bounder, theme, laneOrder);
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
function tileSwitch(
  node: ActivitySwitch,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
): GtileSwitch {
  const diamond = new GtileDiamond(node.condition, bounder, theme);
  const cases = node.cases.map((kase) => {
    const tile = new GtileTopDown(tileNodes(kase.body, bounder, theme, laneOrder), bounder, theme);
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
function tileGroup(node: ActivityGroup, bounder: StringBounder, theme: Theme, laneOrder: readonly string[]): Tile {
  const body = new GtileTopDown(tileNodes(node.body, bounder, theme, laneOrder), bounder, theme);
  const tile =
    node.groupType === 'group'
      ? new GtileGroup(node.title, body, bounder, theme)
      : new GtilePartition(node.title, body, bounder, theme);
  return withSwimlane(tile, node.swimlane);
}

export function layoutActivity(ast: ActivityDiagramAST, theme: Theme, measurer: StringMeasurer) {
  if (ast.nodes.length === 0) {
    return { totalWidth: 0, totalHeight: 0, nodes: [], edges: [], swimlanes: [] };
  }

  const bounder = makeBounder(measurer, theme);
  const tiles = tileNodes(ast.nodes, bounder, theme, ast.swimlanes);
  const root = new GtileTopDown(tiles, bounder, theme);
  return assignCoordinates(root, ast, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);
}

type SimpleLeafKind = 'start' | 'stop' | 'end' | 'kill' | 'detach' | 'break' | 'action' | 'note';

const SIMPLE_LEAF_KINDS: ReadonlySet<string> = new Set<SimpleLeafKind>([
  'start',
  'stop',
  'end',
  'kill',
  'detach',
  'break',
  'action',
  'note',
]);

/** User-defined type guard (not a bare `Set.has`) so both `tileNode`
 *  branches narrow: the `if` arm to {@link SimpleLeafKind}, and -- just as
 *  important -- the switch below it to the COMPLEMENT, which is what lets
 *  that switch's `default: const _exhaustive: never = node` still
 *  type-check. */
function isSimpleLeaf(node: ActivityNode): node is Extract<ActivityNode, { kind: SimpleLeafKind }> {
  return SIMPLE_LEAF_KINDS.has(node.kind);
}

/**
 * Every leaf tile with no nested body and no `null` result: `start`/
 * `stop`/`end`/`kill`/`detach`/`break` (no bounder/theme needed) plus
 * `action`/`note` (need both). Extracted from `tileNode` (mission
 * ubrr-T10) to keep ITS OWN switch under the complexity hook's cap once
 * `backward` (M3) became a 15th case there -- placed ABOVE `tileNode` per
 * that function's own "add new builders above" doc.
 */
function tileSimpleLeaf(
  node: Extract<ActivityNode, { kind: SimpleLeafKind }>,
  bounder: StringBounder,
  theme: Theme,
): Tile {
  switch (node.kind) {
    case 'start':
      return withSwimlane(new GtileStart(), node.swimlane);
    case 'stop':
      return withSwimlane(new GtileStop(), node.swimlane);
    case 'end':
      return withSwimlane(new GtileEnd(), node.swimlane);
    case 'kill':
      return withSwimlane(new GtileKill(), node.swimlane);
    case 'detach':
      return withSwimlane(new GtileStop(), node.swimlane);
    case 'break':
      return withSwimlane(new GtileBreak(), node.swimlane);
    case 'action':
      return withSwimlane(new GtileAction(node, bounder, theme), node.swimlane);
    case 'note':
      return withSwimlane(new GtileNote(node, bounder, theme), node.swimlane);
  }
}

/**
 * Kept LAST in this file on purpose (mission `activity-loop-tile-port`,
 * T1): Lizard 1.23.0's TypeScript reader loses this function's closing
 * scope inside the `switch` (the same `identifier(` heuristic bug
 * `node-dispatch.ts`'s header describes) and reports everything after it
 * as part of `tileNode`, so any function placed below it inflates the
 * complexity hook's ratchet for this name. Add new builders above.
 */
function tileNode(node: ActivityNode, bounder: StringBounder, theme: Theme, laneOrder: readonly string[]): Tile | null {
  if (isSimpleLeaf(node)) {
    return tileSimpleLeaf(node, bounder, theme);
  }
  switch (node.kind) {
    // `backward` (mission ubrr-T10 M3, `ActivityBackward`'s own doc,
    // ast.ts): base-form-only port, geometry filed as `activity-loop-backward`.
    case 'arrow-label':
    case 'backward':
      return null;
    case 'if':
      return tileIf(node, bounder, theme, laneOrder);
    case 'while':
      return tileWhile(node, bounder, theme, laneOrder);
    case 'repeat':
      return tileRepeat(node, bounder, theme, laneOrder);
    case 'fork':
      return tileFork(node, bounder, theme, laneOrder);
    case 'split':
      return tileSplit(node, bounder, theme, laneOrder);
    case 'switch':
      return tileSwitch(node, bounder, theme, laneOrder);
    case 'group':
      return tileGroup(node, bounder, theme, laneOrder);
    default: {
      const _exhaustive: never = node;
      console.warn(`tile-layout: unknown node kind '${String((_exhaustive as ActivityNode).kind)}'`);
      return null;
    }
  }
}
