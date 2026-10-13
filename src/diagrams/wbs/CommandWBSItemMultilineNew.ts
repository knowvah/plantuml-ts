import type { HColor } from '../../core/abel/Colors.js';
import { getWBSDirection } from '../../core/abel/Direction.js';
import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { NoSuchColorException } from '../../core/klimt/color/NoSuchColorException.js';
import { Display } from '../../core/klimt/creole/Display.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import { StringLocated } from '../../core/tim/StringLocated.js';
import type { Warning } from '../../core/warning/Warning.js';
import { fromDesc } from '../mindmap/IdeaShape.js';
import type { WBSDiagram } from './WBSDiagram.js';

/**
 * `CommandWBSItemMultilineNew` — the `+[<>_]...[#color](code):first line ...
 * last line;[<<stereotype>>]` block, shape/direction BEFORE colour/code.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/CommandWBSItemMultilineNew.java:50-117
 */

/** `Pattern2.cmpile("^(.*);\\s*(\\<\\<(.+)\\>\\>)?$")`. Shared by New and Old.
 * @see CommandWBSItemMultilineNew.java:52 */
export const WBS_MULTILINE_END_RE = /^(.*);\s*(<<(.+)>>)?$/i;

/** `[%pLN_]` — `%pLN` is `\p{L}\p{N}` (Pattern2.java:56). */
export const WBS_CODE_CHARS = String.raw`[\p{L}\p{N}_]`;

/** The `RegexOr` of shape/direction. @see CommandWBSItemMultilineNew.java:62-69 */
const SHAPE_DIRECTION = '(?:(?<SHAPE_1>_)?(?<WBS_DIRECTION_1>[<>])?|(?<WBS_DIRECTION_2>[<>])?|(?<SHAPE_2>_)?)';

/** The `RegexOr` of colour/code. @see CommandWBSItemMultilineNew.java:70-77 */
const COLOR_CODE =
  `(?:(?:\\[(?<BACKCOLOR_1>#\\w+)\\])?(?:\\((?<CODE_1>${WBS_CODE_CHARS}+)\\))?` +
  `|(?:\\((?<CODE_2>${WBS_CODE_CHARS}+)\\))?(?:\\[(?<BACKCOLOR_2>#\\w+)\\])?)`;

/** Matched against the TRIMMED first line (`lines.getFirst().getTrimmed()`, java:90).
 * @see CommandWBSItemMultilineNew.java:58-80 */
export const WBS_MULTILINE_NEW_START_RE = new RegExp(
  `^(?<TYPE>[ \\t]*[*+-]+)${SHAPE_DIRECTION}${COLOR_CODE}:(?<DATA>.*)$`,
  'iu',
);

/**
 * A collected multiline block, already cleaned the way `executeNow` does it
 * (`removeStartingAndEnding(DATA, 1)` then `overrideLastLine`).
 */
export interface WbsMultilineBlock {
  /** The trimmed first line the start pattern is re-run on. */
  readonly startLine: string;
  readonly displayLines: readonly string[];
  /** The whole `<<label>>` token (brackets included), or `undefined`. */
  readonly stereotypeToken: string | undefined;
  /** Index (in the source lines) of the terminator line. */
  readonly endIndex: number;
}

/** The members of `WBSDiagram` the item commands use. */
export type WbsItemTarget = Pick<WBSDiagram, 'getSkinParam' | 'getSmartLevel' | 'addIdeaDisplay' | 'addWarning'>;

/** `MultilinesStrategy.REMOVE_STARTING_QUOTE`: a line whose trimmed text starts with `'` is dropped.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/MultilinesStrategy.java:46-62 */
function hasStartingQuote(line: string): boolean {
  return line.trim().startsWith("'");
}

