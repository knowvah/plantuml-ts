import type { ResolvedColor } from './HColorSet.js';

/**
 * ColorUtils — the grey-scale slice `ColorMapper.MONOCHROME` /
 * `MONOCHROME_REVERSE` reach (the YIQ luma, 24ways.org/2010/calculating-color-contrast).
 * Not ported here: `getReversed`, `getGrayScaleFromRGB`, the HSL
 * helpers — their callers carry them (`fragment-color-mapper.ts`,
 * `tim/builtin/color-utils.ts`, `sprite/ColorResolver.ts`). The private
 * `to255` is exported so those three share one copy.
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

/** `abs` of each channel difference, weighted by the private
 *  `getGrayScaleInternal` (java:55-58) — the UNdivided sum: only
 *  `getGrayScaleInternalFromRGB` divides by 1000 (java:48-52).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorUtils.java:77-82 */
export function distance(c1: ResolvedColor, c2: ResolvedColor): number {
  return Math.abs(c1.r - c2.r) * 299 + Math.abs(c1.g - c2.g) * 587 + Math.abs(c1.b - c2.b) * 114;
}

/** `(int) (255 * value)` — truncation toward zero, never a JS `-0` (`| 0`) —
 *  clamped to `[0, 255]`. Private upstream; shared here by the three ported
 *  callers of `reverseHsluv`, `grayToColor` and `getReversed`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorUtils.java:169-177 */
export function to255(value: number): number {
  const result = (255 * value) | 0;
  if (result < 0) return 0;
  return result > 255 ? 255 : result;
}
