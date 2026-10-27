import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { NoSuchColorException } from '../../../core/klimt/color/NoSuchColorException.js';
import { CenterBorderColor } from '../lang/CenterBorderColor.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `RegexLeaf.spaceZeroOrMore()` = `[%s]*`; `%s` is `\s\u00A0` (Pattern2.java:57). @see RegexLeaf.java:73-75 */
const SPACES_0 = String.raw`[\s\u00A0]*`;
/** `RegexLeaf.spaceOneOrMore()` = `[%s]+`. @see RegexLeaf.java:85-87 */
const SPACES_1 = String.raw`[\s\u00A0]+`;

/**
 * `[code] #color[/#color]`; `RegexLeaf.start()` / `end()` are `^` / `$` (RegexLeaf.java:51-52); `%pLN` is
 * `\p{L}\p{N}` (Pattern2.java:53). `COLORS` group 0 / 1 are `COLORS0` / `COLORS1`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandColorTask.java:58-65
 */
export const COMMAND_COLOR_TASK_RE = new RegExp(
  String.raw`^\[(?<CODE>[\p{L}\p{N}_.]+)\]` +
    SPACES_1 +
    String.raw`#(?<COLORS0>\w+)(?:/(?<COLORS1>#?\w+))?` +
    SPACES_0 +
    '$',
  'iu',
);

/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandColorTask.java:67-84 (`SingleLineCommand2`'s `catch (NoSuchColorException)`, java:174-178,
 * answers `CommandExecutionResult.badColor()`, as `CommandWBSLink` does).
 */
export function applyCommandColorTask(diagram: GanttDiagram, match: RegExpExecArray): CommandExecutionResult {
  const g = match.groups!;
  const code = g['CODE']!;
  const task = diagram.getExistingTask(code);
  if (task === undefined) return CommandExecutionResult.error('No such task ' + code);

  const color1 = g['COLORS0'];
  const color2 = g['COLORS1'];
  try {
    const col1 = color1 === undefined ? undefined : diagram.getIHtmlColorSet().getColor(color1);
    const col2 = color2 === undefined ? undefined : diagram.getIHtmlColorSet().getColor(color2);
    task.setColors(new CenterBorderColor(col1, col2));
  } catch (e) {
    if (e instanceof NoSuchColorException) return CommandExecutionResult.badColor();
    throw e;
  }

  return CommandExecutionResult.ok();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandColorTask.java:52 */
export const CommandColorTask = { regex: COMMAND_COLOR_TASK_RE, apply: applyCommandColorTask };
