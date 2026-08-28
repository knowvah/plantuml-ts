/**
 * Style constants for the sequence-diagram frame/grouping background pass
 * (`loop`, `alt`, `opt`, `par`, `break`, `critical`, `group`, `ref`).
 *
 * Every value here is upstream's DEFAULT skin, in the absence of a
 * `skinparam`/style-block override. This engine has no SName style cascade
 * for the sequence family yet, so these constants cannot yet be overridden
 * from source — see decisions.md D3. They exist here, not inline at each
 * call site, so a later cascade has one place to plug into.
 *
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:102-129
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseGroupingHeader.java:64,76
 */

/** The frame BODY's fill, when no `COLORS` override is given — the generic
 *  `group {}` bucket's `BackGroundColor`, which `sequenceDiagram.group` has
 *  no override for and so cascades from.
 *  @see plantuml.skin:103 */
export const GROUP_BACKGROUND = 'transparent';
/** @see plantuml.skin:117 */
export const GROUP_LINE_COLOR = 'black';
/** @see plantuml.skin:118 */
export const GROUP_LINE_THICKNESS = 1.5;
/** @see plantuml.skin:119 */
export const GROUP_FONT_SIZE = 11;
/** @see plantuml.skin:120 */
export const GROUP_FONT_BOLD = true;
/** @see plantuml.skin:124 */
export const HEADER_LINE_THICKNESS = 1.5;
/** The type tab's fill, when no `COLORS` override is given.
 *  @see plantuml.skin:125 */
export const HEADER_BACKGROUND = '#e';
/** @see plantuml.skin:126 */
export const HEADER_LINE_COLOR = 'black';
/** @see plantuml.skin:127 */
export const HEADER_FONT_SIZE = 13;
/** @see plantuml.skin:128 */
export const HEADER_FONT_BOLD = true;
/** `ClockwiseTopRightBottomLeft.topRightBottomLeft(top, right, bottom,
 *  left)`'s argument order, applied verbatim.
 *  @see ComponentRoseGroupingHeader.java:76 */
export const HEADER_PADDING = { top: 1, right: 30, bottom: 1, left: 15 };
/** The type tab's clipped top-right corner, in pixels.
 *  @see ComponentRoseGroupingHeader.java:64 */
export const CORNER_SIZE = 10;

/**
 * The header tab's `Display`, split into its title and (optional) comment
 * halves — mirrors `GroupingTile`'s constructor exactly: a bare `group`
 * frame draws its `[comment]` AS the tab text (there is no separate
 * comment box); every other frame type draws `title` in the tab and
 * `comment`, when given, in a second box beside it.
 *
 * `comment === undefined` on the `group` branch falls back to `''`: the
 * Java builds `Display.create(start.getComment())` — a ONE-element display
 * whose sole line renders empty. `strings.size() === 1` in that branch, so
 * upstream's own comment box (`strings.get(1)`) never exists for `group`.
 *
 * @see GroupingTile.java:126-127
 */
export function groupingHeaderDisplay(
  title: string,
  comment: string | undefined,
): { tabText: string; tabComment?: string } {
  if (title === 'group') {
    return { tabText: comment ?? '' };
  }
  return comment === undefined ? { tabText: title } : { tabText: title, tabComment: comment };
}
