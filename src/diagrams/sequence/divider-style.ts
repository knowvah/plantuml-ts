/**
 * Style constants for the sequence-diagram divider (`== label ==`, and the
 * empty `====` form).
 *
 * Every value here is upstream's DEFAULT skin, in the absence of a
 * `skinparam`/style-block override. This engine has no SName style cascade for
 * the sequence family yet, so these cannot be overridden from source — the
 * same situation `frame-style.ts` documents for the frame/grouping family, and
 * the same reason its constants live in a module rather than inline at each
 * call site: a later cascade gets one place to plug into.
 *
 * A sibling of `frame-style.ts` rather than an addition to it, because that
 * module's own header scopes it to `loop`/`alt`/`opt`/`par`/`break`/
 * `critical`/`group`/`ref`.
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
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:169-177
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseDivider.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/DividerTile.java
 */

import type { FontSpec } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';

/** @see plantuml.skin:170 */
export const DIVIDER_LINE_COLOR = 'black';
/**
 * The LABEL BOX's stroke. `drawDoubleLine` halves it for the two rules
 * (`ComponentRoseDivider.java:120`, `UStroke.withThickness(stroke
 * .getThickness() / 2)`) and `drawRectLong` ignores it entirely in favour of
 * `UStroke.simple()` (`:116`) — which is why the jar's golden for
 * `tukobo-89-zebi935` carries `stroke-width:2` on the label box and
 * `stroke-width:1` on the band.
 * @see plantuml.skin:171
 */
export const DIVIDER_LINE_THICKNESS = 2.0;
/** `#e` is the skin's one-hex-digit shorthand, i.e. `#eeeeee` — the jar emits
 *  it as `#EEE`.
 *  @see plantuml.skin:172 */
export const DIVIDER_BACKGROUND = '#EEE';
/** @see plantuml.skin:174 */
export const DIVIDER_FONT_SIZE = 13;
/** @see plantuml.skin:175 */
export const DIVIDER_FONT_BOLD = true;

/**
 * `ClockwiseTopRightBottomLeft.topRightBottomLeft(4, 4, 4, 4)`, passed to
 * `AbstractTextualComponent` by the constructor — so `getTextWidth` is the
 * text block plus `left + right` and `getTextHeight` is it plus `top + bottom`
 * (`AbstractTextualComponent.java:106-114`). The skin's own `Padding 4`
 * (`plantuml.skin:176`) agrees, but the constructor hardcodes it and does not
 * read the style.
 * @see ComponentRoseDivider.java:52-53
 */
export const DIVIDER_PADDING = 4;

/** `getPreferredHeight = getTextHeight + 20`.
 *  @see ComponentRoseDivider.java:127-129 */
export const DIVIDER_HEIGHT_ALLOWANCE = 20;

/** `getPreferredWidth = getTextWidth + 30`.
 *  @see ComponentRoseDivider.java:131-133 */
export const DIVIDER_WIDTH_ALLOWANCE = 30;

/** `drawInternalU`'s `deltaX` — the label box is this much wider than the
 *  text, and the text sits this far inside its left edge.
 *  @see ComponentRoseDivider.java:75 */
export const DIVIDER_LABEL_DELTA_X = 6;

/** `drawRectLong`'s `URectangle.build(width, 3)` — the band's height.
 *  @see ComponentRoseDivider.java:113 */
export const DIVIDER_BAND_HEIGHT = 3;

/**
 * The divider's measurement font — `sequenceDiagram { separator { FontSize 13,
 * FontStyle bold } }`, NOT the diagram font. Both halves of the feature (the
 * layout that reserves the box and the renderer that draws into it) must
 * measure with this, or the box and its text disagree.
 *
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:174-175
 */
export function dividerFontSpecOf(theme: Theme): FontSpec {
  return {
    family: theme.fontFamily,
    size: DIVIDER_FONT_SIZE,
    weight: DIVIDER_FONT_BOLD ? 'bold' : 'normal',
  };
}

/**
 * The divider's own `getPreferredHeight`, from the measured text block.
 * `getTextHeight` adds the vertical padding; the `+ 20` is the component's.
 *
 * @see ComponentRoseDivider.java:127-129
 */
export function dividerPreferredHeight(textBlockHeight: number): number {
  return textBlockHeight + DIVIDER_PADDING * 2 + DIVIDER_HEIGHT_ALLOWANCE;
}

/**
 * The divider's own `getPreferredWidth`. Feeds `DividerTile#getMaxX`
 * (`teoz/DividerTile.java`), so a long label widens the whole diagram — it is
 * NOT the width the band is drawn at, which comes from the tile's `Area`.
 *
 * @see ComponentRoseDivider.java:131-133
 */
export function dividerPreferredWidth(textBlockWidth: number): number {
  return textBlockWidth + DIVIDER_PADDING * 2 + DIVIDER_WIDTH_ALLOWANCE;
}
