/**
 * The sequence-diagram divider's (`== label ==`, and the empty `====` form)
 * component GEOMETRY: the constants `ComponentRoseDivider` hard-codes rather
 * than reads from its style. Every paint value — colours, stroke, corner,
 * shadow, font — is the merged `separator` style's (`plantuml.skin:179-187`),
 * carried on the geo (`sequence-layout-divider.ts`, sdd1 T2d).
 *
 * ## What `DividerGeo` carries, and why layout resolves all of it
 *
 * - `lines` — `Display.getWithNewlines` splits the label on `\n`
 *   (`CommandDivider.java:83`), so `== divi\nlines ==` is a two-line text
 *   block. Jar-verified: `pigifu-13-kele137`'s golden label box is 34 tall
 *   (two 13px lines plus 4+4 padding), not 21.
 * - `bandX`/`bandWidth` — `DividerTile#drawU` builds
 *   `Area.create(border2 - border1 - xorigin, …)` and translates by
 *   `border1`, so the band runs border to border, NOT `0 … documentWidth`
 *   and NOT the divider's own `getPreferredWidth`. Jar-verified:
 *   `pigifu-13-kele137`'s 138.8-wide document carries a band at
 *   `x=10 width=118.8` — inset by the playing space's 10px border each side.
 * - `height`/`textWidth`/`textHeight` — the component's own
 *   `getPreferredHeight` and `AbstractTextualComponent`'s
 *   `getTextWidth`/`getTextHeight`.
 *
 * The renderer only READS these. Recomputing any of them at draw time is the
 * split `planning/sizer-renderer-parity.md` exists to name.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseDivider.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/DividerTile.java
 */

/**
 * `ClockwiseTopRightBottomLeft.topRightBottomLeft(4, 4, 4, 4)`, passed to
 * `AbstractTextualComponent` by the constructor — so `getTextWidth` is the
 * text block plus `left + right` and `getTextHeight` is it plus `top + bottom`
 * (`AbstractTextualComponent.java:106-114`). The skin's own `Padding 4`
 * (`plantuml.skin:186`) agrees, but the constructor hardcodes it and does not
 * read the style.
 * @see ComponentRoseDivider.java:67
 */
export const DIVIDER_PADDING = 4;

/** `getPreferredHeight = getTextHeight + 20`.
 *  @see ComponentRoseDivider.java:129-131 */
export const DIVIDER_HEIGHT_ALLOWANCE = 20;

/** `getPreferredWidth = getTextWidth + 30`.
 *  @see ComponentRoseDivider.java:134-136 */
export const DIVIDER_WIDTH_ALLOWANCE = 30;

/** `drawInternalU`'s `deltaX` — the label box is this much wider than the
 *  text, and the text sits this far inside its left edge.
 *  @see ComponentRoseDivider.java:91 */
export const DIVIDER_LABEL_DELTA_X = 6;

/** `drawRectLong`'s `URectangle.build(width, 3)` — the band's height.
 *  @see ComponentRoseDivider.java:114 */
export const DIVIDER_BAND_HEIGHT = 3;

/**
 * The divider's own `getPreferredHeight`, from the measured text block.
 * `getTextHeight` adds the vertical padding; the `+ 20` is the component's.
 *
 * @see ComponentRoseDivider.java:129-131
 */
export function dividerPreferredHeight(textBlockHeight: number): number {
  return textBlockHeight + DIVIDER_PADDING * 2 + DIVIDER_HEIGHT_ALLOWANCE;
}

/**
 * The divider's own `getPreferredWidth`. Feeds `DividerTile#getMaxX`
 * (`teoz/DividerTile.java`), so a long label widens the whole diagram — it is
 * NOT the width the band is drawn at, which comes from the tile's `Area`.
 *
 * @see ComponentRoseDivider.java:134-136
 */
export function dividerPreferredWidth(textBlockWidth: number): number {
  return textBlockWidth + DIVIDER_PADDING * 2 + DIVIDER_WIDTH_ALLOWANCE;
}
