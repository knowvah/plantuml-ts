/**
 * Note widths and `NotesTile#addConstraints` for the participant row (sdd2
 * T5d). The row is laid out BEFORE the event walk, so a note's width cannot be
 * read off `sequence-layout-note.ts` (which imports the walk: a load-order
 * cycle). This module measures a note the way the note component does --
 * `getPreferredWidth` -- from leaf modules only.
 *
 * @see teoz/NotesTile.java:202-226 (`addConstraints`)
 * @see teoz/NotesTile.java:140-190 (`getUsedWidth`, `getX`, `getStackingOffset`)
 */
import type { NoteEvent, SequenceEvent } from './ast.js';
import type { Participant } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import { Colors } from '../../core/abel/Colors.js';
import { ColorType } from '../../core/abel/ColorType.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import type { LiveEvent, LiveEvents } from './sequence-live-events.js';
import type { Scan, SpanConstraint } from './sequence-layout-participant-constraints.js';
import { componentLabelBlock, type LabelBlock } from './sequence-creole-sheet.js';
import { LIVE_DELTA_SIZE } from './sequence-layout-shared.js';
import { noteStyle, paintOf, type SequencePaint } from './sequence-skin-param.js';
import { NOTE_COMPONENT_PADDING_X, notePadding, type NotePadding } from './sequence-note-tile.js';

/** What a note's width is measured with. `theme` carries `skinparam
 *  noteTextAlignment` (`Rose.java:100-112`); absent, the LEFT default. */
export interface NoteWidthEnv {
  readonly measurer: StringMeasurer;
  readonly sprites?: SpriteRegistry | undefined;
  readonly theme?: Theme | undefined;
}

export type NoteComponent = NonNullable<NoteEvent['style']>;

/** `AlignmentParam.noteTextAlignment`, else `defaulttextalignment`, else LEFT
 *  (`SkinParam.java:722-727`), as `sequence-layout-note.ts` resolves it. */
function noteAlignment(theme: Theme | undefined): HorizontalAlignment {
  const elements = theme?.colors.elements;
  return elements?.['note']?.horizontalAlignment ?? elements?.root?.horizontalAlignment ?? HorizontalAlignment.LEFT;
}

/**
 * The note's `Colors` as its command built them: `ColorParser.simpleColor
 * (BACK)` -> `new Colors(data, set, BACK)` (`FactorySequenceNoteCommand
 * .java:234`, `...OverSeveralCommand.java:239`, `...AcrossCommand.java:218`);
 * a note on an arrow takes the whole string as its BACK colour
 * (`FactorySequenceNoteOnArrowCommand.java:223-225`).
 */
function noteColors(event: NoteEvent): Colors | undefined {
  if (event.color === undefined) return undefined;
  const set = HColorSet.instance();
  if (event.onMessage === true) return Colors.empty().add(ColorType.BACK, set.getColor(event.color));
  return Colors.parse(event.color, set, ColorType.BACK);
}

/** The note's merged style: `Note#getUsedStyles` (`Note.java:75-82`) -- the
 *  keyword's signature (`NoteStyle.java:66-74`) merged with the stereotype's
 *  styles, then `eventuallyOverride(colors)`. */
function noteStyleOf(event: NoteEvent): ReturnType<typeof noteStyle> {
  return noteStyle(event.styleBuilder, event.style ?? 'note', Stereotype.build(event.stereotype), noteColors(event));
}

/** The note's paint, resolved at use time from the builder captured at its
 *  command, read off the HTML colour set (`AbstractComponent.java:81-83`). */
export function notePaint(event: NoteEvent): SequencePaint {
  return paintOf(noteStyleOf(event), HColorSet.instance());
}

/**
 * The note component's text block and the ink it is drawn under -- the ONE
 * measurement both the participant row (`noteComponentWidth`) and the note
 * tile (`sequence-layout-note.ts#resolveNote`) read.
 *
 * - `note` is `enhanced` (`ComponentRoseNote.java:66-71`): `BodyFactory.create3`
 *   (`AbstractTextualComponent.java:88-89`), drawn after `symbolContext.apply(ug)`
 *   (`ComponentRoseNote.java:121`: the fill, the border colour, the style's
 *   stroke -- what a creole table's grid inherits).
 * - `rnote`/`hnote` are `create0` with the padding as margins
 *   (`ComponentRoseNoteBox.java:58`, `ComponentRoseNoteHexagonal.java:58`),
 *   drawn after `symbolContext.apply(ug)` then `UStroke.simple()` (`:99-105`,
 *   `:108-111`).
 *
 * The body's lines are the source lines (`FactorySequenceNoteCommand.java:146`
 * keeps them as written), at the note style's font and alignment. `margins`
 * is the component padding (`sequence-note-tile.ts#notePadding`).
 */
