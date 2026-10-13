import type { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { Warning } from '../../core/warning/Warning.js';
import {
  applyMultilineItem,
  WBS_CODE_CHARS,
  type WbsItemTarget,
  type WbsMultilineBlock,
} from './CommandWBSItemMultilineNew.js';

/**
 * `CommandWBSItemMultilineOld` — the same block as `CommandWBSItemMultilineNew`
 * with colour/code BEFORE shape/direction; it warns about that order. END,
 * block collection and display building are identical (see
 * `collectWbsMultilineBlock`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/CommandWBSItemMultilineOld.java:50-119
 */

/** @see CommandWBSItemMultilineOld.java:63-70 */
const COLOR_CODE =
  `(?:(?:\\[(?<BACKCOLOR_1>#\\w+)\\])?(?:\\((?<CODE_1>${WBS_CODE_CHARS}+)\\))?` +
  `|(?:\\((?<CODE_2>${WBS_CODE_CHARS}+)\\))?(?:\\[(?<BACKCOLOR_2>#\\w+)\\])?)`;

/** @see CommandWBSItemMultilineOld.java:71-77 */
const SHAPE_DIRECTION = '(?:(?<SHAPE_1>_)?(?<WBS_DIRECTION_1>[<>])?|(?<WBS_DIRECTION_2>[<>])?|(?<SHAPE_2>_)?)';

/** Matched against the TRIMMED first line. @see CommandWBSItemMultilineOld.java:58-80 */
export const WBS_MULTILINE_OLD_START_RE = new RegExp(
  `^(?<TYPE>[ \\t]*[*+-]+)${COLOR_CODE}${SHAPE_DIRECTION}:(?<DATA>.*)$`,
  'iu',
);

/** @see CommandWBSItemMultilineOld.java:112 */
const OLD_ORDER_WARNING = 'Please define Direction/Shape before Color/Id.';

/** @see CommandWBSItemMultilineOld.java:87-118 */
export function applyWbsItemMultilineOld(diagram: WbsItemTarget, block: WbsMultilineBlock): CommandExecutionResult {
  return applyMultilineItem(diagram, block, WBS_MULTILINE_OLD_START_RE, new Warning(OLD_ORDER_WARNING));
}
