import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { lazzyValueOf } from '../../core/abel/Direction.js';
import type { MindMapDiagram } from './MindMapDiagram.js';

/**
 * `CommandMindMapDirection` — `... left|right|top|bottom ... side|direction
 * ...` (e.g. `left side`, `top direction`), setting the DEFAULT placement
 * every subsequent node without an explicit `-`/`+`-run direction inherits.
 * Deliberately loose (`[^*#]*` padding on every side): it must NOT match a
 * `*`/`#`-prefixed node line, which is the only thing it excludes.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/CommandMindMapDirection.java:49-83
 */
export const MINDMAP_DIRECTION_RE = /^[^*#]*\b(left|right|top|bottom)\b[^*#]*(?:side|direction)[^*#]*$/i;

/** @see CommandMindMapDirection.java:76-81 */
export function applyMindMapDirection(diagram: MindMapDiagram, match: RegExpExecArray): CommandExecutionResult {
  const direction = lazzyValueOf(match[1]!);
  diagram.setDefaultDirection(direction);
  return CommandExecutionResult.ok();
}
