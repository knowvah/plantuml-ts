import type { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { TaskCode } from '../core/TaskCode.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `RegexLeaf.spaceZeroOrMore()` = `[%s]*`; `%s` is `\s ` (Pattern2.java:57). @see RegexLeaf.java:73-75 */
const SPACES_0 = String.raw`[\s ]*`;
/** `RegexLeaf.spaceOneOrMore()` = `[%s]+`. @see RegexLeaf.java:85-87 */
const SPACES_1 = String.raw`[\s ]+`;

/** `group [name]`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGroupStart.java:55-64 */
export const COMMAND_GROUP_START_RE = new RegExp(`^group${SPACES_1}\\[(?<NAME>[^\\[\\]]+)\\]${SPACES_0}$`, 'iu');

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGroupStart.java:66-71 */
export function applyCommandGroupStart(diagram: GanttDiagram, match: RegExpExecArray): CommandExecutionResult {
  const name = match.groups!['NAME']!;
  return diagram.addGroup(TaskCode.fromId(name));
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGroupStart.java:49 */
export const CommandGroupStart = { regex: COMMAND_GROUP_START_RE, apply: applyCommandGroupStart };
