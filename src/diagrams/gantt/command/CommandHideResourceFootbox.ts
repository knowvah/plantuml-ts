import type { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `RegexLeaf.spaceOneOrMore()` = `[%s]+`. @see RegexLeaf.java:85-87 */
const SPACES_1 = String.raw`[\s ]+`;

/** `hide resource footbox` (`ress?ources?` accepts the French spelling). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideResourceFootbox.java:54-62 */
export const COMMAND_HIDE_RESOURCE_FOOTBOX_RE = new RegExp(`^hide${SPACES_1}ress?ources?${SPACES_1}footbox$`, 'iu');

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideResourceFootbox.java:64-68 */
export function applyCommandHideResourceFootbox(
  diagram: GanttDiagram,
  _match: RegExpExecArray,
): CommandExecutionResult {
  return diagram.hideResourceFootbox();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideResourceFootbox.java:48 */
export const CommandHideResourceFootbox = {
  regex: COMMAND_HIDE_RESOURCE_FOOTBOX_RE,
  apply: applyCommandHideResourceFootbox,
};
