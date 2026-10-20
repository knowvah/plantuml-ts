/**
 * The grouping frame's header-tab constants that are NOT style: the padding
 * and corner size `ComponentRoseGroupingHeader` hard-codes, and the tab's
 * `Display` split `GroupingTile` makes.
 *
 * Every style-owned value -- line colour and thickness, the tab fill, fonts,
 * `RoundCorner`, the body fill -- is read off the frame's `Style` (sdd1 T3a,
 * `sequence-layout-frame.ts#groupingPaints`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseGroupingHeader.java:64,76
 */

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
 * @see GroupingTile.java:127-128
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
