import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { parseSimpleColor } from '../../core/klimt/color/HColorSet.js';
import { Display } from '../../core/klimt/creole/Display.js';
import { fromDesc } from './IdeaShape.js';
import type { MindMapDiagram } from './MindMapDiagram.js';

/**
 * `CommandMindMapOrgmode` — the single-line `*`/`#` org-mode marker form.
 * `TYPE` deliberately keeps its leading run of literal spaces/tabs (`[ \t]*`,
 * NOT the whitespace-class macro every other optional-space gap in this
 * grammar uses) — `MindMapDiagram#getSmartLevel` reads that leading
 * indentation to resolve depth, so it must reach `getSmartLevel` intact.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/CommandMindMapOrgmode.java:52-112
 */
export const ORGMODE_RE = /^([ \t]*[*#]+)(?:\[(#\w+)\])?(_)?\s*(.*)$/i;

/** @see CommandMindMapOrgmode.java:99-111 */
export function applyMindMapOrgmode(diagram: MindMapDiagram, match: RegExpExecArray): CommandExecutionResult {
  const type = match[1]!;
  const colorToken = match[2];
  const label = match[4] ?? '';

  const backColor = colorToken === undefined ? undefined : parseSimpleColor(colorToken);
  if (colorToken !== undefined && backColor === undefined) return CommandExecutionResult.badColor();

  const level = diagram.getSmartLevel(type);
  return diagram.addIdea(
    {
      backColor,
      label: Display.getWithNewlines(diagram.getPragma(), label),
      shape: fromDesc(match[3]),
      stereotype: undefined,
    },
    level,
  );
}
