/**
 * ColorResolver — resolves a raw SVG color token (from a decomposed
 * `<$sprite>` `<path>`'s `fill`/`stroke` attribute) to a concrete color,
 * honouring an optional "forced" override color and the sprite's own
 * grey-level range. `SvgNanoParser.drawU` (T5/T8) constructs one per draw
 * call: `new ColorResolver(fontColor, forcedColor, this)` — `this` being
 * the parser, which implements {@link GrayLevelRange} over its own
 * min/max grey scan.
 *
 * This port has no `HColor`/`HColorSimple` object hierarchy (verified via
 * `grep -rn "class HColor\|HColorSimple\|HColors\." src/` — none exist;
 * `src/core/klimt/color/HColorSet.ts` and `src/core/paint.ts` are the
 * closest analogues, and both resolve colors to plain data: a
 * `{r,g,b,a}` tuple (`ResolvedColor`) or a canonical hex string). This
 * file reuses `ResolvedColor` as its working color type rather than
 * inventing a parallel one, and reuses `HColorSet.ts#parseSimpleColor`/
 * `#toSvgHex` and `tim/builtin/color-utils.ts#grayScale` directly.
 *
 * One piece has no existing export to reuse: `HColorSimple#asMonochrome
 * (HColorSimple, double, double)`'s tinted branch needs the HSLuv
 * round-trip (`ColorUtils#grayToColor` → `HUSLColorConverter`).
 * `tim/builtin/color-utils.ts` already privately implements that exact
 * round-trip machinery for a DIFFERENT upstream method
 * (`ColorUtils#reverseHsluv`, ported there as `reverseHsluv`), but does
 * not export the pieces (`rgbToHsluv`/`hsluvToRgb`) a `grayToColor` port
 * would need, and this task's write-set is limited to this file. Rather
 * than silently degrade fidelity or reach outside the write-set, this
 * file carries its own minimal, faithful port of that same HSLuv
 * machinery (below, clearly delimited) — flagged here as a follow-up:
 * hoist the shared HSLuv round-trip into one exported module so both
 * call sites share one implementation.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/ColorResolver.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/GrayLevelRange.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorSimple.java#asMonochrome
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorUtils.java#grayToColor
 */

import { parseSimpleColor, toSvgHex } from '../color/HColorSet.js';
import type { ResolvedColor } from '../color/HColorSet.js';
import { grayScale } from '../../tim/builtin/color-utils.js';

/**
 * `emoji/GrayLevelRange.java` — the min/max grey bounds a sprite's own
 * pixel scan established. `SvgNanoParser` (T5/T8) implements this
 * directly over its `minGray`/`maxGray` fields; this port has no
 * standalone implementer here since none is needed by this file's own
 * tests (a plain object literal suffices).
 */
export interface GrayLevelRange {
  getMinGrayLevel(): number;
  getMaxGrayLevel(): number;
}

/** `HColors.BLACK` — {@link ColorResolver#getDefaultColor}'s ultimate fallback. */
const BLACK: ResolvedColor = { r: 0, g: 0, b: 0, a: 255 };

/** `HColorSet#getColorOrWhite`'s fallback for an unresolvable token. */
const WHITE: ResolvedColor = { r: 255, g: 255, b: 255, a: 255 };

/**
 * `HColors.none()` collapsed to this port's canonical "no color"
 * representation: alpha 0, matching `paint.ts`'s own documented
 * equivalence (`HColor#toSvg` collapses ANY transparent color, the
 * `none` sentinel included, to `#00000000`).
 */
const NONE: ResolvedColor = { r: 0, g: 0, b: 0, a: 0 };

/** `HColorSet#getColorOrWhite`, scoped to the single-token hex/named-color
 * path real sprite `fill=`/`stroke=` values use (not upstream's full
 * gradient-separator `parseColor`, out of scope for an SVG attribute
 * value — see `HColorSet.ts`'s own documented scope). */
function getColorOrWhite(code: string): ResolvedColor {
  return parseSimpleColor(code) ?? WHITE;
}

/** `HColorSimple#isGray`. */
function isGray(c: ResolvedColor): boolean {
  return c.r === c.g && c.g === c.b;
}

/**
 * `HColorSimple#asMonochrome()` (no-arg overload) → `ColorUtils
 * #getGrayScaleColor` → `new XColor(gray, gray, gray)`. The 3-arg
 * `XColor` constructor defaults alpha to 255 (`XColor.java:17-19`), so
 * this DROPS the input's original alpha — preserved verbatim, not a bug.
 */
function asMonochrome(c: ResolvedColor): ResolvedColor {
  const gray = grayScale(c);
  return { r: gray, g: gray, b: gray, a: 255 };
}

