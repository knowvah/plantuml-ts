import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { LINE_STYLE } from '../../../core/link-style-regex.js';
import { TaskCode } from '../core/TaskCode.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `RegexLeaf.spaceZeroOrMore()` = `[%s]*`; `%s` is `\s ` (Pattern2.java:57). @see RegexLeaf.java:73-75 */
const SPACES_0 = String.raw`[\s ]*`;

/**
 * `[task1] --[style]--> [task2]`; the bracket text is `([^\[\]]+?)`. The style bracket is
 * `CommandLinkElement.LINE_STYLE` (link-style-regex.ts:10); `>` is unescaped (a /u identity escape is a SyntaxError).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGanttArrow2.java:58-74
 */
export const COMMAND_GANTT_ARROW2_RE = new RegExp(
  String.raw`^\[(?<TASK1>[^\[\]]+?)\]` +
    SPACES_0 +
    String.raw`(-+)(?:\[(?<ARROW_STYLE>` +
    LINE_STYLE +
    String.raw`)\])?(-*)>` +
    SPACES_0 +
    String.raw`\[(?<TASK2>[^\[\]]+?)\]` +
    SPACES_0 +
    '$',
  'iu',
);

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGanttArrow2.java:76-89 */
export function applyCommandGanttArrow2(diagram: GanttDiagram, match: RegExpExecArray): CommandExecutionResult {
  const g = match.groups!;
  const name1 = g['TASK1']!;
  const name2 = g['TASK2']!;
  const task1 = diagram.getOrCreateTask(TaskCode.fromId(name1), false);
  const task2 = diagram.getOrCreateTask(TaskCode.fromId(name2), false);

  const link = diagram.forceTaskOrder(task1, task2);
  link.applyStyle(g['ARROW_STYLE']);

  return CommandExecutionResult.ok();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGanttArrow2.java:52 */
export const CommandGanttArrow2 = { regex: COMMAND_GANTT_ARROW2_RE, apply: applyCommandGanttArrow2 };
