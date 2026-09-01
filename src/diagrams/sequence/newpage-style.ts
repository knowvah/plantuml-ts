/**
 * Style and size constants for the sequence-diagram page separator
 * (`newpage`).
 *
 * A sibling of `divider-style.ts` for the same reason that module is a
 * sibling of `frame-style.ts`: every value here is upstream's DEFAULT skin in
 * the absence of a `skinparam`/style-block override, this engine has no SName
 * cascade for the sequence family yet, and a later cascade wants one place to
 * plug into.
 *
 * The separator is drawn by `ComponentRoseNewpage#drawInternalU`, which is
 * three lines long: take the style's stroke and line colour, then
 * `ug.draw(ULine.hline(dimensionToUse.getWidth()))`. There is no box, no
 * text and no second rule — unlike a divider, which draws five shapes.
 *
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:179-181
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseNewpage.java:59-71
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/NewpageTile.java:50,78-96
 */

/** `NewpageTile.MARGINY` — "small vertical space before and after the dashed
 *  separator" (`NewpageTile.java:50`). The separator is drawn at
 *  `dy(MARGINY)` inside the tile (`:88`).
 *  @see NewpageTile.java:50 */
export const NEWPAGE_MARGIN_Y = 10;

/** `ComponentRoseNewpage#getPreferredHeight` — a bare `return 1`
 *  (`:67-70`). The line itself is one pixel tall.
 *  @see ComponentRoseNewpage.java:67-70 */
export const NEWPAGE_LINE_HEIGHT = 1;

/**
 * `NewpageTile#getPreferredHeight` — `getComponent().getPreferredHeight() +
 * 2 * MARGINY`, i.e. 21 (`:94-96`).
 *
 * This is the number that makes consecutive pages overlap: page k's band ends
 * at `newpageY + 21` while page k+1's begins at `newpageY`, so the separator
 * at `newpageY + MARGINY` is inside both. `PlayingSpaceWithParticipants`
 * says so in prose at `:78-80` ("consecutive pages slightly overlap on the
 * newpage separator, so that the dashed line is visible at the bottom of the
 * page ending there and at the top of the page starting there").
 *
 * @see NewpageTile.java:94-96
 */
export const NEWPAGE_TILE_HEIGHT = NEWPAGE_LINE_HEIGHT + 2 * NEWPAGE_MARGIN_Y;