/**
 * The accumulation loop of `PSystemCommandFactory.isMultilineCommandOk` over
 * `CommandMultilines2.isValid`: with one line the answer is `OK_PARTIAL`
 * BEFORE the END probe (java:98-104), so the first line is never checked
 * against END; from the second kept line on, the END pattern is probed on
 * the trimmed (`Trim.BOTH`) last line. `undefined` when no line ends the
 * block (the command does not match).
 *
 * Jar probe (`scripts/oracle-render.sh`): `* root` / `+[#red](c):text;` /
 * `** x` gives "Syntax Error?" at line 3 — a one-line block is not complete.
 *
 * `executeNow` then builds the display: the first line is DATA, the last
 * line loses its LAST CHARACTER unconditionally (`removeStartingAndEnding
 * (DATA, 1)`, BlocLines.java:271-283), unless a stereotype is present, when
 * the last raw line is replaced by END group 1 (`overrideLastLine`,
 * CommandWBSItemMultilineNew.java:94-99). Middle lines stay raw.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandMultilines2.java:79-111
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemCommandFactory.java:268-290
 */
export function collectWbsMultilineBlock(lines: readonly string[], startIndex: number): WbsMultilineBlock | undefined {
  const startLine = (lines[startIndex] ?? '').trim();
  // DATA is everything after the start pattern's `:`; no earlier token of
  // either start grammar (type, shape, direction, colour, code) can hold one.
  const colon = startLine.indexOf(':');
  if (colon === -1) return undefined;
  const kept: string[] = [startLine.slice(colon + 1)];
  for (let i = startIndex + 1; i < lines.length; i++) {
    const raw = lines[i]!;
    if (hasStartingQuote(raw)) continue;
    kept.push(raw);
    if (WBS_MULTILINE_END_RE.exec(raw.trim()) === null) continue;
    return finishBlock(startLine, kept, i);
  }
  return undefined;
}

/** `lineLast = StringUtils.getSplit(END, lines.getLast().getString())` and the cleaning. */
function finishBlock(startLine: string, kept: string[], endIndex: number): WbsMultilineBlock {
  const last = kept[kept.length - 1]!;
  const endMatch = WBS_MULTILINE_END_RE.exec(last);
  const stereotypeToken = endMatch?.[2];
  kept[kept.length - 1] = stereotypeToken === undefined ? last.slice(0, -1) : (endMatch?.[1] ?? '');
  return { startLine, displayLines: kept, stereotypeToken, endIndex };
}

/** @see CommandWBSItemMultilineNew.java:85-116 */
export function applyWbsItemMultilineNew(diagram: WbsItemTarget, block: WbsMultilineBlock): CommandExecutionResult {
  return applyMultilineItem(diagram, block, WBS_MULTILINE_NEW_START_RE, undefined);
}

/** The body shared verbatim by `New` and `Old` (`Old` adds the warning). */
export function applyMultilineItem(
  diagram: WbsItemTarget,
  block: WbsMultilineBlock,
  startRe: RegExp,
  warning: Warning | undefined,
): CommandExecutionResult {
  const g = startRe.exec(block.startLine)?.groups;
  if (g === undefined) return CommandExecutionResult.error('Syntax Error?');
  const type = g['TYPE']!;
  const stringColor = g['BACKCOLOR_1'] ?? g['BACKCOLOR_2'];
  let backColor: HColor | undefined;
  try {
    if (stringColor !== undefined) backColor = diagram.getSkinParam().getIHtmlColorSet().getColor(stringColor);
  } catch (e) {
    // `CommandMultilines2.execute`'s `catch (NoSuchColorException e)` (java:117-121).
    if (e instanceof NoSuchColorException) return CommandExecutionResult.badColor();
    throw e;
  }
  const code = g['CODE_1'] ?? g['CODE_2'];
  const dir = getWBSDirection(type, g['WBS_DIRECTION_1'], g['WBS_DIRECTION_2']);
  const label = Display.createFoo(block.displayLines.map((line) => new StringLocated(line, undefined)));
  if (warning !== undefined) diagram.addWarning(warning);
  return diagram.addIdeaDisplay(
    code,
    diagram.getSmartLevel(type),
    {
      backColor,
      label,
      stereotype: Stereotype.build(block.stereotypeToken),
      shape: fromDesc(g['SHAPE_1'] ?? g['SHAPE_2']),
    },
    dir,
  );
}