export function noteBodyBlock(
  note: NoteEvent,
  component: NoteComponent,
  env: NoteWidthEnv,
  margins: NotePadding,
): LabelBlock {
  const style = noteStyleOf(note);
  const paint = paintOf(style, HColorSet.instance());
  if (paint.font.color === null) throw new Error('note style resolved no FontColor');
  const enhanced = component === 'note';
  const opts = {
    align: paint.align ?? HorizontalAlignment.LEFT,
    sprites: env.sprites,
    // `super(style, style.wrapWidth(), ...)` (`ComponentRoseNote.java:67`,
    // `ComponentRoseNoteBox.java:58`, `ComponentRoseNoteHexagonal.java:58`).
    maxWidth: style.wrapWidth(),
    ink: { back: paint.fill, fore: paint.stroke, stroke: enhanced ? style.getStroke() : UStroke.simple() },
    // `create9` passes no margins (`Display.java:630-634`, BodyEnhanced2's
    // `getTextBlock`); `create0` takes the component padding's sides.
    ...(enhanced ? {} : { marginX1: margins.left, marginX2: margins.right }),
    ...(enhanced
      ? { enhanced: { defaultThickness: paint.thickness, minimumWidth: style.value('MinimumWidth').asDouble() } }
      : {}),
    // `ComponentRoseNote`'s own stencil, 0..getTextWidth with the text at
    // `getOldPaddingX1()` (`:124-130,140-146`) -- the LEFT, `diffX = 0`
    // placement; a wider area's `diffX / 2` shift is not carried.
    ...(enhanced ? { componentStencil: { before: margins.left, after: margins.right } } : {}),
  };
  return componentLabelBlock(note.text.split('\n'), paint.font, opts, env.measurer);
}

/**
 * The note component's preferred width: the text block plus the text
 * padding, `2 * getPaddingX` and, for `note` alone, the delta shadow
 * (`ComponentRoseNote.java:83-91`, `AbstractTextualComponent.java:100-108`).
 * `component` is the one the tile builds -- the keyword's, unless a wrapper
 * forces `ComponentType.NOTE` (`CommunicationTileSelfNoteRight.java:102`).
 */
export function noteComponentWidth(note: NoteEvent, env: NoteWidthEnv, component?: NoteComponent): number {
  const kind = component ?? note.style ?? 'note';
  const pad = notePadding(kind, noteAlignment(env.theme));
  const block = noteBodyBlock(note, kind, env, pad).width;
  const reserve = kind === 'note' ? notePaint(note).shadowing : 0;
  return block + pad.left + pad.right + 2 * NOTE_COMPONENT_PADDING_X + reserve;
}

/**
 * The note tiles of one event list, each a list of its notes: a `/ note`
 * joins the tile before it when that is a note (`SequenceDiagram#addNote
 * :226-241`); a note on a message is no tile. A one-note tile is a
 * `NoteTile`, a longer one a `NotesTile`. `recurse` also walks the frames'
 * branches, in the order the live-event list is built (`flattenLiveEvents`).
 */
export function noteTiles(events: readonly SequenceEvent[], recurse = false): NoteEvent[][] {
  const out: NoteEvent[][] = [];
  let last: NoteEvent[] | undefined;
  for (const ev of events) {
    if (ev.kind === 'note') {
      if (ev.onMessage === true) continue;
      if (ev.vmerge === true && last !== undefined) last.push(ev);
      else out.push((last = [ev]));
    } else {
      last = undefined;
      if (recurse) out.push(...framedNoteTiles(ev));
    }
  }
  return out;
}

/** The note tiles inside a group's branches (a `ref` has none). */
function framedNoteTiles(ev: SequenceEvent): NoteEvent[][] {
  if (ev.kind !== 'frame' || ev.frameType === 'ref') return [];
  return ev.branches.flatMap((branch) => noteTiles(branch, true));
}

function isNoteEntry(entry: LiveEvent): boolean {
  return entry.kind === 'note' || (entry.kind === 'other' && entry.notes === true);
}

/**
 * Each standalone note's entry in the live-event list: tile `k` in document
 * order is the `k`th `note` / `Notes` entry (`LiveBoxes` finds a note's level
 * from its entry, which `LiveEvents#ofSource` does not index).
 */
