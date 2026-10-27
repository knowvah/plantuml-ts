import type { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `RegexLeaf.spaceOneOrMore()` = `[%s]+`. @see RegexLeaf.java:85-87 */
const SPACES_1 = String.raw`[\s ]+`;

/** `hide resource name` (`ress?ources?` accepts the French spelling). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideResourceName.java:54-62 */
export const COMMAND_HIDE_RESOURCE_NAME_RE = new RegExp(`^hide${SPACES_1}ress?ources?${SPACES_1}names?$`, 'iu');

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideResourceName.java:64-68 */
export function applyCommandHideResourceName(diagram: GanttDiagram, _match: RegExpExecArray): CommandExecutionResult {
  return diagram.hideResourceName();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideResourceName.java:48 */
export const CommandHideResourceName = { regex: COMMAND_HIDE_RESOURCE_NAME_RE, apply: applyCommandHideResourceName };
