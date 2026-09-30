import type { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { Display } from '../../core/klimt/creole/Display.js';
import { trin } from '../../core/style/parser/StyleParser.js';
import { IdeaShape } from './IdeaShape.js';
import type { MindMapDiagram } from './MindMapDiagram.js';

/**
 * `CommandMindMapRoot` — the explicit `0 <label>` root form: always level 0,
 * always a boxed shape, no background color, and (unlike every other
 * mindmap command) direction forced to `true` rather than
 * `diagram.defaultDirection` — matching upstream's literal 5th argument.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/CommandMindMapRoot.java:49-80
 */
export const ROOT_RE = /^(0)\s*(.*)$/i;

/**
 * `CommandMindMapRoot` is `super(getRegexConcat())` -- `doTrim = true`
 * (CommandMindMapRoot.java:52, SingleLineCommand2.java:55-57), so upstream
 * matches the `StringUtils.trin`-ed line (`SingleLineCommand2#myTrim2`,
 * java:74-79). The dispatcher matches the raw line; `TYPE` is anchored at
 * `^`, so trimming the label is the same as matching the trimmed line: the
 * trailing whitespace the preprocessor now keeps (T6i) never reaches it.
 * @see CommandMindMapRoot.java:75-78
 */
export function applyMindMapRoot(diagram: MindMapDiagram, match: RegExpExecArray): CommandExecutionResult {
  const label = trin(match[2] ?? '');
  return diagram.addIdea(
    {
      backColor: undefined,
      label: Display.getWithNewlines(diagram.getPragma(), label),
      shape: IdeaShape.BOX,
      stereotype: undefined,
    },
    0,
    true,
  );
}
