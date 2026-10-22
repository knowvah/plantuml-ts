/**
 * Note event of the sequence AST. Split out of `ast.ts` (pure move, mission
 * sdd2 T0d); `ast.ts` re-exports every name here, so no import site changed.
 *
 * @see sequencediagram/Note.java:49
 * @see sequencediagram/NoteStyle.java:42
 */

import type { StyleBuilder } from '../../core/style/StyleBuilder.js';

/** The non-default note components: `rect` = `NOTE_BOX`, `hexagon` =
 *  `NOTE_HEXAGONAL` (`NoteStyle.java:57-65`). */
export type NoteShape = 'rect' | 'hexagon';

export interface NoteEvent {
  kind: 'note';
  position: 'left' | 'right' | 'over';
  participants: string[];
  text: string;
  color?: string;
  /**
   * The component `NoteStyle#getNoteComponentType` picks
   * (`NoteStyle.java:57-65`): `rnote` (BOX) is `ComponentRoseNoteBox`, a
   * rounded `URectangle`; `hnote` (HEXAGONAL) is
   * `ComponentRoseNoteHexagonal`, a 7-point `UPolygon`. Absent for a plain
   * `note` (NORMAL, the Opale shape).
   */
  shape?: NoteShape;
  /** The note keyword as written. `NoteStyle.getNoteStyle` maps `hnote` to
   *  HEXAGONAL, `rnote` to BOX and anything else to NORMAL
   *  (`NoteStyle.java:46-54`); the keyword is kept rather than the resolved
   *  enum so the style-signature lookup (`:70-78`) can be driven from it.
   *  Distinct from {@link NoteEvent.shape}, which is what this port DRAWS. */
  style?: 'note' | 'hnote' | 'rnote';
  /** The leading `/` VMERGE marker (`FactorySequenceNoteCommand.java:79,96`)
   *  — upstream's `tryMerge` argument to `diagram.addNote(note, tryMerge)`
   *  (`:230,252`): merge this note vertically with the previous one. */
  vmerge?: boolean;
  /** The note was written straight after a message (`note left|right|top|
   *  bottom`, no `of X`): upstream's `Message#getNoteOnMessages`, drawn by the
   *  `CommunicationTileNote*` wrappers (`teoz/TileBuilder.java:121-137`) rather
   *  than by `NoteTile`. */
  onMessage?: true;
  /** The `&` PARALLEL marker (`FactorySequenceNoteCommand.java:231,249-251`,
   *  `note.goParallel()`). Stored, not drawn — see
   *  {@link AbstractMessageEvent}'s doc comment and D4. */
  parallel?: boolean;
  /** The `<<...>>` run as written, guillemets included — upstream's
   *  `STEREO` group, `note.setStereotype(...)` at
   *  `FactorySequenceNoteCommand.java:234-241`. */
  stereotype?: string;
  /** The builder current at the note's OPENING line — a multi-line note
   *  executes there (`FactorySequenceNoteCommand.java:233`,
   *  `FactorySequenceNoteOverSeveralCommand.java:238`,
   *  `FactorySequenceNoteAcrossCommand.java:216`,
   *  `FactorySequenceNoteOnArrowCommand.java:226`); merged at use time
   *  (`Note.java:71-79`). sdd1 D2. */
  /** The header's `[[url]]`, resolved (`Note#setUrl`,
   *  `FactorySequenceNoteCommand.java:244-247`; `Note.java:149`). Parsed and
   *  stored, never drawn: teoz reads only `Participant#getUrl`
   *  (`teoz/LivingSpace.java:207-209`), no note or note-tile code calls
   *  `startUrl`. */
  url?: string;
  readonly styleBuilder: StyleBuilder;
}
