import type { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `RegexLeaf.spaceZeroOrMore()` = `[%s]*`; `%s` is `\s ` (Pattern2.java:57). @see RegexLeaf.java:73-75 */
const SPACES_0 = String.raw`[\s ]*`;

/** `end group` with optional spaces around and between. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGroupEnd.java:54-62 */
export const COMMAND_GROUP_END_RE = new RegExp(`^${SPACES_0}end${SPACES_0}group${SPACES_0}$`, 'iu');

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGroupEnd.java:64-68 */
export function applyCommandGroupEnd(diagram: GanttDiagram, _match: RegExpExecArray): CommandExecutionResult {
  return diagram.endGroup();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGroupEnd.java:48 */
export const CommandGroupEnd = { regex: COMMAND_GROUP_END_RE, apply: applyCommandGroupEnd };
