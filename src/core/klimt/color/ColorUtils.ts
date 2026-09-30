import type { ResolvedColor } from './HColorSet.js';

/**
 * ColorUtils — the grey-scale slice `ColorMapper.MONOCHROME` /
 * `MONOCHROME_REVERSE` reach (the YIQ luma, 24ways.org/2010/calculating-color-contrast).
 * Not ported: `getReversed`, `distance`, `getGrayScaleFromRGB`, the HSL
 * helpers — no ported mapper reaches them.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorUtils.java:45-75
 */

/** `getGrayScaleInternal(r, g, b) / 1000` — Java `int` division truncates.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorUtils.java:45-58 */
export function getGrayScale(color: ResolvedColor): number {
  return Math.trunc((color.r * 299 + color.g * 587 + color.b * 114) / 1000);
}

/** `new XColor(g, g, g)` — opaque: the source alpha is dropped.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorUtils.java:67-70 */
export function getGrayScaleColor(color: ResolvedColor): ResolvedColor {
  const grayScale = getGrayScale(color);
  return { r: grayScale, g: grayScale, b: grayScale, a: 255 };
}

/** `255 - getGrayScale(color)`, opaque.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorUtils.java:72-75 */
export function getGrayScaleColorReverse(color: ResolvedColor): ResolvedColor {
  const grayScale = 255 - getGrayScale(color);
  return { r: grayScale, g: grayScale, b: grayScale, a: 255 };
}
