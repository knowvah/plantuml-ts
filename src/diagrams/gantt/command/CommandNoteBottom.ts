import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { NoSuchColorException } from '../../../core/klimt/color/NoSuchColorException.js';
import { Display } from '../../../core/klimt/creole/Display.js';
import { Stereotype } from '../../../core/stereo/Stereotype.js';
import { StringLocated } from '../../../core/tim/StringLocated.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `[%s]*`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:57 */
const SPACE_ZERO_OR_MORE = '[\\s\\u00A0]*';
/** `%s` and `%g` inside a character class. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:57,59 */
const CLASS_S = '\\s\\u00A0';
const CLASS_G = '"\\u201c\\u201d\\uE121';

/** `Stereotag.SINGLE` = `(\$[^%s{}%g<>$]+)`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotag.java:42 */
const TAG = `\\$[^${CLASS_S}{}${CLASS_G}<>$]+`;
/** `Stereotag.pattern() + "?"` -- `TAGS` is group 0 of the leaf, the outermost group. @see Stereotag.java:44-46 */
const TAGS = `(?<TAGS>${TAG}(?:[${CLASS_S}]+${TAG})*)?`;

/**
 * `StereotypePattern.optional("STEREO")`: `[%s]*`, an optional `(<<.+?>>)`, `[%s]*`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/StereotypePattern.java:53-59,65-68
 */
const STEREOTYPE_OPTIONAL = `${SPACE_ZERO_OR_MORE}(?:(?<STEREO><<.+?>>))?${SPACE_ZERO_OR_MORE}`;

/**
 * The starting pattern, matched against the TRIMMED first line
 * (`CommandNoteBottom.java:104`). Compiled `CASE_INSENSITIVE` (`Pattern2.java:114`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandNoteBottom.java:66-75
 */
export const COMMAND_NOTE_BOTTOM_RE: RegExp = new RegExp(
  '^' + // RegexLeaf.start()
    '(?<TYPE>note)' + // :68
    SPACE_ZERO_OR_MORE + // :69
    '(?<POSITION>bottom)' + // :70
    SPACE_ZERO_OR_MORE + // :71
    TAGS + // :72
    STEREOTYPE_OPTIONAL + // :73
    '$', // RegexLeaf.end() :74
  'i',
);

/** `Pattern2.cmpile("^end[%s]*note$")`, probed on the `Trim.BOTH` last line. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandNoteBottom.java:60,63 */
export const COMMAND_NOTE_BOTTOM_END_RE: RegExp = new RegExp(`^end${SPACE_ZERO_OR_MORE}note$`, 'i');

/** A collected block: every kept line, first (`note bottom`) to last (`end note`). */
export interface CommandNoteBottomBlock {
  /** The lines after `MultilinesStrategy.REMOVE_STARTING_QUOTE`, start and end included. */
  readonly lines: readonly string[];
  /** Index (in the source lines) of the `end note` line. */
  readonly endIndex: number;
}

/** `MultilinesStrategy.hasStartingQuote`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/MultilinesStrategy.java:56-58 */
function hasStartingQuote(line: string): boolean {
  return line.trim().startsWith("'");
}

/**
 * `CommandMultilines2.isValid` accumulated line by line as
 * `PSystemCommandFactory.isMultilineCommandOk` does: quote lines are dropped
 * (`REMOVE_STARTING_QUOTE`), the first kept line must match the start
 * pattern, a block of one line is `OK_PARTIAL` BEFORE the END probe, and from
 * the second kept line on the trimmed last line is probed against END.
 * `undefined` when the start does not match or no line ends the block.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandMultilines2.java:79-111
 */
export function collectCommandNoteBottomBlock(
  lines: readonly string[],
  startIndex: number,
): CommandNoteBottomBlock | undefined {
  const first = lines[startIndex];
  if (first === undefined || hasStartingQuote(first) || !COMMAND_NOTE_BOTTOM_RE.test(first.trim())) return undefined;
  const kept: string[] = [first];
  for (let i = startIndex + 1; i < lines.length; i++) {
    const raw = lines[i]!;
    if (hasStartingQuote(raw)) continue;
    kept.push(raw);
    if (COMMAND_NOTE_BOTTOM_END_RE.test(raw.trim())) return { lines: kept, endIndex: i };
  }
  return undefined;
}

/** `firstColumnRemovable`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/BlocLines.java:250-263 */
function firstColumnRemovable(data: readonly string[]): boolean {
  let allEmpty = true;
  for (const s of data) {
    if (s.length === 0) continue;

    allEmpty = false;
    const c = s.charAt(0);
    if (c !== ' ' && c !== '\t') return false;
  }
  return allEmpty === false;
}

/** `BlocLines.removeEmptyColumns`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/BlocLines.java:234-248 */
function removeEmptyColumns(lines: readonly string[]): readonly string[] {
  if (!firstColumnRemovable(lines)) return lines;

  let copy = [...lines];
  do {
    copy = copy.map((s) => (s.length > 0 ? s.substring(1) : s));
  } while (firstColumnRemovable(copy));
  return copy;
}

/**
 * `executeNow`, wrapped by `CommandMultilines2.execute`'s
 * `catch (NoSuchColorException)` (:117-121). `explainNow` is the
 * `@Explain` build-time annotation and is not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandNoteBottom.java:99-116
 */
export function applyCommandNoteBottom(diagram: GanttDiagram, block: CommandNoteBottomBlock): CommandExecutionResult {
  try {
    const first = block.lines[0]!;
    const line0 = COMMAND_NOTE_BOTTOM_RE.exec(first.trim())!;
    const body = removeEmptyColumns(block.lines.slice(1, block.lines.length - 1)); // subExtract(1, 1) :103
    const strings = Display.createFoo(body.map((s) => new StringLocated(s, undefined)));
    if (strings.size() === 0) return CommandExecutionResult.error('No note defined');

    const stereotypeString = line0.groups!['STEREO'];
    let stereotype: Stereotype | undefined = undefined;
    if (stereotypeString !== undefined) stereotype = Stereotype.build(stereotypeString);

    return diagram.addNote(strings, stereotype);
  } catch (e) {
    if (e instanceof NoSuchColorException) return CommandExecutionResult.badColor();
    throw e;
  }
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandNoteBottom.java:58-118 */
export const CommandNoteBottom: {
  readonly start: RegExp;
  readonly end: RegExp;
  readonly collect: (lines: readonly string[], startIndex: number) => CommandNoteBottomBlock | undefined;
  readonly apply: (diagram: GanttDiagram, block: CommandNoteBottomBlock) => CommandExecutionResult;
} = {
  start: COMMAND_NOTE_BOTTOM_RE,
  end: COMMAND_NOTE_BOTTOM_END_RE,
  collect: collectCommandNoteBottomBlock,
  apply: applyCommandNoteBottom,
};
