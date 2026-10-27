import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { DayOfWeekUtils } from '../time/DayOfWeekUtils.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `[%s]+`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexLeaf.java:85-87 */
const SPACE_ONE_OR_MORE = '[\\s\\u00A0]+';

/**
 * `weeks starts on Sunday and must have at least 4 days`. The `[^0-9]*?`
 * leaves are lazy fillers. Compiled `CASE_INSENSITIVE` (`Pattern2.java:114`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandWeekNumberStrategy.java:57-70
 */
export const COMMAND_WEEK_NUMBER_STRATEGY_RE: RegExp = new RegExp(
  '^' + // RegexLeaf.start()
    'weeks?' + // :59
    SPACE_ONE_OR_MORE + // :60
    'starts?' + // :61
    '[^0-9]*?' + // :62
    SPACE_ONE_OR_MORE + // :63
    `(?<WEEKDAY>${DayOfWeekUtils.getRegexString()})` + // :64
    SPACE_ONE_OR_MORE + // :65
    '[^0-9]*?' + // :66
    '(?<NUM>[0-9]+)' + // :67
    '[^0-9]*?' + // :68
    '$', // RegexLeaf.end() :69
  'i',
);

/** `Integer.parseInt`: digits within int range, else `NumberFormatException`. */
function parseInt32(s: string): number {
  const n = Number.parseInt(s, 10);
  if (!/^[0-9]+$/.test(s) || n > 2147483647) throw new Error(`NumberFormatException: For input string: "${s}"`);
  return n;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandWeekNumberStrategy.java:71-80 */
export function applyCommandWeekNumberStrategy(diagram: GanttDiagram, match: RegExpExecArray): CommandExecutionResult {
  const g = match.groups!;
  const weekDay = DayOfWeekUtils.fromString(g['WEEKDAY']!);
  const num = g['NUM']!;
  diagram.setWeekNumberStrategy(weekDay, parseInt32(num));
  return CommandExecutionResult.ok();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandWeekNumberStrategy.java:51-82 */
export const CommandWeekNumberStrategy: {
  readonly regex: RegExp;
  readonly apply: (diagram: GanttDiagram, match: RegExpExecArray) => CommandExecutionResult;
} = { regex: COMMAND_WEEK_NUMBER_STRATEGY_RE, apply: applyCommandWeekNumberStrategy };
