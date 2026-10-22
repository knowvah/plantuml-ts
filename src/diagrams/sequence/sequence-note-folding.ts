/**
 * Which notes `TileBuilder` folds into a message's wrapper tiles (sdd2 T3c2),
 * split out of `sequence-layout-events.ts` so the participant row's frame
 * clearance can read the wrapper a message builds without importing the
 * event walk.
 */
import type { FrameEvent, MessageEvent, MessageExoEvent, NoteEvent, SequenceEvent } from './ast.js';

/** A message or exo message (the two `AbstractMessage` kinds that carry
 *  notes, `AbstractMessage.java:58` implements `EventWithNote`), or a `ref`
 *  (`Reference extends AbstractEvent implements EventWithNote`). */
export type NoteOwner = MessageEvent | MessageExoEvent | RefOwner;

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
    else if (event.kind === 'frame') owner = undefined;
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

function isRef(event: SequenceEvent): event is RefOwner {
  return event.kind === 'frame' && event.frameType === 'ref';
}