// ---------------------------------------------------------------------------
// HSLuv round-trip — a faithful, minimal port of `ColorUtils#grayToColor`'s
// dependency chain (`HUSLColorConverter`), needed ONLY by
// `asMonochromeTinted` below. See this file's header doc for why this
// duplicates (rather than imports) `tim/builtin/color-utils.ts`'s own
// private HSLuv helpers.
// @see ~/git/plantuml/.../klimt/color/HUSLColorConverter.java
// @see ~/git/plantuml/.../klimt/color/ColorUtils.java#grayToColor
// ---------------------------------------------------------------------------

const M: readonly (readonly number[])[] = [
  [3.240969941904521, -1.537383177570093, -0.498610760293],
  [-0.96924363628087, 1.87596750150772, 0.041555057407175],
  [0.055630079696993, -0.20397695888897, 1.056971514242878],
];
const MINV: readonly (readonly number[])[] = [
  [0.41239079926595, 0.35758433938387, 0.18048078840183],
  [0.21263900587151, 0.71516867876775, 0.072192315360733],
  [0.019330818715591, 0.11919477979462, 0.95053215224966],
];
const REF_U = 0.19783000664283;
const REF_V = 0.46831999493879;
const KAPPA = 903.2962962;
const EPSILON = 0.0088564516;

function dot3(a: readonly number[], b: readonly [number, number, number]): number {
  return (a[0] ?? 0) * b[0] + (a[1] ?? 0) * b[1] + (a[2] ?? 0) * b[2];
}

function toLinear(c: number): number {
  return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
}

