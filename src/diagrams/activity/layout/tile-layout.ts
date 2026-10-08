import type {
  ActivityDiagramAST,
  ActivityNode,
  ActivityAction,
  ActivityBackward,
  ActivityIf,
  ActivityWhile,
  ActivityRepeat,
} from '../ast.js';
import { CreoleMode } from '../../../core/klimt/creole/CreoleMode.js';
import type { StringMeasurer } from '../../../core/measurer.js';
import type { Theme } from '../../../core/theme.js';
import { Pragma } from '../../../core/skin/Pragma.js';
import type { StringBounder, Tile } from '../tiles/tile.js';
import { GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import type { DiamondConditionTile } from '../tiles/gtile-diamond-inside.js';
import { GtileDiamondSquare } from '../tiles/gtile-diamond-square.js';
import { GtileDiamondEmpty } from '../tiles/gtile-diamond-empty.js';
import { GtileWhile } from '../tiles/gtile-while.js';
import { GtileRepeat, RepeatConditionEmpty } from '../tiles/gtile-repeat.js';
import type { RepeatConditionTile } from '../tiles/gtile-repeat.js';
import { GtileRepeatEntry } from '../tiles/gtile-repeat-entry.js';
import { GtileTopDown } from '../tiles/gtile-top-down.js';
import { assignCoordinates } from './tile-coordinates.js';
import { buildIf, isMainLaneSmallerThanAllOthers } from './conditional-builder.js';
import type { RepeatBackConnection } from '../tiles/gtile-repeat.js';
import { extractBackward, selectRepeatConditionLabels, withBackLabels } from './tile-layout-backward.js';
import { tileFork, tileGroup, tileSplit, tileSwitch, tileNote, wrapWhileNotes } from './tile-layout-structural.js';
import { consumeArrowLabel, withInLabel } from './tile-layout-inlabel.js';
import type { PendingInLabel } from './tile-layout-inlabel.js';
import { isEarlyLeafKind, isSimpleLeaf, tileEarlyLeaf, tileSimpleLeaf } from './tile-layout-leaves.js';

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
export function withSwimlane<T extends { swimlane?: string | undefined }>(tile: T, swimlane: string | undefined): T {
  tile.swimlane = swimlane;
  return tile;
}

/** Mirrors {@link withSwimlane} for a tile's exit lane (T5, D1). */
export function withSwimlaneOut<T extends { swimlaneOut?: string | undefined }>(
  tile: T,
  swimlaneOut: string | undefined,
): T {
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

/**
 * Mirrors `FtileKilled` wrapping `InstructionSimple`'s own tile (mission
 * `activity-divergence-drive` T2b): mutated IN PLACE, same pattern as
 * {@link withSwimlane}/{@link withSwimlaneOut} above -- `tile`'s `kind`,
 * geometry and every per-kind field the walker reads are untouched; only
 * its out point is stripped. `FtileKilled.drawU` draws nothing of its
 * own (`ug.draw(tile)`, the wrapped tile verbatim) and its dimension
 * constructor drops `outY` (the 3-arg `FtileGeometry` ctor), so `kill`/
 * `detach` must never contribute a separate drawn shape -- only mark the
 * PRECEDING tile.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileKilled.java:44-74
 *   -- the whole class: `getMyChildren`/`drawU` delegate to the wrapped
 *   tile verbatim; `calculateDimensionFtile` rebuilds the geometry via
 *   the 3-arg `FtileGeometry(dim, left, inY)` ctor, which carries no
 *   `outY`.
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionSimple.java:111-116,123-127
 *   -- `kill()` just sets `this.killed = true`; `createFtile` wraps in
 *   `FtileKilled` only when that flag is set.
 */
function withKilled<T extends Tile>(tile: T): T {
  tile.hasPointOut = () => false;
  return tile;
}

/**
 * `kill`/`detach` (`CommandKill3.java:52-56` -- one regex, `kill|detach`,
 * both call `diagram.kill()`) never add an `Instruction`/tile of their
 * own: `InstructionList.kill()` mutates `getLast()` and returns a
 * boolean; `all.add(...)` is never called for the keyword itself. This
 * loop is the TS equivalent of that mutation -- `kill`/`detach` nodes
 * are intercepted here, BEFORE `tileNode`, and never produce a tile;
 * they instead mark the tile already pushed for the PRECEDING sibling
 * (`withKilled`). A `kill`/`detach` with nothing preceding mirrors
 * `InstructionList.java:170-171`'s `if (all.size() == 0) return false`
 * (`current().kill()` then returns the "kill cannot be used here" parse
 * error, `ActivityDiagram3.java:415-416`) -- out of scope here (D8, an
 * `error` row), so it is a silent no-op rather than a thrown error.
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionList.java:169-174
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionSimple.java:123-127
 */
/**
 * T1d: {@link tileNodes}'s own return shape -- `tiles` is the SAME
 * `Tile[]` every pre-T1d caller used positionally; `trailing` is the
 * leftover `pendingInLabel` still unconsumed when the loop ran out of
 * nodes (a `-> label;` that was the LAST thing in this body, with
 * nothing after it to attach to) -- `Branch#special`/`InstructionList
 * #outlinkRendering`'s own pending value, surfaced to the caller instead
 * of silently falling out of scope (`tiles/tile.ts#Tile.outLabel`'s own
 * doc names the two upstream fields this maps to per compound kind).
 */
export interface TileNodesResult {
  readonly tiles: Tile[];
  readonly trailing: PendingInLabel | undefined;
}

export function tileNodes(
  nodes: ActivityNode[],
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[] = [],
  pragma: Pragma = Pragma.createEmpty(),
): TileNodesResult {
  const tiles: Tile[] = [];
  // T1b pass 2: `nextLinkRenderer()`'s pending state
  // (`ActivityDiagram3.java:105-106`) -- set by an `arrow-label` node,
  // consumed by (and reset at) the next tile-producing node, exactly as
  // `withInLabel`'s own doc describes.
  let pendingInLabel: ReturnType<typeof consumeArrowLabel> | undefined;
  for (const node of nodes) {
    if (node.kind === 'arrow-label') {
      pendingInLabel = consumeArrowLabel(node);
      continue;
    }
    if (node.kind === 'kill' || node.kind === 'detach') {
      const last = tiles[tiles.length - 1];
      if (last !== undefined) withKilled(last);
      continue;
    }
    if (node.kind === 'note') {
      tileNote(tiles, node, bounder, theme);
      continue;
    }
    const t = tileNode(node, bounder, theme, laneOrder, pragma);
    if (t !== null) {
      withInLabel(t, pendingInLabel);
      pendingInLabel = undefined;
      tiles.push(t);
    }
  }
  return { tiles, trailing: pendingInLabel };
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
function tileIf(
  node: ActivityIf,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
  pragma: Pragma,
): Tile {
  return withSwimlane(buildIf(node, bounder, theme, laneOrder, pragma), node.swimlane);
}

/**
 * `backward`'s own tile: built through the SAME action-tile path an
 * `:action;` body step uses (`tileSimpleLeaf`'s own `'action'` case) --
 * `InstructionRepeat.java:182`/`InstructionWhile.java:121-122` both
 * resolve `backward` via `factory.activity(backward, swimlane, boxStyle,
 * ...)`, the identical `FtileFactory#activity` call site every ordinary
 * action resolves to, `boxStyle` included (`CommandBackward3.java:138`).
 * Kept here (not in `tile-layout-backward.ts` with {@link extractBackward}/
 * {@link backwardExitsOnLeft}) since it needs `tileSimpleLeaf`, private to
 * this file.
 */
function tileBackwardActivity(node: ActivityBackward, bounder: StringBounder, theme: Theme): Tile {
  const action: ActivityAction = {
    kind: 'action',
    label: node.label,
    ...(node.swimlane !== undefined ? { swimlane: node.swimlane } : {}),
    ...(node.stereotype !== undefined ? { stereotype: node.stereotype } : {}),
  };
  const tile = tileSimpleLeaf(action, bounder, theme);
  if (node.notes === undefined || node.notes.length === 0) return tile;
  // BACKNOTE (`activity-divergence-drive-3` T2a): `getFtileBackward`'s own
  // `factory.addNote(result, swimlaneBackward, backwardNotes, CENTER)`
  // (`InstructionRepeat.java:177-185`) is the SAME `FtileWithNoteOpale`
  // wrap `tileNote` already builds for a simple leaf -- reused verbatim
  // rather than re-implemented. Only the FIRST note wraps (`tileNote`'s
  // own `tiles[0]` slot); any further note would float as a SEPARATE
  // sibling `tileNote` cannot place (this slot takes exactly one `Tile`,
  // unlike a flowing body list) -- unexercised by this family's own
  // cohort (every row has exactly one), re-slotted to NOTE-MULTI if one
  // ever does.
  const tiles: Tile[] = [tile];
  for (const note of node.notes) tileNote(tiles, note, bounder, theme);
  return tiles[0]!;
}

/**
 * `FtileWhile.create`'s own 3-way `conditionStyle` dispatch for the while
 * header (`vcompact/FtileWhile.java:131-139`): `INSIDE_HEXAGON` (default)
 * and `INSIDE_DIAMOND` both route `{north: yesLabel, west: exitLabel}`
 * through `.withNorth(yesTb).withWest(outTb)`, differing only in shape
 * class (`:132-136`). `EMPTY_DIAMOND` (CONDSTYLE-EMPTY, `add3-T3a`) is a
 * genuinely different label layout, not just a different polygon: the
 * condition text itself moves to NORTH (`.withNorth(testTb)`, always at
 * the `styleDiamond`/`fcTest` font bucket -- `GtileDiamondEmpty`'s own
 * `testLabel` param) and yes/exit demote to south/west (`:137-139`).
 */
function buildWhileHeader(
  node: ActivityWhile,
  labels: { north?: string; west?: string },
  bounder: StringBounder,
  theme: Theme,
): DiamondConditionTile {
  if (theme.conditionStyle === 'emptyDiamond') {
    const emptyLabels: { south?: string; west?: string } = {};
    if (node.yesLabel !== undefined) emptyLabels.south = node.yesLabel;
    if (node.exitLabel !== undefined) emptyLabels.west = node.exitLabel;
    return new GtileDiamondEmpty(node.condition, emptyLabels, bounder, theme, CreoleMode.FULL);
  }
  if (theme.conditionStyle === 'insideDiamond')
    return new GtileDiamondSquare(node.condition, labels, bounder, theme, CreoleMode.FULL);
  return new GtileDiamondInside(node.condition, labels, bounder, theme, CreoleMode.FULL);
}

function tileWhile(
  node: ActivityWhile,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
  pragma: Pragma,
): GtileWhile {
  const labels: { north?: string; west?: string } = {};
  if (node.yesLabel !== undefined) labels.north = node.yesLabel;
  if (node.exitLabel !== undefined) labels.west = node.exitLabel;
  const header = buildWhileHeader(node, labels, bounder, theme);
  const { rest, backward } = extractBackward(node.body);
  const bodyTiles = tileNodes(rest, bounder, theme, laneOrder, pragma).tiles;
  const body = new GtileTopDown(bodyTiles, bounder, theme);
  const backwardTile = backward !== undefined ? tileBackwardActivity(backward, bounder, theme) : undefined;
  const specialOutTile = node.specialOut !== undefined ? tileSimpleLeaf(node.specialOut, bounder, theme) : undefined;
  const ctx = withBackLabels({ bounder, theme, backward: backwardTile, specialOut: specialOutTile }, backward);
  return withSwimlane(new GtileWhile(header, body, ctx), node.swimlane);
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
  pragma: Pragma,
): Tile {
  if (node.entry !== undefined) return tileNode(node.entry, bounder, theme, laneOrder, pragma)!;
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
 * `FtileRepeat.create`'s diamond2 slot (`:143-154`): a real condition
 * hexagon, or {@link RepeatConditionEmpty} when this repeat has no test
 * AND is the last instruction of its own parent list (`noOut &&
 * Display.isNull(test)`, `:143-144`) -- `node.noOut` is set by
 * `node-dispatch.ts#parseNodes` (D-new, family RNOOUT), `Display.isNull`
 * is this port's empty-string `condition`.
 */
function tileRepeatCondition(
  node: ActivityRepeat,
  labels: { east?: string; west?: string; south?: string },
  bounder: StringBounder,
  theme: Theme,
): RepeatConditionTile {
  if (node.noOut === true && node.condition === '') return new RepeatConditionEmpty();
  // CONDSTYLE-EMPTY (add3 T3a): `FtileRepeat.java:156-159` --
  // `.withEast(tbTest)` ONLY (no yes/out label at all, a preserved
  // upstream quirk: `yesTb`/`outTb` are built at `:130-131` but never
  // attached on this branch); `tbTest` itself is ARROW-bucket here
  // (`fontConfiguration1 = fcArrow`, `:124-125`, the non-INSIDE_HEXAGON
  // case), so it goes through `labels.east`, not `GtileDiamondEmpty`'s
  // own diamond-bucket `testLabel` param (`''` here, matching `tileWhile`'s
  // own EMPTY_DIAMOND call never leaving `testLabel` unset the way this
  // one always does).
  if (theme.conditionStyle === 'emptyDiamond')
    return new GtileDiamondEmpty('', { east: node.condition }, bounder, theme, CreoleMode.FULL);
  // CSTYLE (add2 T3i): FtileRepeat.java:159-161.
  if (theme.conditionStyle === 'insideDiamond')
    return new GtileDiamondSquare(node.condition, labels, bounder, theme, CreoleMode.FULL);
  return new GtileDiamondInside(node.condition, labels, bounder, theme, CreoleMode.FULL);
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
  pragma: Pragma,
): GtileRepeat {
  const entry = tileRepeatEntry(node, bounder, theme, laneOrder, pragma);
  const { rest, backward } = extractBackward(node.body);
  const bodyTiles = tileNodes(rest, bounder, theme, laneOrder, pragma).tiles;
  const body = new GtileTopDown(bodyTiles, bounder, theme);
  const backwardTile = backward !== undefined ? tileBackwardActivity(backward, bounder, theme) : undefined;
  const labels = selectRepeatConditionLabels(theme.conditionStyle, node, backward, laneOrder);
  const condition = withSwimlane(
    tileRepeatCondition(node, labels, bounder, theme),
    outLane(node.swimlaneOut, node.swimlane),
  );
  const backConnection = selectRepeatBackConnection(node, laneOrder);
  const backLabels = withBackLabels({ bounder, theme, backward: backwardTile }, backward);
  const repeat = new GtileRepeat(entry, body, condition, backConnection, backLabels);
  return withSwimlaneOut(withSwimlane(repeat, node.swimlane), node.swimlaneOut);
}

// `tileFork`/`tileSplit`/`tileSwitch`/`tileGroup` moved to
// `tile-layout-structural.ts` (D12/T1p-b) to keep this file under the
// 500-line cap -- see that file's own doc comment.

export function layoutActivity(ast: ActivityDiagramAST, skinTheme: Theme, measurer: StringMeasurer) {
  // unwind2-S11: every text block reads the diagram's own `sprite` map
  // through its skin param (`StripeSimple.java:229`), `Theme#sprites` here.
  const theme = ast.sprites === undefined ? skinTheme : { ...skinTheme, sprites: ast.sprites };
  if (ast.nodes.length === 0) {
    return { totalWidth: 0, totalHeight: 0, nodes: [], edges: [], swimlanes: [] };
  }

  const bounder = makeBounder(measurer, theme);
  // D12/T1p-b: `ast.pragma` mirrors `TitledDiagram#getPragma()` -- the
  // single per-diagram `Pragma` a real `parseActivity()` call always sets;
  // defaulted here only for hand-built AST literal fixtures (`ast.ts`'s
  // own doc comment on the field).
  const pragma = ast.pragma ?? Pragma.createEmpty();
  const tiles = tileNodes(ast.nodes, bounder, theme, ast.swimlanes, pragma).tiles;
  const root = new GtileTopDown(tiles, bounder, theme);
  // D2 (`plans/activity-divergence-drive/decisions.md`): the root Ftile's
  // own local coordinates start at the true origin -- upstream never bakes
  // a margin into the Ftile tree itself (`InstructionList#createFtile`
  // returns the bare root tile, no wrapping translate). The canvas's own
  // origin/size is derived AFTER layout, dynamically, from the placed
  // geometry's own ink extent (`assign-coordinates-full.ts
  // #computeCanvasOrigin`) -- never a flat baseX/baseY constant.
  const geo = assignCoordinates(root, ast, { x: 0, y: 0 }, bounder, theme);
  return ast.sprites === undefined ? geo : { ...geo, sprites: ast.sprites };
}

/** `tileNode`'s exhaustive default: an unknown kind draws nothing. */
function unknownNodeKind(node: never): null {
  console.warn(`tile-layout: unknown node kind '${String((node as ActivityNode).kind)}'`);
  return null;
}

/**
 * Kept LAST in this file on purpose (mission `activity-loop-tile-port`, T1):
 * Lizard 1.23.0's TypeScript reader loses this function's closing scope
 * inside the `switch` (the `identifier(` heuristic bug `node-dispatch.ts`'s
 * header describes), so any function placed below it inflates the
 * complexity hook's ratchet for this name. Add new builders above.
 */
function tileNode(
  node: ActivityNode,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
  pragma: Pragma,
): Tile | null {
  if (isSimpleLeaf(node)) return tileSimpleLeaf(node, bounder, theme);
  if (isEarlyLeafKind(node)) return tileEarlyLeaf(node);
  switch (node.kind) {
    case 'if':
      return tileIf(node, bounder, theme, laneOrder, pragma);
    case 'while':
      return wrapWhileNotes(tileWhile(node, bounder, theme, laneOrder, pragma), node.notes, bounder, theme);
    case 'repeat':
      return tileRepeat(node, bounder, theme, laneOrder, pragma);
    case 'fork':
      return tileFork(node, bounder, theme, laneOrder, pragma);
    case 'split':
      return tileSplit(node, bounder, theme, laneOrder, pragma);
    case 'switch':
      return tileSwitch(node, bounder, theme, laneOrder, pragma);
    case 'group':
      return tileGroup(node, bounder, theme, laneOrder, pragma);
    default:
      return unknownNodeKind(node);
  }
}
