import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { LINE_STYLE } from '../../../core/link-style-regex.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `RegexLeaf.spaceZeroOrMore()` = `[%s]*`; `%s` is `\s ` (Pattern2.java:57). @see RegexLeaf.java:73-75 */
const SPACES_0 = String.raw`[\s ]*`;

/** Code characters: `([%pLN_.]+)`; `%pLN` is `\p{L}\p{N}` (Pattern2.java:53). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGanttArrow.java:59,64 */
const CODE = String.raw`[\p{L}\p{N}_.]+`;

/**
 * `code1 --[style]--> code2`; the style bracket is `CommandLinkElement.LINE_STYLE`
 * (`LINE_STYLE`, link-style-regex.ts:10). `>` is written unescaped (an identity escape is a SyntaxError under /u).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGanttArrow.java:57-69
 */
export const COMMAND_GANTT_ARROW_RE = new RegExp(
  `^(?<CODE1>${CODE})${SPACES_0}(-+)(?:\\[(?<ARROW_STYLE>${LINE_STYLE})\\])?(-*)>${SPACES_0}(?<CODE2>${CODE})${SPACES_0}$`,
  'iu',
);

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGanttArrow.java:71-90 */
export function applyCommandGanttArrow(diagram: GanttDiagram, match: RegExpExecArray): CommandExecutionResult {
  const g = match.groups!;
  const code1 = g['CODE1']!;
  const code2 = g['CODE2']!;
  const task1 = diagram.getExistingTask(code1);
  if (task1 === undefined) return CommandExecutionResult.error('No such task ' + code1);

  const task2 = diagram.getExistingTask(code2);
  if (task2 === undefined) return CommandExecutionResult.error('No such task ' + code2);

  const link = diagram.forceTaskOrder(task1, task2);
  link.applyStyle(g['ARROW_STYLE']);

  return CommandExecutionResult.ok();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGanttArrow.java:51 */
export const CommandGanttArrow = { regex: COMMAND_GANTT_ARROW_RE, apply: applyCommandGanttArrow };
