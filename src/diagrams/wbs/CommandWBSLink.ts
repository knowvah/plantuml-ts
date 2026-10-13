import { ColorType } from '../../core/abel/ColorType.js';
import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { COLORS_REGEXP, ColorParser } from '../../core/klimt/color/ColorParser.js';
import { NoSuchColorException } from '../../core/klimt/color/NoSuchColorException.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import { WBS_CODE_CHARS } from './CommandWBSItemMultilineNew.js';
import type { WBSDiagram } from './WBSDiagram.js';

/**
 * `CommandWBSLink` — `code1 ..> code2 [#color] [<<stereotype>>] [: label]`.
 * The label is captured and unused (`executeArg`, java:33 is commented out).
 *
 * `RegexLeaf.spaceZeroOrMore()` is `[%s]*` = `[\s ]*`;
 * `StereotypePattern.optional` is `spaceZeroOrMore (<<.+?>>)? spaceZeroOrMore`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/CommandWBSLink.java:6-38
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/StereotypePattern.java:50-56
 */
const SPACES = String.raw`[\s ]*`;

/** `color()` — `ColorParser.simpleColor(ColorType.LINE)`. @see CommandWBSLink.java:52-54 */
const LINK_COLOR = ColorParser.simpleColor(ColorType.LINE);

/** @see CommandWBSLink.java:41-50 */
export const WBS_LINK_RE = new RegExp(
  `^(?<CODE1>${WBS_CODE_CHARS}+)${SPACES}[.-]+>${SPACES}(?<CODE2>${WBS_CODE_CHARS}+)${SPACES}` +
    `(?<COLOR>${COLORS_REGEXP})?` +
    `${SPACES}(?<STEREOTYPE><<.+?>>)?${SPACES}` +
    `(?::[\\s\\u00A0]*(?<LABEL_LINK>.+))?$`,
  'iu',
);

/** The members of `WBSDiagram` the link command uses. */
export type WbsLinkTarget = Pick<WBSDiagram, 'getSkinParam' | 'link'>;

/** @see CommandWBSLink.java:64-79 */
export function applyWbsLink(diagram: WbsLinkTarget, match: RegExpExecArray): CommandExecutionResult {
  const g = match.groups!;
  try {
    const colors = LINK_COLOR.getColor(g['COLOR'], diagram.getSkinParam().getIHtmlColorSet());
    return diagram.link(g['CODE1']!, g['CODE2']!, colors, Stereotype.build(g['STEREOTYPE']));
  } catch (e) {
    // `SingleLineCommand2`'s `catch (NoSuchColorException e)` (java:174-178).
    if (e instanceof NoSuchColorException) return CommandExecutionResult.badColor();
    throw e;
  }
}
