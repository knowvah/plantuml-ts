/**
 * The two note line-shapes of `node-dispatch.ts`'s dispatch chain
 * (`CommandNote3`/`CommandNoteLong3`), moved verbatim into a sibling
 * module when add4-T1c's colour capture would have taken that file past
 * the 500-line cap (mission convention: a sibling module when a file
 * would cross the hook). `node-dispatch.ts#HANDLERS` still owns their
 * position in the priority order.
 *
 * add4-T1c: both commands register `ColorParser.simpleColor(ColorType
 * .BACK)` (`CommandNote3.java:65-67`, `CommandNoteLong3.java:72-73`) and
 * hand the parsed `Colors` to `ActivityDiagram3#addNote`
 * (`CommandNote3.java:122-133`); {@link ActivityNote.color} carries it,
 * raw with its own `#`, the same shape `ActivityAction.color` does.
 */

import type { ActivityNote } from './ast.js';
import {
  RE_NOTE_END,
  RE_NOTE_MULTI,
  RE_NOTE_SINGLE,
  defaultLeftPosition,
  swimlaneSpread,
  type DispatchResult,
  type ParseContext,
} from './dispatch-support.js';
import { unescapeLabelNewlines } from './if-dispatch.js';

/** The note's own `#color` group, spread only when present (an absent
 *  colour omits the field, never `color: undefined`). */
function noteColorSpread(color: string | undefined): { color?: string } {
  return color === undefined ? {} : { color };
}

/** `NoteType.defaultType` (`sequencediagram/NoteType.java:43-48`): the `floating`
 *  keyword (group 1) makes a `FLOATING_NOTE`, whose Opale is drawn with no
 *  link (`FtileWithNoteOpale.java:132-133`, `withLink = false`). */
function noteFloatingSpread(floating: string | undefined): { floating?: true } {
  return floating === undefined ? {} : { floating: true };
}

/** `(floating )?note (left|right)? (#color)? : text` (single-line); group
 *  3 is the colour, group 4 the text. add3-T3d exception (NOTE-CREOLE):
 *  `CommandNote3.java:122`'s `Display.getWithNewlines` unescapes `\n` same
 *  as {@link unescapeLabelNewlines} already does for if/fork/repeat. */
export function tryNoteSingle(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const noteSingleMatch = RE_NOTE_SINGLE.exec(line);
  if (noteSingleMatch === null) return null;
  const direction = noteSingleMatch[2]?.toLowerCase();
  const position = defaultLeftPosition(direction);
  const node: ActivityNote = {
    kind: 'note',
    text: unescapeLabelNewlines(noteSingleMatch[4]!.trim()),
    position,
    ...noteColorSpread(noteSingleMatch[3]),
    ...noteFloatingSpread(noteSingleMatch[1]),
    ...swimlaneSpread(ctx),
  };
  return { idx: idx + 1, node };
}

/** `(floating )?note (left|right)? (#color)?` (multi-line, ends with
 *  {@link RE_NOTE_END}'s `end note`/`endnote`). Group 1 is `floating`
 *  (`FLOATING_NOTE`), group 2 is direction, group 3 the colour. */
export function tryNoteMulti(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const noteMultiMatch = RE_NOTE_MULTI.exec(line);
  if (noteMultiMatch === null) return null;
  const { lines } = ctx;
  const direction = noteMultiMatch[2]?.toLowerCase();
  const position = defaultLeftPosition(direction);
  let cursor = idx + 1;
  const textLines: string[] = [];
  while (cursor < lines.length) {
    const inner = lines[cursor]!.trim();
    if (RE_NOTE_END.test(inner)) {
      cursor++;
      break;
    }
    if (inner !== '') textLines.push(inner);
    cursor++;
  }
  const node: ActivityNote = {
    kind: 'note',
    text: textLines.join('\n'),
    position,
    ...noteColorSpread(noteMultiMatch[3]),
    ...noteFloatingSpread(noteMultiMatch[1]),
    ...swimlaneSpread(ctx),
  };
  return { idx: cursor, node };
}
