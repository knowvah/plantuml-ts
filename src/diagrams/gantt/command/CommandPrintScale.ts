import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { PrintScale } from '../core/PrintScale.js';
import { WeeklyHeaderStrategy } from '../draw/WeeklyHeaderStrategy.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `[%s]+`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexLeaf.java:85-87 */
const SPACE_ONE_OR_MORE = '[\\s\\u00A0]+';
/** Java's `\\s` (no `UNICODE_CHARACTER_CLASS`) is ASCII: `[ \\t\\n\\x0B\\f\\r]`. */
const JAVA_S = '[ \\t\\n\\x0B\\f\\r]';

/**
 * `printscale weekly with calendar date zoom 2`. The `RegexOr` of the three
 * keywords has no name (non-capturing); `SCALE` and `OPTION` are the named
 * `RegexOr`s, so each captures the whole alternative text. Compiled
 * `CASE_INSENSITIVE` (`Pattern2.java:114`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintScale.java:58-81
 */
export const COMMAND_PRINT_SCALE_RE: RegExp = new RegExp(
  '^' + // RegexLeaf.start()
    '(?:projectscale|ganttscale|printscale)' + // :60-62
    SPACE_ONE_OR_MORE + // :63
    '(?<SCALE>yearly|quarterly|monthly|daily|weekly)' + // :64-69
    '(?:' + // RegexOptional(RegexConcat( :70
    SPACE_ONE_OR_MORE + // :71
    '(?<OPTION>' + // RegexOr("OPTION", :72
    `(?:with${JAVA_S}+calendar${JAVA_S}+date)` + // :73
    '|' +
    `(?:with${JAVA_S}+week${JAVA_S}+numbering${JAVA_S}+from${JAVA_S}+(?<NUMBER>-?\\d+))` + // :74
    ')' +
    ')?' +
    '(?:' + // RegexOptional(RegexConcat( :75
    SPACE_ONE_OR_MORE + // :76
    'zoom' + // :77
    SPACE_ONE_OR_MORE + // :78
    '(?<ZOOM>[.\\d]+)' + // :79
    ')?' +
    '$', // RegexLeaf.end() :80
  'i',
);

/** `Integer.parseInt`: optional sign then digits within int range, else `NumberFormatException`. */
function parseInt32(s: string): number {
  const n = Number.parseInt(s, 10);
  if (!/^[+-]?[0-9]+$/.test(s) || n > 2147483647 || n < -2147483648)
    throw new Error(`NumberFormatException: For input string: "${s}"`);
  return n;
}

/** `Double.parseDouble` over `[.\d]+`: digits with at most one dot and at least one digit, else `NumberFormatException`. */
function parseDouble(s: string): number {
  if (!/^(?:[0-9]+\.?[0-9]*|\.[0-9]+)$/.test(s)) throw new Error(`NumberFormatException: For input string: "${s}"`);
  return Number.parseFloat(s);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintScale.java:83-104 */
export function applyCommandPrintScale(diagram: GanttDiagram, match: RegExpExecArray): CommandExecutionResult {
  const g = match.groups!;
  const scaleString = g['SCALE']!;
  const scale = PrintScale.fromString(scaleString);
  diagram.setPrintScale(scale);

  const zoom = g['ZOOM'];
  if (zoom !== undefined) diagram.setFactorScale(parseDouble(zoom));

  const option = g['OPTION'];
  if (option !== undefined)
    if (option.includes('date')) diagram.setWeeklyHeaderStrategy(WeeklyHeaderStrategy.DAY_OF_MONTH, 0);
    else if (option.includes('numbering')) {
      const number = g['NUMBER']!;
      const weekStartingNumber = parseInt32(number);
      diagram.setWeeklyHeaderStrategy(WeeklyHeaderStrategy.FROM_N, weekStartingNumber);
    }
  return CommandExecutionResult.ok();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintScale.java:52-106 */
export const CommandPrintScale: {
  readonly regex: RegExp;
  readonly apply: (diagram: GanttDiagram, match: RegExpExecArray) => CommandExecutionResult;
} = { regex: COMMAND_PRINT_SCALE_RE, apply: applyCommandPrintScale };
