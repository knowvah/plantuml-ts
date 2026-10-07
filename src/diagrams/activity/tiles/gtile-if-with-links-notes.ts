/**
 * `FtileIfWithDiamonds`'s own constructor (`:79-111`): processes AT MOST
 * one LEFT and one RIGHT note from the if's own `notes` (any further note
 * on an already-filled side is silently dropped -- `if (opaleLeft !=
 * EMPTY) continue;`/`:85-86,96-97`), in ENCOUNTER order (the Java
 * `Collection<PositionedNote>` is append-ordered, `WithNote.java:49`), each
 * reading `getTranslateDiamond1().getDx()` (`:88,100-101`) recomputed
 * AFTER any prior note already changed `xDeltaNote` -- `computeNudeAndMerge`
 * (`gtile-if-with-links.ts`) is this port's own re-derivation of that same
 * quantity (`geoTotal.left - diamondLeft`), called fresh per note the same
 * way the Java clears its memoized dimension
 * (`clearCacheDimensionInternal()`, `:108`) after each one. A note at any
 * OTHER position (`TOP`/`BOTTOM`/`OVER`) is silently ignored by the Java's
 * own `if/else-if` (`:83-107`, no further `else`) -- moot here, since
 * `ActivityNote.position` (`ast.ts:366`) is typed `'left' | 'right'` only;
 * activity's own note grammar never parses the other `NotePosition` values
 * (`CommandNote3.java:123`/`CommandNoteLong3.java:120` both call
 * `NotePosition.defaultLeft`, never a TOP/BOTTOM/OVER literal).
 *
 * Split into its own module (not inlined in `gtile-if-with-links.ts`) purely
 * for that file's 500-line cap -- the two modules share a safe circular
 * import (this file calls back into that one's `computeNudeAndMerge`; that
 * file's `create()` calls this one's {@link computeIfOwnNoteGeometry}),
 * fine the same way every other walker/tile-module pair in this directory
 * already documents: both sides are function DEFINITIONS, neither calls
 * the other until a real layout runs.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithDiamonds.java:79-111
 */

import { SOUTH_HOOK } from './points.js';
import type { GtileDiamondInside } from './gtile-diamond-inside.js';
import type { IfOwnNote } from './gtile-note.js';
import type { BranchGeo, IfLinksFlags } from './gtile-if-with-links.js';
import { computeNudeAndMerge } from './gtile-if-with-links.js';

export interface IfOwnNoteGeometry {
  readonly opaleLeft: IfOwnNote | null;
  readonly opaleRight: IfOwnNote | null;
  readonly xDeltaNote: number;
  readonly yDeltaNote: number;
  readonly suppWidthNode: number;
}

/** The four geometry inputs {@link applyLeftNote}/{@link applyRightNote}
 *  both need, bundled so adding the per-note accumulator does not push
 *  either past the file's 5-parameter limit. */
interface NoteGeomInputs {
  readonly diamond1: GtileDiamondInside;
  readonly b1: BranchGeo;
  readonly b2: BranchGeo;
  readonly baseFlags: IfLinksFlags;
}

/** `opaleLeft` arm (`:84-94`): `pos1 = getTranslateDiamond1().dx` (here,
 *  `computeNudeAndMerge`'s own `geoTotal.left - diamondLeft`, re-derived
 *  with the CURRENT (pre-this-note) `xDeltaNote`/`suppWidthNode`); `xDeltaNote
 *  = opaleWidth > pos1 ? opaleWidth - pos1 : xDeltaNote` (unchanged when the
 *  note does not overhang); `yDeltaNote = max(yDeltaNote, opaleHeight)`
 *  unconditionally. A second LEFT note (`opaleLeft` already set) is a no-op,
 *  matching `:85-86`'s `continue`. */
function applyLeftNote(acc: IfOwnNoteGeometry, note: IfOwnNote, inputs: NoteGeomInputs): IfOwnNoteGeometry {
  if (acc.opaleLeft !== null) return acc;
  const diamondLeft = inputs.diamond1.getCoord(SOUTH_HOOK).x;
  const trial: IfLinksFlags = { ...inputs.baseFlags, xDeltaNote: acc.xDeltaNote, yDeltaNote: 0, suppWidthNode: acc.suppWidthNode };
  const diamond1X = computeNudeAndMerge(inputs.diamond1, inputs.b1, inputs.b2, trial).geoTotal.left - diamondLeft;
  const xDeltaNote = note.box.width > diamond1X ? note.box.width - diamond1X : acc.xDeltaNote;
  return { ...acc, opaleLeft: note, xDeltaNote, yDeltaNote: Math.max(acc.yDeltaNote, note.box.height) };
}

/** `opaleRight` arm (`:95-107`): `pos1 = getTranslateDiamond1().dx +
 *  diamond1.width + opaleWidth`; `pos2 =
 *  calculateDimensionInternalSlow().width` (here, the SAME probe's own
 *  `geoTotal.width`, taken at the SAME CURRENT state -- `suppWidthNode` is
 *  not yet applied for THIS note, matching the Java's own `continue`-free
 *  read-before-write order); `suppWidthNode = pos1 > pos2 ? pos1 - pos2 :
 *  suppWidthNode`. A second RIGHT note is a no-op, matching `:96-97`'s
 *  `continue`. */
function applyRightNote(acc: IfOwnNoteGeometry, note: IfOwnNote, inputs: NoteGeomInputs): IfOwnNoteGeometry {
  if (acc.opaleRight !== null) return acc;
  const diamondLeft = inputs.diamond1.getCoord(SOUTH_HOOK).x;
  const trial: IfLinksFlags = { ...inputs.baseFlags, xDeltaNote: acc.xDeltaNote, yDeltaNote: 0, suppWidthNode: acc.suppWidthNode };
  const { geoTotal } = computeNudeAndMerge(inputs.diamond1, inputs.b1, inputs.b2, trial);
  const diamond1X = geoTotal.left - diamondLeft;
  const pos1 = diamond1X + inputs.diamond1.width + note.box.width;
  const suppWidthNode = pos1 > geoTotal.width ? pos1 - geoTotal.width : acc.suppWidthNode;
  return { ...acc, opaleRight: note, suppWidthNode, yDeltaNote: Math.max(acc.yDeltaNote, note.box.height) };
}

export function computeIfOwnNoteGeometry(
  notes: readonly IfOwnNote[],
  diamond1: GtileDiamondInside,
  b1: BranchGeo,
  b2: BranchGeo,
  baseFlags: IfLinksFlags,
): IfOwnNoteGeometry {
  const inputs: NoteGeomInputs = { diamond1, b1, b2, baseFlags };
  let acc: IfOwnNoteGeometry = { opaleLeft: null, opaleRight: null, xDeltaNote: 0, yDeltaNote: 0, suppWidthNode: 0 };
  for (const note of notes) {
    acc = note.position === 'left' ? applyLeftNote(acc, note, inputs) : applyRightNote(acc, note, inputs);
  }
  return acc;
}
