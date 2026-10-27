import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `RegexLeaf.spaceOneOrMore()` = `[%s]+`. @see RegexLeaf.java:85-87 */
const SPACES_1 = String.raw`[\s ]+`;

/** `hide closed` (no trailing-space leaf before `$`). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideClosed.java:54-60 */
export const COMMAND_HIDE_CLOSED_RE = new RegExp(`^hide${SPACES_1}closed$`, 'iu');

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideClosed.java:62-67 */
export function applyCommandHideClosed(diagram: GanttDiagram, _match: RegExpExecArray): CommandExecutionResult {
  diagram.setHideClosed(true);
  return CommandExecutionResult.ok();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideClosed.java:48 */
export const CommandHideClosed = { regex: COMMAND_HIDE_CLOSED_RE, apply: applyCommandHideClosed };
