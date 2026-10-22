/**
 * Which notes `TileBuilder` folds into a message's wrapper tiles (sdd2 T3c2),
 * split out of `sequence-layout-events.ts` so the participant row's frame
 * clearance can read the wrapper a message builds without importing the
 * event walk.
 */
import { Warning } from '../../core/warning/Warning.js';
import type { FrameEvent, MessageEvent, MessageExoEvent, NoteEvent, SequenceEvent } from './ast.js';

/** A message or exo message (the two `AbstractMessage` kinds that carry
 *  notes, `AbstractMessage.java:58` implements `EventWithNote`), or a `ref`
 *  (`Reference extends AbstractEvent implements EventWithNote`). */
export type NoteOwner = MessageEvent | MessageExoEvent | FrameEvent;

/** A `ref over` frame: the `Reference` that owns its notes. */
export type RefOwner = FrameEvent & { readonly frameType: 'ref' };

/**
 * `msg.getNoteOnMessages()`, per owner. `FactorySequenceNoteOnArrowCommand`
 * adds the note to `diagram.getLastEventWithNote()` (`:211`), the latest
 * event that is an `EventWithNote` (`SequenceDiagram.java:154-158`): an
 * `AbstractMessage`, a `Reference` or a `GroupingLeaf`. Life events, dividers
 * and standalone notes in between do not change the owner; a frame (its `end`
 * leaf) does, and a note it owns is not a message's. A `ref` is itself an
 * owner: `Reference#addNote` takes LEFT and RIGHT notes only
 * (`Reference.java:166-171`) and `ReferenceTile` draws them beside the ref
 * (`ReferenceTile.java:76-85,138-150`).
 *
 * A message's `top`/`bottom` note is folded too (`NoteTop`/`NoteBottom`,
 * `TileBuilder.java:117-120`); after an exo arrow every note is folded,
 * because there the position comes from note 0 (`TileBuilder.java:128-136`).
 * A `top`/`bottom` note after a `ref` is folded and drawn by nobody
 * (`Reference#addNote` ignores it, `Reference.java:166-168`). Only a note whose
 * owner is a group `end` stays stacked, drawn by `legacyOverTile` (see
 * `sequence-note-tile.ts`).
 */
export function notesOnMessages(events: readonly SequenceEvent[]): Map<NoteOwner, NoteEvent[]> {
  const notesOf = new Map<NoteOwner, NoteEvent[]>();
  let owner: NoteOwner | undefined;
  for (const event of events) {
    if (event.kind === 'message' || event.kind === 'messageExo') owner = event;
    else if (isRef(event)) owner = event;
    else if (event.kind === 'frame') owner = event;
    else if (owner !== undefined && foldsInto(owner, event)) notesOf.set(owner, [...(notesOf.get(owner) ?? []), event]);
  }
  return notesOf;
}

/** Whether `event` is a note on `owner` that a wrapper draws (see
 *  {@link notesOnMessages}). */
function foldsInto(owner: NoteOwner, event: SequenceEvent): event is NoteEvent {
  if (event.kind !== 'note' || event.onMessage !== true) return false;
  // A `ref` takes every note into `noteOnMessages`' reach but `addNote` drops
  // anything but LEFT/RIGHT with a Warning (`Reference.java:166-168`): folded
  // here so it is not stacked, drawn by nobody (`layoutRefNotes`).
  if (owner.kind === 'frame') return true;
  return owner.kind === 'messageExo' || event.position !== 'over' || event.side !== undefined;
}

/**
 * The notes an `else`/`also` leaf owns: those written after it, before the
 * next message, exo message or frame in its branch (`getLastEventWithNote`
 * walks back to the `GroupingLeaf`, `SequenceDiagram.java:154-158`). The leaf
 * stores them (`GroupingLeaf.java:122-128`) but `GroupingTile` reads only the
 * `end` leaf's (`:1023-1041`), so nothing draws them (jar-probed: an `alt`/
 * `else` with a note after the `else` renders byte-identically to one without).
 * `branch` is a branch AFTER the first; a first branch's start leaf is no
 * `EventWithNote` (`GroupingStart`), so its notes belong to an earlier event.
 */
export function elseLeafNotes(branch: readonly SequenceEvent[]): NoteEvent[] {
  const notes: NoteEvent[] = [];
  for (const event of branch) {
    if (event.kind === 'message' || event.kind === 'messageExo' || event.kind === 'frame') break;
    if (event.kind === 'note' && event.onMessage === true) notes.push(event);
  }
  return notes;
}

/**
 * The warnings `Reference#addNote` returns for the notes it drops: a `ref`
 * takes LEFT and RIGHT only, any other position yields `new Warning("This
 * position is ignored: " + note.getPosition())` (`Reference.java:166-171`),
 * which `FactorySequenceNoteOnArrowCommand.java:236-237` hands to
 * `diagram.addWarning`. A group's `end` leaf warns the same way for `top`/`bottom`
 * (`GroupingLeaf.java:122-128`). Source order, nested frames included; the
 * `NotePosition` enum prints upper-case. A message's own `top`/`bottom` note
 * is accepted (`AbstractMessage.java:219-227`), so only `ref` owners warn.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Reference.java:166-171
 */
export function ignoredNoteWarnings(events: readonly SequenceEvent[]): Warning[] {
  const warnings: Warning[] = [];
  let owner: NoteOwner | undefined;
  for (const event of events) {
    if (event.kind === 'frame') event.branches.forEach((b, i) => warnings.push(...branchWarnings(b, i)));
    if (event.kind === 'message' || event.kind === 'messageExo') owner = event;
    else if (isRef(event)) owner = event;
    else if (event.kind === 'frame') owner = event;
    else if (owner?.kind === 'frame' && foldsInto(owner, event) && event.side !== undefined)
      warnings.push(new Warning(`This position is ignored: ${event.side.toUpperCase()}`));
  }
  return warnings;
}

/** A branch's warnings; an `else` branch's leaf notes warn like an `end`'s
 *  (`GroupingLeaf.java:122-128`), `top`/`bottom` only. */
function branchWarnings(branch: readonly SequenceEvent[], index: number): Warning[] {
  const leaf = index === 0 ? [] : elseLeafNotes(branch).flatMap((n) => (n.side === undefined ? [] : [n.side]));
  const own = leaf.map((side) => new Warning(`This position is ignored: ${side.toUpperCase()}`));
  return [...own, ...ignoredNoteWarnings(branch)];
}

function isRef(event: SequenceEvent): event is RefOwner {
  return event.kind === 'frame' && event.frameType === 'ref';
}
