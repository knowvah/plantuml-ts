import type {
  ActivityDiagramAST,
  ActivityNode,
  ActivityIf,
  ActivityWhile,
  ActivityRepeat,
  ActivityFork,
  ActivitySplit,
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
import { GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import { GtileWhile } from '../tiles/gtile-while.js';
import { GtileRepeat } from '../tiles/gtile-repeat.js';
import { GtileRepeatEntry } from '../tiles/gtile-repeat-entry.js';
import { GtileFork } from '../tiles/gtile-fork.js';
import { GtileSplit } from '../tiles/gtile-split.js';
import { GtileTopDown } from '../tiles/gtile-top-down.js';
import { assignCoordinates, LAYOUT_MARGIN } from './tile-coordinates.js';
import { buildIf } from './conditional-builder.js';

// Re-export geometry types so renderer and index can import from one place.
export type { ActivityGeometry, ActivityNodeGeo, ActivityEdgeGeo, SwimlaneGeo } from '../layout.old.js';

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
  return withSwimlaneOut(
    withSwimlane(new GtileRepeat(entry, body, condition, bounder, theme), node.swimlane),
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

export function layoutActivity(ast: ActivityDiagramAST, theme: Theme, measurer: StringMeasurer) {
  if (ast.nodes.length === 0) {
    return { totalWidth: 0, totalHeight: 0, nodes: [], edges: [], swimlanes: [] };
  }

  const bounder = makeBounder(measurer, theme);
  const tiles = tileNodes(ast.nodes, bounder, theme, ast.swimlanes);
  const root = new GtileTopDown(tiles, bounder, theme);
  return assignCoordinates(root, ast, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);
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
    case 'arrow-label':
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
    default: {
      const _exhaustive: never = node;
      console.warn(`tile-layout: unknown node kind '${String((_exhaustive as ActivityNode).kind)}'`);
      return null;
    }
  }
}
