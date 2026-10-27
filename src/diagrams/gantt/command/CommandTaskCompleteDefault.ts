import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `[%s]+`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexLeaf.java:85-87 */
const SPACE_ONE_OR_MORE = '[\\s\\u00A0]+';
/** `%s` inside a leaf. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:57 */
const SPACE_CLASS = '[\\s\\u00A0]';

/**
 * `task default completion to 50`; the trailing `.*` leaf (:67) takes the rest
 * of the line (`Task completion default to 0%`). Compiled `CASE_INSENSITIVE`
 * (`Pattern2.java:114`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandTaskCompleteDefault.java:56-69
 */
export const COMMAND_TASK_COMPLETE_DEFAULT_RE: RegExp = new RegExp(
  '^' + // RegexLeaf.start()
    'task' + // :58
    SPACE_ONE_OR_MORE + // :59
    `(?:default${SPACE_CLASS}+completion|completion${SPACE_CLASS}+default)` + // RegexOr :60-62
    SPACE_ONE_OR_MORE + // :63
    'to' + // :64
    SPACE_ONE_OR_MORE + // :65
    '(?<VALUE>\\d+)' + // :66
    '.*' + // :67
    '$', // RegexLeaf.end() :68
  'i',
);

/** `Integer.parseInt`: digits within int range, else `NumberFormatException`. */
function parseInt32(s: string): number {
  const n = Number.parseInt(s, 10);
  if (!/^[0-9]+$/.test(s) || n > 2147483647) throw new Error(`NumberFormatException: For input string: "${s}"`);
  return n;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandTaskCompleteDefault.java:71-82 */
export function applyCommandTaskCompleteDefault(diagram: GanttDiagram, match: RegExpExecArray): CommandExecutionResult {
  const value = parseInt32(match.groups!['VALUE']!);
  if (value > 100) return CommandExecutionResult.error('Completetion must between 0 and 100');

  diagram.setTaskDefaultCompletion(value);

  return CommandExecutionResult.ok();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandTaskCompleteDefault.java:50-84 */
export const CommandTaskCompleteDefault: {
  readonly regex: RegExp;
  readonly apply: (diagram: GanttDiagram, match: RegExpExecArray) => CommandExecutionResult;
} = { regex: COMMAND_TASK_COMPLETE_DEFAULT_RE, apply: applyCommandTaskCompleteDefault };
