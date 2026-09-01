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
 * ## The three stroke values, and where each comes from
 *
 * `ComponentType.NEWPAGE.getStyleSignature()` is
 * `root, element, sequenceDiagram, newpage` (`ComponentType.java:95-96`), so
 * the cascade resolves to `root`'s `LineColor #181818` (`plantuml.skin:16`),
 * `element`'s `LineThickness 0.5` (`:90-93`) and `newpage`'s own
 * `LineStyle 2` (`:179-181`). `Style#getStroke` turns a bare `LineStyle 2`
 * into `new UStroke(2, 2, thickness)` — one token means dash and space are
 * equal (`Style.java:265-282`) — which `SvgGraphics#setStrokeWidth` writes
 * as `stroke-dasharray:2,2`.
 *
 * All three are exactly what `digula-66-dipe776`'s golden carries:
 * `style="stroke:#181818;stroke-width:0.5;stroke-dasharray:2,2;"`. The
 * `2,2` is also what distinguishes a separator from a lifeline, which
 * dashes `5,5` from `lifeLine { LineStyle 5 }` (`:53-55`).
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

/** `root { LineColor #181818 }` — `newpage` overrides neither it nor
 *  `sequenceDiagram`, so the cascade's top value survives.
 *  @see plantuml.skin:16 */
export const NEWPAGE_LINE_COLOR = '#181818';

/** `element { LineThickness 0.5 }` — the signature's second segment, and the
 *  nearest one to set a thickness.
 *  @see plantuml.skin:90-93 */
export const NEWPAGE_LINE_THICKNESS = 0.5;

/** `newpage { LineStyle 2 }`, as `Style#getStroke` expands a single token:
 *  dash and space both 2 (`Style.java:272-278`).
 *  @see plantuml.skin:179-181 */
export const NEWPAGE_DASH_UNIT = 2;
