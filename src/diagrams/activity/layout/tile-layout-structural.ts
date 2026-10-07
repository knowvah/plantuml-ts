/**
 * `tileFork`/`tileSplit`/`tileSwitch`/`tileGroup` -- split out of
 * `tile-layout.ts` (D12/T1p-b) purely to keep that file under the
 * project's 500-line cap (threading a `pragma` parameter through every
 * `tileX` builder, mirroring `laneOrder`'s own existing convention,
 * pushed it over). Pure mechanical move: no behavior change, same doc
 * comments, same call sites (now imported).
 */

import type {
  ActivityFork,
  ActivityGroup,
  ActivityNode,
  ActivityNote,
  ActivitySplit,
  ActivitySwitch,
  ActivitySwitchCase,
} from '../ast.js';
import type { StringBounder, Tile } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import type { Pragma } from '../../../core/skin/Pragma.js';
import { GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import { GtileFork } from '../tiles/gtile-fork.js';
import { GtileMerge } from '../tiles/gtile-merge.js';
import { GtileSplit } from '../tiles/gtile-split.js';
import { GtileSwitch } from '../tiles/gtile-switch.js';
import { GtileGroup } from '../tiles/gtile-group.js';
import { GtilePartition } from '../tiles/gtile-partition.js';
import { GtileTopDown } from '../tiles/gtile-top-down.js';
import type { GtileNote } from '../tiles/gtile-note.js';
import { GtileNoteOpale } from '../tiles/gtile-note.js';
import { GtileWithNotes } from '../tiles/gtile-with-notes.js';
import type { WithNotesEntry } from '../tiles/gtile-with-notes.js';
import { tileNodes, withSwimlane, withSwimlaneOut } from './tile-layout.js';
import { tileSimpleLeaf } from './tile-layout-leaves.js';
import { withInLabel, withOutLabel } from './tile-layout-inlabel.js';

/**
 * `FtileFactoryDelegatorAddNote#addNote` (`vcompact/FtileFactoryDelegator
 * AddNote.java:56-71`): with no preceding tile this is a standalone
 * `FtileNoteAlone` (floating, own flow node) -- modelled unchanged by the
 * pre-existing sibling push below. With one, it WRAPS it
 * (`FtileWithNoteOpale.create`, `:70`), REPLACING the just-pushed sibling
 * rather than appending beside it -- mutates `tiles` in place, the same
 * convention `tile-layout.ts#withKilled`'s own call site uses. Split out
 * of `tile-layout.ts#tileNodes` (D12/T1p-b precedent above) purely to keep
 * that file under the 500-line cap; `tileNodes` calls this directly.
 * Two notes on ONE instruction would upstream collect into a SINGLE
 * `FtileWithNotes` (`FtileWithNoteOpale.java:116-117`), never a second
 * nested wrap -- out of scope (no cohort row has two notes on one
 * instruction, mission `activity-divergence-drive-2` T3g); falls back to
 * the floating sibling model rather than nesting wraps incorrectly.
 * A note tagged with a DIFFERENT swimlane than the preceding tile (e.g.
 * `razuzu-32-faje125`: `floating note right` captured in `laneTwo`
 * immediately after an action in `laneOne`) also falls back: upstream
 * models this via `FtileWithNoteOpale`'s own `swimlaneNote` field
 * (`:86,92-99,217`), a per-swimlane-interceptor draw gate this port's flat
 * single-pass SVG canvas has no counterpart for -- wrapping it the same
 * way as a same-lane note would reserve flow-column width for a note that
 * upstream draws in a visually disjoint lane. Un-ported, re-slotted
 * (`activity-divergence-drive-2`, next-missions).
 *
 * `addNote`'s base (`WithNote.java:56-59`, unoverridden) is what every
 * kind in {@link WRAP_SAFE_KINDS} resolves to -- confirmed per-kind:
 * `InstructionSimple/Start/Stop/Spot/End` each call `eventuallyAddNote`
 * on their OWN just-built tile (`InstructionSimple.java:111` et al, cited
 * on `GtileNoteOpale`'s own doc). `InstructionFork#addNote`
 * (`:153-162`) stores on itself once `finished`, and its `createFtile`
 * (`:122-132`) wraps too -- but with `withLink=false` (`:129`), so a
 * fork/merge note NEVER gets the spike (`vokibe-29-vepe451`). Everything
 * else overrides `addNote` to do something ELSE entirely:
 * `InstructionIf#addNote` (`:222-227`) stops wrapping once `endifCalled`
 * -- its own `createFtile` (`:146-149`) threads notes INTO `createIf`
 * instead, with the Opale-wrap call explicitly commented out
 * (`vexula-75-noko098`'s riser, caught by this exact row: wrapping the
 * WHOLE if/else composite reserved the note's width beside it, which
 * upstream never does). `InstructionSplit#addNote` (`:96-98`) always
 * forwards into its last branch, never self-wraps, with no reachable
 * "closed" state at all. `while`/`repeat`/`switch`/`group` are UNVERIFIED
 * (no cohort row exercises a note directly after one) -- excluded from
 * the allow-list rather than guessed into it.
 */
const WRAP_SAFE_KINDS: ReadonlySet<string> = new Set([
  'gtile-start',
  'gtile-stop',
  'gtile-end',
  'gtile-break',
  'gtile-action',
  'gtile-spot',
]);
/** `InstructionFork#createFtile`'s own `withLink=false` (`:129`) --
 *  `gtile-merge` shares `InstructionFork` (D12/T1p-c), so the same rule
 *  applies to both tile kinds this builder produces. */
const WRAP_NO_LINK_KINDS: ReadonlySet<string> = new Set(['gtile-fork', 'gtile-merge']);

/** `WithNotesEntry` list of every note already stacked on a prior
 *  `GtileWithNotes`/`GtileNoteOpale` wrap -- NOTE-MULTI's own merge
 *  needs the PRIOR note(s)' text/side back out, never re-measured
 *  (`StackedNote.text`/`NoteStack`'s own side segregation IS the
 *  position). */
function entriesOf(last: GtileNoteOpale | GtileWithNotes): WithNotesEntry[] {
  if (last.kind === 'gtile-note-opale') return [{ text: last.note.text, position: last.note.side }];
  const left = last.left?.notes.map((n) => ({ text: n.text, position: 'left' as const })) ?? [];
  const right = last.right?.notes.map((n) => ({ text: n.text, position: 'right' as const })) ?? [];
  return [...left, ...right];
}

/**
 * `FtileWithNoteOpale.create`'s own `notes.size() > 1` arm
 * (`FtileWithNoteOpale.java:116-117`): a SECOND (or later) note on one
 * instruction collects into ONE `FtileWithNotes`, REPLACING whatever
 * spiked/stacked wrap the prior note(s) already built -- never nests.
 * `activity-divergence-drive-3` T2a, family NOTE-MULTI.
 */
function mergeIntoWithNotes(last: GtileNoteOpale | GtileWithNotes, node: ActivityNote, bounder: StringBounder, theme: Theme): Tile {
  const entries: WithNotesEntry[] = [...entriesOf(last), { text: node.text, position: node.position }];
  return new GtileWithNotes(last.children[0]!, entries, bounder, theme);
}

/** `last` already carries one or more notes -- the NOTE-MULTI merge
 *  target, not the WRAP_SAFE_KINDS leaf-wrap target. Split out of {@link
 *  tileNote} purely to keep that function's own CCN under the file's
 *  limit. */
function isMergeableNoteWrap(tile: Tile): tile is GtileNoteOpale | GtileWithNotes {
  return tile.kind === 'gtile-note-opale' || tile.kind === 'gtile-with-notes';
}

/** `razuzu-32-faje125`'s own `sameLane` guard, split out of {@link
 *  tileNote} for the same CCN reason as {@link isMergeableNoteWrap}. */
function isSameLaneAsPrevious(node: ActivityNote, last: Tile | undefined): boolean {
  return last === undefined || node.swimlane === undefined || node.swimlane === last.swimlane;
}

/** Whether `last` is a WRAP_SAFE_KINDS/WRAP_NO_LINK_KINDS leaf this note
 *  may wrap for the FIRST time -- split out of {@link tileNote} for the
 *  same CCN reason as {@link isMergeableNoteWrap}. */
function isFirstWrapTarget(last: Tile): boolean {
  return WRAP_SAFE_KINDS.has(last.kind) || WRAP_NO_LINK_KINDS.has(last.kind);
}

export function tileNote(tiles: Tile[], node: ActivityNote, bounder: StringBounder, theme: Theme): void {
  const last = tiles[tiles.length - 1];
  const noteTile = tileSimpleLeaf(node, bounder, theme) as GtileNote;
  const sameLane = isSameLaneAsPrevious(node, last);
  if (last !== undefined && sameLane && isMergeableNoteWrap(last)) {
    tiles[tiles.length - 1] = mergeIntoWithNotes(last, node, bounder, theme);
    return;
  }
  if (last === undefined || !sameLane || !isFirstWrapTarget(last)) {
    tiles.push(noteTile);
    return;
  }
  tiles[tiles.length - 1] = new GtileNoteOpale(last, noteTile, !WRAP_NO_LINK_KINDS.has(last.kind));
}

/**
 * D12/T1p-c: `node.style === 'merge'` (`fork ... end merge`) builds a
 * `GtileMerge` instead -- same branch tiling, different join shape
 * (`gtile-merge.ts`'s own doc). `withSwimlane`/`withSwimlaneOut` reuse the
 * AST's captured fields for both styles (`walk-fork-branches.ts
 * #pushMergeDiamondNode`'s own doc covers the one divergence this elides).
 */
/**
 * T1b pass 2: a fork/split BRANCH's own `GtileTopDown` wrapper needs its
 * first child's {@link Tile.inLabel} copied onto ITSELF, since
 * `walk-fork-branches.ts#pushBranchIn` (`ParallelBuilderFork.java:
 * 151-163`/`ParallelBuilderSplit.java:194-203`, T1a's census rows 19/20,
 * 25/26) reads the WRAPPER, never its first child -- `tileNodes` only
 * ever sets `inLabel` on the tile it was given directly
 * (`tile-layout.ts`'s own doc), and a branch's own entry label (a `->
 * label;` right after `fork`/`fork again`/`split`/`also`) is the FIRST
 * node of `b`, not a sibling of the wrapper.
 *
 * T1d rows 21/22/27/28: the SAME wrapper's {@link Tile.outLabel} carries
 * `tileNodes`'s own `trailing` -- a `-> label;` that was the LAST thing
 * in this branch's body, right before `fork again`/`split again`/`end
 * fork`/`end split`. `InstructionFork#manageOutRendering`/
 * `InstructionSplit#splitAgain`/`#endSplit` both call `getLastList()
 * .setOutRendering(nextLinkRenderer)` (`InstructionFork.java:183-191`,
 * `InstructionSplit.java:128-142`) -- the SAME pending-state machine as
 * row 1, captured at the branch's own CLOSE instead of its open.
 * `walk-fork-branches.ts#pushBranchOut` (shared verbatim by fork AND
 * split) reads it off this exact object.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderFork.java:124,197
 *   -- `ConnectionOut`'s `label = ftile1.getOutLinkRendering().getDisplay()`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderSplit.java:160-161
 *   -- same accessor, split's own `ConnectionOut`.
 */
function buildBranchTopDown(b: ActivityNode[], bounder: StringBounder, theme: Theme, laneOrder: readonly string[], pragma: Pragma): GtileTopDown {
  const { tiles, trailing } = tileNodes(b, bounder, theme, laneOrder, pragma);
  const topDown = new GtileTopDown(tiles, bounder, theme);
  withInLabel(topDown, tiles[0]?.inLabel);
  return withOutLabel(topDown, trailing);
}

export function tileFork(
  node: ActivityFork,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
  pragma: Pragma,
): GtileFork {
  const branches = node.branches.map((b) => buildBranchTopDown(b, bounder, theme, laneOrder, pragma));
  // N (add2 T3i): `node.label` is only ever set for `style !== 'merge'`
  // (`ActivityFork.label`'s own doc, ast.ts) -- `GtileMerge` never reads it.
  const built =
    node.style === 'merge'
      ? new GtileMerge(branches, bounder)
      : new GtileFork(branches, bounder, undefined, theme, node.label);
  return withSwimlaneOut(withSwimlane(built, node.swimlane), node.swimlaneOut);
}

export function tileSplit(
  node: ActivitySplit,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
  pragma: Pragma,
): GtileSplit {
  const branches = node.branches.map((b) => buildBranchTopDown(b, bounder, theme, laneOrder, pragma));
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
/**
 * T1d row 32: a case's own trailing `-> label;` (right before the NEXT
 * `case (...)`/`endswitch`) is `Branch#special`, set via
 * `InstructionSwitch#switchCase`/`#endSwitch` (`InstructionSwitch.java:
 * 166-183`) at that keyword's own dispatch -- the SAME mechanism as the
 * if-builder's branch-exit label (`buildBranchTopDown`'s own doc above),
 * read here from `tileNodes`'s own `trailing` instead of the CASE
 * builder's fallthrough. `walk-switch.ts#pushCaseToMergeEdge` applies it
 * to the case-to-merge edge with `VerticalAlignment.CENTER`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchWithManyLinks.java:454-462
 *   -- `ConnectionVerticalBottom`/`ConnectionVerticalThenHorizontal`,
 *   both reading `branches.get(i).getTextBlockSpecial()`.
 */
function tileSwitchCase(
  kase: ActivitySwitchCase,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
  pragma: Pragma,
): { tile: GtileTopDown; label?: string } {
  const { tiles, trailing } = tileNodes(kase.body, bounder, theme, laneOrder, pragma);
  const tile = withOutLabel(new GtileTopDown(tiles, bounder, theme), trailing);
  return kase.label !== undefined ? { tile, label: kase.label } : { tile };
}

export function tileSwitch(
  node: ActivitySwitch,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
  pragma: Pragma,
): GtileSwitch {
  // `FtileFactoryDelegatorSwitch#getDiamond1`/`#getDiamond2` (`vcompact/
  // FtileFactoryDelegatorSwitch.java:129-161`): both are bare
  // `FtileDiamondInside` hexagons (no `.withNorth`/`.withWest`/`.withEast`
  // call anywhere in that file) -- diamond1 carries the switch's own
  // condition label, diamond2 is always empty.
  const diamond = new GtileDiamondInside(node.condition, {}, bounder, theme);
  const cases = node.cases.map((kase) => tileSwitchCase(kase, bounder, theme, laneOrder, pragma));
  const mergeDiamond = new GtileDiamondInside('', {}, bounder, theme);
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
/** `InstructionGroup#createFtile`'s own `if (note != null) tmp = new
 *  FtileWithNotes(tmp, singleton(note), CENTER)` (`InstructionGroup
 *  .java:104-105`): wraps the group's BODY, before the frame -- the
 *  stacked/no-spike shape, even for this one note. `activity-
 *  divergence-drive-3` T2a, family GROUPNOTE. */
function wrapGroupNote(body: Tile, note: ActivityNote | undefined, bounder: StringBounder, theme: Theme): Tile {
  if (note === undefined) return body;
  const entries: WithNotesEntry[] = [{ text: note.text, position: note.position }];
  return new GtileWithNotes(body, entries, bounder, theme);
}

export function tileGroup(
  node: ActivityGroup,
  bounder: StringBounder,
  theme: Theme,
  laneOrder: readonly string[],
  pragma: Pragma,
): Tile {
  const rawBody = new GtileTopDown(tileNodes(node.body, bounder, theme, laneOrder, pragma).tiles, bounder, theme);
  const body = wrapGroupNote(rawBody, node.note, bounder, theme);
  const tile =
    node.groupType === 'group'
      ? new GtileGroup(node.title, body, bounder, theme)
      : new GtilePartition(node.title, body, bounder, theme);
  return withSwimlane(tile, node.swimlane);
}
