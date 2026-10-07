/**
 * The `'gtile-with-notes'` case's full node emission, split out of
 * `tile-coordinates.ts`'s `walkTile` switch for the same reason the
 * if-down/if-with-links/switch walkers already are (one walker module
 * per builder) -- that file sits at the project's 500-line cap.
 * `walkTile`/`pushNode` are re-imported from `tile-coordinates.ts`, a
 * circular import safe the same way those walkers already document:
 * both sides are function DEFINITIONS, neither calls the other until a
 * real layout runs.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWithNotes.java:194-199
 *   -- `drawU`'s node order: left stack, right stack, then the wrapped tile.
 */

import type { GtileWithNotes } from '../tiles/gtile-with-notes.js';
import type { NoteStack, StackedNote } from '../tiles/gtile-with-notes.js';
import type { GtileNoteOpale } from '../tiles/gtile-note.js';
import type { ActivityNodeGeo } from '../activity-geometry.types.js';
import type { Out } from './tile-coordinates.js';
import { pushNode, walkTile } from './tile-coordinates.js';

/** `FtileWithNoteOpale#drawU` (`:195-221`): the note draws beside the
 *  wrapped tile (no flow edge), then the wrapped tile draws at its own
 *  translated offset. `pushTopDownSiblingEdge`'s `hasPointOut()`/
 *  `getCoord()` calls on a `gtile-note-opale` sibling resolve through
 *  THIS tile's own methods (`gtile-note.ts`), which pass through to the
 *  wrapped child -- no edge-code change needed there for this case.
 *  Moved from `tile-coordinates.ts`'s own switch (that file's 500-line
 *  cap) alongside the newer {@link walkWithNotes} -- both are note
 *  walkers, one module. */
export function walkNoteOpale(t: GtileNoteOpale, x: number, y: number, myLane: string | undefined, out: Out): void {
  const note = t.note;
  const noteNode: ActivityNodeGeo = {
    id: out.nextId('note'),
    kind: 'note',
    x: x + t.noteOffsetX,
    y: y + t.noteOffsetY,
    width: note.width,
    height: note.height,
    label: note.text,
    notePosition: note.side,
  };
  // `Opale#drawU`'s own `withLink == false` branch (`:109-110`) never
  // sets a spike at all -- `t.withLink` mirrors that (`gtile-note.ts`'s
  // own doc).
  if (t.withLink) noteNode.spikeTip = { x: x + t.spikeOffsetX, y: y + t.spikeOffsetY };
  pushNode(out, noteNode, myLane);
  walkTile(t.children[0]!, x + t.tileOffsetX, y + t.tileOffsetY, { kindHint: null, lane: myLane }, out);
}

/** `TextBlockUtils.withMargin(opale, 10, 10)` -- see `gtile-with-notes.ts`'s
 *  own `NOTE_STACK_MARGIN`; duplicated here (not imported) since it is a
 *  draw-site constant for this walker, not a geometry input. */
const NOTE_STACK_MARGIN = 10;

/** One side's stack draw origin -- bundled so {@link pushStack}/{@link
 *  pushStackedNote} stay under the file's 5-parameter limit. */
interface StackOrigin {
  readonly out: Out;
  readonly position: 'left' | 'right';
  readonly stackX: number;
  readonly originX: number;
  readonly originY: number;
  readonly lane: string | undefined;
}

/** One stacked note's own `kind: 'note'` push -- the SAME shape
 *  `tile-coordinates.ts`'s `'gtile-note-opale'` case pushes, minus
 *  `spikeTip` (`FtileWithNotes`'s own Opale is always `withLink=false`,
 *  `gtile-with-notes.ts`'s own class doc). `origin.stackX`/`.originY` are
 *  the stack's own outer origin; `entry.y` is this note's own offset
 *  WITHIN the stack (flush, no gap, `gtile-with-notes.ts#buildStack`). */
function pushStackedNote(origin: StackOrigin, entry: StackedNote, stackWidth: number): void {
  const noteX = origin.originX + origin.stackX + (stackWidth - entry.outerWidth) / 2 + NOTE_STACK_MARGIN;
  const noteY = origin.originY + entry.y + NOTE_STACK_MARGIN;
  const node: ActivityNodeGeo = {
    id: origin.out.nextId('note'),
    kind: 'note',
    x: noteX,
    y: noteY,
    width: entry.opaleWidth,
    height: entry.opaleHeight,
    label: entry.text,
    notePosition: origin.position,
  };
  pushNode(origin.out, node, origin.lane);
}

/** Every note in one side's stack, in top-to-bottom order
 *  (`FtileWithNotes.java:194-199`'s own `left.drawU`/`right.drawU`, which
 *  internally draws its own `blocks` top-to-bottom, `TextBlockVertical
 *  .java:78-98`). */
function pushStack(origin: StackOrigin, stack: NoteStack | null): void {
  if (stack === null) return;
  for (const entry of stack.notes) pushStackedNote(origin, entry, stack.width);
}

export function walkWithNotes(t: GtileWithNotes, x: number, y: number, myLane: string | undefined, out: Out): void {
  pushStack({ out, position: 'left', stackX: 0, originX: x, originY: y + t.leftOffsetY, lane: myLane }, t.left);
  pushStack(
    { out, position: 'right', stackX: t.rightOffsetX, originX: x, originY: y + t.rightOffsetY, lane: myLane },
    t.right,
  );
  walkTile(t.children[0]!, x + t.tileOffsetX, y + t.tileOffsetY, { kindHint: null, lane: myLane }, out);
}