function fromLinear(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

function xyzToRgbUnit(tuple: readonly [number, number, number]): readonly [number, number, number] {
  return [fromLinear(dot3(M[0]!, tuple)), fromLinear(dot3(M[1]!, tuple)), fromLinear(dot3(M[2]!, tuple))];
}

function rgbToXyz(tuple: readonly [number, number, number]): readonly [number, number, number] {
  const rgbl: readonly [number, number, number] = [toLinear(tuple[0]), toLinear(tuple[1]), toLinear(tuple[2])];
  return [dot3(MINV[0]!, rgbl), dot3(MINV[1]!, rgbl), dot3(MINV[2]!, rgbl)];
}

function yToL(y: number): number {
  return y <= EPSILON ? y * KAPPA : 116 * y ** (1 / 3) - 16;
}

function xyzToLuv([x, y, z]: readonly [number, number, number]): readonly [number, number, number] {
  const varU = (4 * x) / (x + 15 * y + 3 * z);
  const varV = (9 * y) / (x + 15 * y + 3 * z);
  const l = yToL(y);
  if (l === 0) return [0, 0, 0];
  return [l, 13 * l * (varU - REF_U), 13 * l * (varV - REF_V)];
}

function luvToLch([l, u, v]: readonly [number, number, number]): readonly [number, number, number] {
  const c = Math.sqrt(u * u + v * v);
  if (c < 0.00000001) return [l, c, 0];
  let h = (Math.atan2(v, u) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [l, c, h];
}

function lchToLuv([l, c, h]: readonly [number, number, number]): readonly [number, number, number] {
  const hrad = (h / 360) * 2 * Math.PI;
  return [l, Math.cos(hrad) * c, Math.sin(hrad) * c];
}

function luvToXyz([l, u, v]: readonly [number, number, number]): readonly [number, number, number] {
  if (l === 0) return [0, 0, 0];
  const varU = u / (13 * l) + REF_U;
  const varV = v / (13 * l) + REF_V;
  const y = l <= 8 ? l / KAPPA : ((l + 16) / 116) ** 3;
  const x = 0 - (9 * y * varU) / ((varU - 4) * varV - varU * varV);
  const z = (9 * y - 15 * varV * y - varV * x) / (3 * varV);
  return [x, y, z];
}

function getBounds(l: number): (readonly [number, number])[] {
  const result: (readonly [number, number])[] = [];
  const sub1 = (l + 16) ** 3 / 1560896;
  const sub2 = sub1 > EPSILON ? sub1 : l / KAPPA;

  for (const row of M) {
    const [m1, m2, m3] = row as [number, number, number];
    for (const t of [0, 1]) {
      const top1 = (284517 * m1 - 94839 * m3) * sub2;
      const top2 = (838422 * m3 + 769860 * m2 + 731718 * m1) * l * sub2 - 769860 * t * l;
      const bottom = (632260 * m3 - 126452 * m2) * sub2 + 126452 * t;
      result.push([top1 / bottom, top2 / bottom]);
    }
  }
  return result;
}

function maxChromaForLH(l: number, h: number): number {
  const hrad = (h / 360) * Math.PI * 2;
  let min = Number.MAX_VALUE;
  for (const [m1, b1] of getBounds(l)) {
    const length = b1 / (Math.sin(hrad) - m1 * Math.cos(hrad));
    if (length >= 0) min = Math.min(min, length);
  }
  return min;
}

function lchToHsluv([l, c, h]: readonly [number, number, number]): readonly [number, number, number] {
  if (l > 99.9999999) return [h, 0, 100];
  if (l < 0.00000001) return [h, 0, 0];
  const max = maxChromaForLH(l, h);
  return [h, (c / max) * 100, l];
}

function hsluvToLch([h, s, l]: readonly [number, number, number]): readonly [number, number, number] {
  if (l > 99.9999999) return [100, 0, h];
  if (l < 0.00000001) return [0, 0, h];
  const max = maxChromaForLH(l, h);
  return [l, (max / 100) * s, h];
}

function rgbUnitToHsluv(tuple: readonly [number, number, number]): readonly [number, number, number] {
  return lchToHsluv(luvToLch(xyzToLuv(rgbToXyz(tuple))));
}

function hsluvToRgbUnit(tuple: readonly [number, number, number]): readonly [number, number, number] {
  return xyzToRgbUnit(luvToXyz(lchToLuv(hsluvToLch(tuple))));
}

function to255(value: number): number {
  const result = Math.round(255 * value);
  if (result < 0) return 0;
  if (result > 255) return 255;
  return result;
}

/**
 * `ColorUtils#grayToColor` exactly, including its `/256.0` (not
 * `/255.0`) normalization on the way in, matching upstream's own
 * asymmetry (also preserved verbatim in `reverseHsluv`, `color-utils.ts`).
 */
function grayToColor(coef: number, color: ResolvedColor): ResolvedColor {
  const hsluv = rgbUnitToHsluv([color.r / 256.0, color.g / 256.0, color.b / 256.0]);
  const h = hsluv[0];
  const s = hsluv[1];
  const l = hsluv[2] + (100 - hsluv[2]) * coef;
  const rgb = hsluvToRgbUnit([h, s, l]);
  return { r: to255(rgb[0]), g: to255(rgb[1]), b: to255(rgb[2]), a: 255 };
}

/**
 * `HColorSimple#asMonochrome(HColorSimple colorForMonochrome, double
 * minGray, double maxGray)`. `maxGray` is accepted but, faithfully to
 * upstream, never read — `coef` only involves `minGray`. Preserved
 * verbatim per this port's don't-refactor-while-porting discipline: this
 * looks like a bug (or a vestigial parameter) but is exactly what the
 * jar computes.
 */
function asMonochromeTinted(
  color: ResolvedColor,
  colorForMonochrome: ResolvedColor,
  minGray: number,
  _maxGray: number,
): ResolvedColor {
  const gray = grayScale(color);
  const coef = (gray - minGray) / 256.0;
  return grayToColor(coef, colorForMonochrome);
}

/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/ColorResolver.java
 */
export class ColorResolver {
  private readonly fontColor: ResolvedColor | undefined;
  private readonly forcedColor: ResolvedColor | undefined;
  private readonly grayLevelRange: GrayLevelRange;

  constructor(
    fontColor: ResolvedColor | undefined,
    forcedColor: ResolvedColor | undefined,
    grayLevelRange: GrayLevelRange,
  ) {
    this.fontColor = fontColor;
    this.forcedColor = forcedColor;
    this.grayLevelRange = grayLevelRange;
  }

  /** @see ColorResolver.java#getDefaultColor */
  getDefaultColor(): ResolvedColor {
    if (this.fontColor === undefined && this.forcedColor === undefined) return BLACK;
    return this.forcedColor ?? this.fontColor ?? BLACK;
  }

  /** @see ColorResolver.java#getTrueColor */
  getTrueColor(code: string): ResolvedColor {
    if (code.toLowerCase() === 'none') return NONE;

    const result = getColorOrWhite(code);

    if (this.forcedColor === undefined) return result;

    if (isGray(this.forcedColor)) return asMonochrome(result);

    return asMonochromeTinted(
      result,
      this.forcedColor,
      this.grayLevelRange.getMinGrayLevel(),
      this.grayLevelRange.getMaxGrayLevel(),
    );
  }
}

/** Re-exported for callers/tests that want the final SVG-ready hex string
 * rather than the raw `{r,g,b,a}` tuple. */
export function colorResolverToSvgHex(c: ResolvedColor): string {
  return toSvgHex(c);
}
