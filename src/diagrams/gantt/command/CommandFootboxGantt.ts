import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/**
 * `CommandFootbox.HIDE_SHOW_FOOTBOX`, inlined (engines may not import each other): `TYPE` `(hide|show)?`,
 * `[%s]*`, `footbox`. `%s` is `\s\u00A0` (Pattern2.java:57).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandFootbox.java:51-54
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandFootboxGantt.java:47 (the HAXE marker there is ignored, not MIT)
 */
export const COMMAND_FOOTBOX_GANTT_RE = new RegExp(String.raw`^(?<TYPE>hide|show)?[\s\u00A0]*footbox$`, 'iu');

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandFootboxGantt.java:53-59; `TYPE` is null for a bare `footbox` (the group is optional) and Java's
 * `arg.get("TYPE", 0).equalsIgnoreCase` then throws NullPointerException -- here a TypeError, likewise. */
export function applyCommandFootboxGantt(diagram: GanttDiagram, match: RegExpExecArray): CommandExecutionResult {
  const footbox = match.groups!['TYPE']!.toLowerCase() === 'show';
  diagram.setShowFootbox(footbox);
  return CommandExecutionResult.ok();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandFootboxGantt.java:46 */
export const CommandFootboxGantt = { regex: COMMAND_FOOTBOX_GANTT_RE, apply: applyCommandFootboxGantt };
