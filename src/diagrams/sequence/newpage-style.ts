/**
 * Size constants for the sequence-diagram page separator (`newpage`).
 *
 * The separator is drawn by `ComponentRoseNewpage#drawInternalU`: take the
 * style's stroke and line colour, then `ug.draw(ULine.hline(dimensionToUse
 * .getWidth()))` (`:59-64`). No box, no text, no second rule. Its stroke and
 * colour are the `newpage` style's, merged in `Newpage`'s constructor
 * (sdd1 T3a, `sequence-layout-events.ts#handleNewpageEvent`): on the default
 * skin `root`'s `LineColor #181818` (`plantuml.skin:16`), `element`'s
 * `LineThickness 0.5` (`:91-93`) and `newpage { LineStyle 2 }` (`:189-191`),
 * which `Style#getStroke` turns into `new UStroke(2, 2, 0.5)`
 * (`Style.java:299-320`) -- `digula-66-dipe776`'s golden carries
 * `style="stroke:#181818;stroke-width:0.5;stroke-dasharray:2,2;"`.
 *
 * What stays here is the tile's geometry, which no style reaches.
 *
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
