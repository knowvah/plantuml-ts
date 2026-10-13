import type { HColor } from '../../core/abel/Colors.js';
import { getWBSDirection } from '../../core/abel/Direction.js';
import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { NoSuchColorException } from '../../core/klimt/color/NoSuchColorException.js';
import { transform } from '../../core/url/UrlBuilder.js';
import { fromDesc, IdeaShape } from '../mindmap/IdeaShape.js';
import type { WBSDiagram } from './WBSDiagram.js';

/**
 * `CommandWBSItemNew` — the single-line WBS item whose shape/direction
 * markers come BEFORE the colour/code pair (`**_<[#red](c1) Label`). Two
 * modes, registered as `New(1)`, `New(0)` (WBSDiagramFactory.java:8-12):
 * mode 0 is the plain form, mode 1 the `"label" as code` form.
 *
 * Each capture group carries the Java `RegexLeaf` key as its name
 * (`Constant.WBS_TYPE` = "TYPE", `WBS_DIRECTION` = "DIR"); a group that did not
 * participate is `undefined` where Java's is `null`. The patterns are written
 * in Java's `%`-token syntax and expanded by `transform` (Pattern2.java:62-114,
 * CASE_INSENSITIVE → `i`, `.` excludes the Java line terminators).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/CommandWBSItemNew.java
 */

/** `.` — Java excludes `\n \r \u0085    ` (Pattern javadoc). */
const ANY = '[^\\n\\r\\u0085\\u2028\\u2029]';

/** `RegexLeaf(1, WBS_TYPE, "([ \t]*[*+-]+)")` @see CommandWBSItemNew.java:50,67 */
const TYPE = '(?<TYPE>[ \\t]*[*+-]+)';

/**
 * The `RegexOr` of shape/direction — THREE alternatives, because the second
 * `RegexConcat` closes after `DIRECTION_2` and `SHAPE_2` is the `RegexOr`'s own
 * third argument. @see CommandWBSItemNew.java:53-59,68-74
 */
const SHAPE_DIR = '(?:(?<SHAPE_1>_)?(?<DIR_1>[<>])?|(?<DIR_2>[<>])?|(?<SHAPE_2>_)?)';

/** @see CommandWBSItemNew.java:60-65 */
const COLOR_CODE =
  '(?:(?:\\[(?<BACKCOLOR_1>#\\w+)\\])?(?:\\((?<CODE_1>[%pLN_]+)\\))?' +
  '|(?:\\((?<CODE_2>[%pLN_]+)\\))?(?:\\[(?<BACKCOLOR_2>#\\w+)\\])?)';

/** `RegexOptional(RegexConcat(spaceOneOrMore, LABEL))` @see CommandWBSItemNew.java:66-67 */
const OPTIONAL_LABEL = `(?:[%s]+(?<LABEL>[^%s]${ANY}*))?`;

function compile(source: string): RegExp {
  return new RegExp(`^${transform(source)}$`, 'iu');
}

/** Mode 0. @see CommandWBSItemNew.java:50-66 */
export const WBS_ITEM_NEW_RE_0: RegExp = compile(TYPE + SHAPE_DIR + COLOR_CODE + OPTIONAL_LABEL);

/** Mode 1, the `"label" as code` form. @see CommandWBSItemNew.java:68-82 */
export const WBS_ITEM_NEW_RE_1: RegExp = compile(
  TYPE +
    SHAPE_DIR +
    '(?:\\[(?<BACKCOLOR>#\\w+)\\])?' +
    '[%s]+[%g](?<LABEL>' +
    ANY +
    '*)[%g][%s]+as[%s]+(?<CODE>[%pLN_]+)',
);

/**
 * `RegexResult.getLazzy(key, 0)` — the first non-null group whose name starts
 * with `key`, in pattern order (`RegexResult.java:98-111`); `undefined` for
 * Java's `null`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexResult.java:98-111
 */
function getLazzy(groups: Readonly<Record<string, string | undefined>>, key: string): string | undefined {
  for (const [name, value] of Object.entries(groups)) if (name.startsWith(key) && value !== undefined) return value;
  return undefined;
}

/**
 * `executeArg`: `NoSuchColorException` is turned into `badColor()` by
 * `SingleLineCommand2#execute` (:174-178). Mode is accepted for the caller's
 * symmetry with the registration order; the executed body is identical.
 * @see CommandWBSItemNew.java:52-67
 */
export function applyWbsItemNew(diagram: WBSDiagram, match: RegExpExecArray, _mode: 0 | 1): CommandExecutionResult {
  const groups = match.groups ?? {};
  const type = groups['TYPE']!;
  const label = groups['LABEL'];
  const code = getLazzy(groups, 'CODE');
  const stringColor = getLazzy(groups, 'BACKCOLOR');

  let backColor: HColor | undefined;
  try {
    if (stringColor !== undefined) backColor = diagram.getSkinParam().getIHtmlColorSet().getColor(stringColor);
  } catch (e) {
    if (e instanceof NoSuchColorException) return CommandExecutionResult.badColor();
    throw e;
  }

  const dir = getWBSDirection(type, groups['DIR_1'], groups['DIR_2']);
  let shape = fromDesc(getLazzy(groups, 'SHAPE'));
  if (label === undefined && shape === IdeaShape.NONE) shape = IdeaShape.PSEUDO;
  else if (label === undefined) return CommandExecutionResult.error('Missing label for WBS node.');

  return diagram.addIdea(code, diagram.getSmartLevel(type), { backColor, label: label ?? '', shape }, dir);
}