export function noteLiveEntries(events: readonly SequenceEvent[], live: LiveEvents): Map<NoteEvent, LiveEvent> {
  const entries = live.events.filter(isNoteEntry);
  const map = new Map<NoteEvent, LiveEvent>();
  noteTiles(events, true).forEach((tile, k) => {
    for (const note of tile) map.set(note, entries[k]!);
  });
  return map;
}

/** `getLevelAt(tile, IGNORE_FUTURE_DEACTIVATE)` of a standalone note's tile
 *  on `participant` (`NotesTile.java:156`, `NoteTile.java:155-173`). */
export function noteLevel(note: NoteEvent, participant: string, scan: Scan): number {
  const entry = scan.noteEntries.get(note);
  const boxes = scan.boxes.get(participant);
  return entry === undefined || boxes === undefined ? 0 : boxes.getLevelAt(entry, 'IGNORE_FUTURE_DEACTIVATE');
}

/** `NotePosition.OVER_SEVERAL`: `over` with a second participant. */
function isSeveral(note: NoteEvent): boolean {
  return note.position === 'over' && note.participants.length > 1;
}

/** `Note#getPosition` as `NotesTile#getStackingOffset` (`:183`) compares it. */
function samePosition(a: NoteEvent, b: NoteEvent): boolean {
  return a.position === b.position && isSeveral(a) === isSeveral(b);
}

/** One group member's x: `x - posC` (`NotesTile.java:152-165`) and its width. */
interface Placed {
  readonly note: NoteEvent;
  readonly index: number;
  readonly offset: number;
  readonly width: number;
}

/**
 * `NotesTile#getX` (`:152-175`) reduced to its distance from the anchor's
 * `posC`, for the three single-anchor positions; `getStackingOffset`
 * (`:180-190`) sums the earlier members' widths on the same participant and
 * side. `OVER_SEVERAL` is `middle(posC1, posC2)` -- two lifelines, not a
 * fixed distance from one -- and is not placed.
 */
function placeMembers(members: readonly NoteEvent[], sorted: readonly Participant[], scan: Scan): Placed[] {
  const placed: Placed[] = [];
  const widths = members.map((m) => noteComponentWidth(m, scan));
  members.forEach((note, i) => {
    const index = sorted.findIndex((p) => p.id === note.participants[0]);
    if (index < 0 || isSeveral(note)) return;
    let stack = 0;
    for (let j = 0; j < i; j++) {
      const other = members[j]!;
      if (samePosition(other, note) && other.participants[0] === note.participants[0]) stack += widths[j]!;
    }
    const width = widths[i]!;
    const offset =
      note.position === 'left'
        ? -width - stack
        : note.position === 'right'
          ? noteLevel(note, note.participants[0]!, scan) * LIVE_DELTA_SIZE + stack
          : -width / 2;
    placed.push({ note, index, offset, width });
  });
  return placed;
}

/**
 * `NotesTile#addConstraints` (`teoz/NotesTile.java:202-226`): for each pair
 * `i < j`, when the anchors differ, the one whose anchor is further right is
 * pushed past the other's right edge -- `point2.ensureBiggerThan(getX2(i))`
 * (`:216-218`) or its mirror (`:219-222`); the same anchor is rigid and skipped
 * (`:212-214`). Anchors compare by their initial order (the row starts as the
 * heads laid end to end), i.e. by participant index. Stated on centres: with
 * `x = posC + offset`, `posC[b] - posC[a] >= offset[a] + width[a] - offset[b]`.
 */
export function notesGroupConstraints(
  events: readonly SequenceEvent[],
  sorted: readonly Participant[],
  scan: Scan,
): SpanConstraint[] {
  const out: SpanConstraint[] = [];
  for (const tile of noteTiles(events)) {
    if (tile.length < 2) continue;
    const placed = placeMembers(tile, sorted, scan);
    for (const [a, i] of placed.entries()) {
      for (const j of placed.slice(a + 1)) {
        if (i.index === j.index) continue;
        const [left, right] = i.index < j.index ? [i, j] : [j, i];
        // `x(right) >= x2(left)`: the left-anchored note is the one whose
        // right edge `getX2` the other must clear (both branches, `:216-222`).
        out.push({
          from: left.index,
          to: right.index,
          span: left.offset + left.width - right.offset,
        });
      }
    }
  }
  return out;
}
