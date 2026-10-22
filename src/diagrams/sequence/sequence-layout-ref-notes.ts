/**
 * The notes a `ReferenceTile` draws beside its box (sdd2 T5h), split out of
 * `sequence-layout-note.ts` (500-line cap).
 */
import type { NoteEvent } from './ast.js';
import type { EventProcessingContext } from './sequence-layout-events.js';
import { emitNote, resolveNote, type ResolvedNote } from './sequence-layout-note.js';

/** `[first, last]` of a `ReferenceTile` (`ReferenceTile#init`). */
export interface RefSpan {
  readonly first: number;
  readonly last: number;
}

/** A ref note's drawn tile: its preferred width (`getPreferredWidth`,
 *  `NoteTile`'s `used` with no several-span) and the box at `originX`. */
function refNoteAt(note: NoteEvent, position: 'left' | 'right', span: RefSpan, ctx: EventProcessingContext) {
  const anchored: NoteEvent = { ...note, participants: [] };
  const width = (originX: number): ResolvedNote => resolveNote(anchored, ctx, { position, forceNote: false, originX });
  const probe = width(0).tile;
  const wn = probe.maxX - probe.minX;
  return { anchored, resolved: width(position === 'left' ? span.first - wn : span.last) };
}

/**
 * The notes a `ReferenceTile` draws beside its box, after the box
 * (`ReferenceTile.java:134-150`): `noteLeft` at `dx(first - wn)` then
 * `noteRight` at `dx(last)`, each at the tile's own top (`:122`) and sized by
 * its component's `getPreferredWidth` (`:139,146`). The constructor keeps the
 * LAST note of each side (`:76-85`). They add no height (`getPreferredHeight`
 * is the ref component's, `:153-157`); the geo's `minX`/`maxX` are
 * `getMinX`/`getMaxX` (`:163-180`), which the width pass folds in.
 */
export function layoutRefNotes(
  notes: readonly NoteEvent[],
  span: RefSpan,
  top: number,
  ctx: EventProcessingContext,
): void {
  for (const position of ['left', 'right'] as const) {
    const note = notes.filter((n) => n.position === position).at(-1);
    if (note === undefined) continue;
    const { anchored, resolved } = refNoteAt(note, position, span, ctx);
    emitNote(anchored, resolved, top, ctx);
  }
}
