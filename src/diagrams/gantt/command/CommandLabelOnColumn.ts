import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { Warning } from '../../../core/warning/Warning.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/** `[%s]*` -- `%s` is `\s\u00A0`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:57 */
const SPACE_ZERO_OR_MORE = '[\\s\\u00A0]*';
/** `[%s]+`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexLeaf.java:85-87 */
const SPACE_ONE_OR_MORE = '[\\s\\u00A0]+';

/**
 * `labels on first column and right aligned`: each `RegexLeaf` in order, the
 * `RegexOptional(RegexConcat)` as an optional non-capturing group, compiled
 * `CASE_INSENSITIVE` (`Pattern2.java:114`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandLabelOnColumn.java:56-74
 */
export const COMMAND_LABEL_ON_COLUMN_RE: RegExp = new RegExp(
  '^' + // RegexLeaf.start()
    'labels?' + // :58
    SPACE_ONE_OR_MORE + // :59
    'on' + // :60
    SPACE_ZERO_OR_MORE + // :61
    '(?<POSITION>first|last)' + // :62
    SPACE_ZERO_OR_MORE + // :63
    'column' + // :64
    '(?:' + // RegexOptional(RegexConcat( :65
    SPACE_ZERO_OR_MORE + // :66
    'and' + // :67
    SPACE_ZERO_OR_MORE + // :68
    '(?<ALIGNED>left|right)' + // :69
    SPACE_ZERO_OR_MORE + // :70
    'aligned' + // :71
    ')?' +
    '$', // RegexLeaf.end() :73
  'i',
);

/**
 * The commented-out body (`:79-85`) is dead upstream: the command only warns.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandLabelOnColumn.java:76-88
 */
export function applyCommandLabelOnColumn(diagram: GanttDiagram, _match: RegExpExecArray): CommandExecutionResult {
  diagram.addWarning(new Warning('This command is deprecated'));
  return CommandExecutionResult.ok();
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandLabelOnColumn.java:50-90 */
export const CommandLabelOnColumn: {
  readonly regex: RegExp;
  readonly apply: (diagram: GanttDiagram, match: RegExpExecArray) => CommandExecutionResult;
} = { regex: COMMAND_LABEL_ON_COLUMN_RE, apply: applyCommandLabelOnColumn };
