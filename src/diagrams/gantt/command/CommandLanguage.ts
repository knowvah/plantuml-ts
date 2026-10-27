import type { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `[%s]+`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexLeaf.java:85-87 */
const SPACE_ONE_OR_MORE = '[\\s\\u00A0]+';

/**
 * `language de`. Compiled `CASE_INSENSITIVE` (`Pattern2.java:114`), so
 * `Language JA` matches and `changeLanguage` lower-cases it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandLanguage.java:54-60
 */
export const COMMAND_LANGUAGE_RE: RegExp = new RegExp(
  '^' + // RegexLeaf.start()
    'language' + // :56
    SPACE_ONE_OR_MORE + // :57
    '(?<LANG>\\w+)' + // :58
    '$', // RegexLeaf.end() :59
  'i',
);

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandLanguage.java:62-66 */
export function applyCommandLanguage(diagram: GanttDiagram, match: RegExpExecArray): CommandExecutionResult {
  return diagram.changeLanguage(match.groups!['LANG']!);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandLanguage.java:48-68 */
export const CommandLanguage: {
  readonly regex: RegExp;
  readonly apply: (diagram: GanttDiagram, match: RegExpExecArray) => CommandExecutionResult;
} = { regex: COMMAND_LANGUAGE_RE, apply: applyCommandLanguage };
