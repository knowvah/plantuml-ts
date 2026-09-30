import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import type { HColor } from '../../core/abel/Colors.js';
import { NoSuchColorException } from '../../core/klimt/color/NoSuchColorException.js';
import { Display } from '../../core/klimt/creole/Display.js';
import { fromDesc } from './IdeaShape.js';
import type { MindMapDiagram } from './MindMapDiagram.js';

/**
 * `CommandMindMapPlus` — the `+`/`-` run-length form: depth is the marker
 * count minus one, direction is right (`+`) unless ANY `-` appears in the
 * run (`type.contains("-")`, not "starts with"). `[#color]` and the boxless
 * `_` marker are both optional, in that order.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/CommandMindMapPlus.java:52-106
 */
export const PLUS_RE = /^([+-]+)(?:\[(#\w+)\])?(_)?\s*(.*)$/i;

/** @see CommandMindMapPlus.java:91-104 */
export function applyMindMapPlus(diagram: MindMapDiagram, match: RegExpExecArray): CommandExecutionResult {
  const type = match[1]!;
  const colorToken = match[2];
  const label = match[4] ?? '';

  let backColor: HColor | undefined;
  try {
    if (colorToken !== undefined) backColor = diagram.getSkinParam().getIHtmlColorSet().getColor(colorToken);
  } catch (e) {
    // The command's own `catch (NoSuchColorException e) { return badColor(); }` (SingleLineCommand2.java:174-178).
    if (e instanceof NoSuchColorException) return CommandExecutionResult.badColor();
    throw e;
  }

  const direction = !type.includes('-');
  return diagram.addIdea(
    {
      backColor,
      label: Display.getWithNewlines(diagram.getPragma(), label),
      shape: fromDesc(match[3]),
      stereotype: undefined,
    },
    type.length - 1,
    direction,
  );
}
