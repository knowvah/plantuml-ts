import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `[%s]*`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:57 */
const SPACE_ZERO_OR_MORE = '[\\s\\u00A0]*';

/**
 * `-- title --` / `--`. `RegexLeaf(2, "COMMENT", "((.+?)[%s]*--)?")` has two
 * groups and `executeArg` reads the INNER one (`arg.get("COMMENT", 1)`,
 * :64), so the named group is the inner `(.+?)`; the outer is anonymous.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandSeparator.java:54-59
 */
export const COMMAND_SEPARATOR_RE: RegExp = new RegExp(
  '^' + // RegexLeaf.start()
    '--' + // :56
    SPACE_ZERO_OR_MORE + // :57
    '(?:(?<COMMENT>.+?)' +
    SPACE_ZERO_OR_MORE +
    '--)?' + // :58
    '$', // RegexLeaf.end() :58
  'i',
);

/**
 * `addSeparator` takes the group as-is: `null` (here `undefined`) when absent
 * (journal row 57).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandSeparator.java:61-67
 */
export function applyCommandSeparator(diagram: GanttDiagram, match: RegExpExecArray): CommandExecutionResult {
  const comment = match.groups!['COMMENT'];
  diagram.addSeparator(comment);
  return CommandExecutionResult.ok();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandSeparator.java:48-69 */
export const CommandSeparator: {
  readonly regex: RegExp;
  readonly apply: (diagram: GanttDiagram, match: RegExpExecArray) => CommandExecutionResult;
} = { regex: COMMAND_SEPARATOR_RE, apply: applyCommandSeparator };
