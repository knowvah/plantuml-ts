import type { Paint } from '../../../paint.js';
import { Back } from '../../Back.js';
import { Fore } from '../../Fore.js';
import { FontStyle } from '../../shape/UText.js';
import type { FontConfiguration, FontFace } from '../../shape/UText.js';
import type { UGraphicWithScale } from '../../UGraphicWithScale.js';
import { UStroke } from '../../UStroke.js';
import type { RenderContext } from './sax-context.js';
import type { SaxAttributes } from './sax-events.js';
import { extractGradientPaint, parseJavaDouble } from './sax-gradient.js';

/**
 * Style, transform and font helpers of `RenderHandler` (gradients live in
 * `sax-gradient.ts`, split off at the 500-line hook).
 *
 * Type mapping for the upstream signatures: `HColor` is this port's
 * {@link Paint} (what `UGraphicWithScale#getTrueColor` returns) and `c.bg()` is
 * `new Back(c)`, as in `svg-nanoparser-shapes.ts#applyFillAndStroke`; `UFontFace`
 * is `FontFace` and `FontConfiguration` is the `UText.ts` interface that
 * `svg-nanoparser-shapes.ts#drawText` already uses. The jar's `LOG.fine` /
 * `LOG.warning` calls reach no output and are dropped.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSaxParser.java:921-1335
 */

/** `P_TRANSFORM_OP` (`SvgSaxParser.java:1186-1187`); `[^)]` also matches newlines, as in Java. */
const TRANSFORM_OP = /(translate|rotate|scale|matrix)\s*\(([^)]*)\)/g;

/** `parseNumberList`'s separator `[,\s]+` (`:1233`); Java `\s` is `[ \t\n\x0B\f\r]`. */
const NUMBER_LIST_SEPARATOR = /[, \t\n\x0B\f\r]+/;

/** `String.trim()` strips every char <= U+0020 (not the Unicode whitespace JS strips). */
const JAVA_TRIM = /^[\u0000- ]+|[\u0000- ]+$/g;
const javaTrim = (value: string): string => value.replace(JAVA_TRIM, '');

/** `parseFontSize`'s unit suffix (`:1262`). */
const FONT_SIZE_UNIT = /(px|pt|em|rem)$/i;
/** `Integer.parseInt` input; range checked against Java's `int` below. */
const JAVA_INT = /^[+-]?\d+$/;
const INT_MIN = -(2 ** 31);
const INT_MAX = 2 ** 31 - 1;

/** `UFontWeight.fromCssValue` clamp (`UFontWeight.java:97-103`) and `UFontFace.normal()` (`UFontFace.java:52`). */
const CSS_WEIGHT_MIN = 100;
const CSS_WEIGHT_MAX = 900;
const CSS_WEIGHT_STEP = 100;
const CSS_WEIGHT_HALF_STEP = 50;
const CSS_WEIGHT_NORMAL = 400;
const CSS_WEIGHT_BOLD = 700;
/** `UFontFace.fromCssWeight` keywords `lighter` -> 300, `bolder` -> 800 (`UFontFace.java:127-130`). */
const CSS_WEIGHT_LIGHTER = 300;
const CSS_WEIGHT_BOLDER = 800;

/** The `url(#` prefix of a gradient fill and its length (`SvgSaxParser.java:1124,1129`). */
const URL_PREFIX = 'url(#';

/** @see SvgSaxParser.java:1228-1253 parseNumberList */
function parseNumberList(raw: string): number[] {
  const trimmed = javaTrim(raw);
  if (trimmed === '') return [];
  const values: number[] = [];
  for (const part of trimmed.split(NUMBER_LIST_SEPARATOR)) {
    if (part === '') continue;
    const value = parseJavaDouble(part);
    if (value !== undefined) values.push(value);
  }
  return values;
}

/** `values[i]`, 0 past the end (callers have checked the length the Java checks). */
function valueAt(values: readonly number[], index: number): number {
  return values[index] ?? 0;
}

/** @see SvgSaxParser.java:1204-1206 (translate arm) */
function applyTranslateOp(ugs: UGraphicWithScale, values: readonly number[]): UGraphicWithScale {
  return ugs.applyTranslate(values[0] ?? 0, values[1] ?? 0);
}

/** @see SvgSaxParser.java:1207-1214 (scale arm) */
function applyScaleOp(ugs: UGraphicWithScale, values: readonly number[]): UGraphicWithScale {
  const sx = values[0] ?? 1;
  const sy = values[1] ?? sx;
  return sx === sy ? ugs.applyScale(sx, sy) : ugs.applyMatrix(sx, 0, 0, sy, 0, 0);
}

/** @see SvgSaxParser.java:1215-1220 (rotate arm): the centre is read only from the 3-number form */
function applyRotateOp(ugs: UGraphicWithScale, values: readonly number[]): UGraphicWithScale {
  const angle = values[0] ?? 0;
  const hasCentre = values.length > 2;
  return ugs.applyRotate(angle, hasCentre ? (values[1] ?? 0) : 0, hasCentre ? (values[2] ?? 0) : 0);
}

/** @see SvgSaxParser.java:1221-1225 (matrix arm): fewer than six numbers is ignored */
function applyMatrixOp(ugs: UGraphicWithScale, values: readonly number[]): UGraphicWithScale {
  if (values.length < 6) return ugs;
  const at = (i: number): number => valueAt(values, i);
  return ugs.applyMatrix(at(0), at(1), at(2), at(3), at(4), at(5));
}

type TransformOp = (ugs: UGraphicWithScale, values: readonly number[]) => UGraphicWithScale;

/** The four operations `P_TRANSFORM_OP` names (`:1186-1187`); `skewX`/`skewY` are not among them. */
const TRANSFORM_OPS: ReadonlyMap<string, TransformOp> = new Map([
  ['translate', applyTranslateOp],
  ['scale', applyScaleOp],
  ['rotate', applyRotateOp],
  ['matrix', applyMatrixOp],
]);

/**
 * Applies each `translate|rotate|scale|matrix` operation of an SVG `transform`
 * value, left to right. Anything else in the string (`skewX`, `skewY`) is not
 * matched by the Java pattern and is ignored, as upstream does.
 *
 * @see SvgSaxParser.java:1190-1226 applyTransform
 */
export function applyTransform(ugs: UGraphicWithScale, transform: string): UGraphicWithScale {
  if (transform === '') return ugs;
  let current = ugs;
  for (const match of transform.matchAll(TRANSFORM_OP)) {
    const op = TRANSFORM_OPS.get(match[1] ?? '');
    if (op !== undefined) current = op(current, parseNumberList(match[2] ?? ''));
  }
  return current;
}

/**
 * `style="a:b;c:d"` lookup: the value after the first colon of the first part
 * whose name matches `key` case-insensitively.
 *
 * @see SvgSaxParser.java:1164-1189 getStyleValue
 */
function getStyleValue(attrs: SaxAttributes, key: string): string | undefined {
  const style = attrs.get('style');
  if (style === undefined || style === '') return undefined;
  for (const part of style.split(';')) {
    const idx = part.indexOf(':');
    if (idx <= 0) continue;
    if (javaTrim(part.substring(0, idx)).toLowerCase() === key.toLowerCase()) return javaTrim(part.substring(idx + 1));
  }
  return undefined;
}

/**
 * A non-empty `style` value wins over the attribute.
 *
 * @see SvgSaxParser.java:1156-1163 getAttrOrStyle
 */
export function getAttrOrStyle(attrs: SaxAttributes, attrName: string, styleKey: string): string | undefined {
  const styleValue = getStyleValue(attrs, styleKey);
  if (styleValue !== undefined && styleValue !== '') return styleValue;
  return attrs.get(attrName);
}

/**
 * Looks up `gradientId` in the pass-1 definitions: a multi-stop linear gradient,
 * the first stop colour for radial or single-stop gradients, else `undefined`.
 *
 * @see SvgSaxParser.java:921-962 extractGradientColor
 */
export function extractGradientColor(ctx: RenderContext, gradientId: string): Paint | undefined {
  return extractGradientPaint(ctx, gradientId);
}

/** @see SvgSaxParser.java:1104-1111 (`stroke-width` -> `UStroke.withThickness`); a bad number is ignored */
function applyStrokeWidth(ugs: UGraphicWithScale, strokeWidth: string | undefined): UGraphicWithScale {
  if (strokeWidth === undefined || strokeWidth === '') return ugs;
  const width = parseJavaDouble(strokeWidth);
  if (width === undefined) return ugs;
  return ugs.apply(UStroke.withThickness(ugs.getInitialScale() * width));
}

/** @see SvgSaxParser.java:1113-1119 (stroke colour; a missing fill takes the default colour) */
function applyStroke(ugs: UGraphicWithScale, stroke: string | undefined, fill: string | undefined): UGraphicWithScale {
  if (stroke === undefined || stroke === '') return ugs;
  let out = ugs.apply(new Fore(ugs.getTrueColor(stroke)));
  if (fill === undefined || fill === '') out = out.apply(new Back(out.getDefaultColor()));
  return out;
}

/**
 * `fill="url(#id)"` (`:1123-1140`). The id is everything between `url(#` and
 * the last character, whatever that character is; Java's `substring(5, length
 * - 1)` throws for a bare `url(#`, and so does this.
 */
function applyGradientFill(
  ctx: RenderContext,
  ugs: UGraphicWithScale,
  fill: string,
  hasStroke: boolean,
): UGraphicWithScale {
  const end = fill.length - 1;
  if (end < URL_PREFIX.length) {
    throw new RangeError(`begin ${URL_PREFIX.length}, end ${end}, length ${fill.length} (fill value ${fill})`);
  }
  const gradient = extractGradientColor(ctx, fill.substring(URL_PREFIX.length, end));
  if (gradient === undefined) return ugs;
  return applyPlainFill(ugs, gradient, hasStroke);
}

/** @see SvgSaxParser.java:1133-1138, 1144-1149: foreground only when no stroke is set, background always */
function applyPlainFill(ugs: UGraphicWithScale, color: Paint, hasStroke: boolean): UGraphicWithScale {
  const out = hasStroke ? ugs : ugs.apply(new Fore(color));
  return out.apply(new Back(color));
}

/** @see SvgSaxParser.java:1120-1150 (the `fill` block) */
function applyFill(
  ctx: RenderContext,
  ugs: UGraphicWithScale,
  fill: string | undefined,
  stroke: string | undefined,
): UGraphicWithScale {
  if (fill === undefined || fill === '') return ugs;
  if (fill === 'none') return ugs.apply(new Back(ugs.getTrueColor('none')));
  const hasStroke = stroke !== undefined && stroke !== '';
  if (fill.startsWith(URL_PREFIX)) return applyGradientFill(ctx, ugs, fill, hasStroke);
  return applyPlainFill(ugs, ugs.getTrueColor(fill), hasStroke);
}

/**
 * `transform`, then `stroke-width`, `stroke`, then `fill`; each read from the
 * attribute or `style` (style first). `fill="none"` resolves through the colour
 * resolver (`HColors.none()`, as `svg-nanoparser-shapes.ts` documents).
 *
 * @see SvgSaxParser.java:1094-1154 applyStyleAndTransform
 */
export function applyStyleAndTransform(
  ctx: RenderContext,
  attrs: SaxAttributes,
  ugs: UGraphicWithScale,
): UGraphicWithScale {
  const transform = attrs.get('transform');
  let out = transform === undefined || transform === '' ? ugs : applyTransform(ugs, transform);

  const fill = getAttrOrStyle(attrs, 'fill', 'fill');
  const stroke = getAttrOrStyle(attrs, 'stroke', 'stroke');
  out = applyStrokeWidth(out, getAttrOrStyle(attrs, 'stroke-width', 'stroke-width'));
  out = applyStroke(out, stroke, fill);
  return applyFill(ctx, out, fill, stroke);
}

/**
 * `Double.parseDouble` of the attribute, `def` when absent, empty or invalid.
 *
 * @see SvgSaxParser.java:1321-1335 getDoubleAttr
 */
export function getDoubleAttr(attrs: SaxAttributes, name: string, def: number): number {
  const value = attrs.get(name);
  if (value === undefined || value === '') return def;
  return parseJavaDouble(value) ?? def;
}

/** `Integer.parseInt(String)`: `undefined` where Java throws `NumberFormatException`. */
function parseJavaInt(value: string): number | undefined {
  if (!JAVA_INT.test(value)) return undefined;
  const parsed = Number(value);
  return parsed < INT_MIN || parsed > INT_MAX ? undefined : parsed;
}

/**
 * Whole-number size with an optional `px|pt|em|rem` suffix (any case). Java
 * `Integer.parseInt` follows the trim and suffix strip without trimming again,
 * so `"12 px"` and `"12.5"` both give the default.
 *
 * @see SvgSaxParser.java:1254-1283 parseFontSize
 */
export function parseFontSize(s: string | undefined, def: number): number {
  if (s === undefined || s === '') return def;
  return parseJavaInt(javaTrim(s).replace(FONT_SIZE_UNIT, '')) ?? def;
}

/**
 * `UFontWeight.fromCssValue`: clamp to 100..900, round to the nearest hundred.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/UFontWeight.java:97-103
 */
function cssWeightValue(weight: number): number {
  if (weight < CSS_WEIGHT_MIN) return CSS_WEIGHT_MIN;
  if (weight > CSS_WEIGHT_MAX) return CSS_WEIGHT_MAX;
  return Math.floor((weight + CSS_WEIGHT_HALF_STEP) / CSS_WEIGHT_STEP) * CSS_WEIGHT_STEP;
}

/**
 * `UFontFace.fromCssWeight`'s weight: keywords, else a whole number; `undefined`
 * where Java returns `null`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/UFontFace.java:117-141
 */
function fromCssWeight(cssValue: string): number | undefined {
  const trimmed = javaTrim(cssValue).toLowerCase();
  switch (trimmed) {
    case 'normal':
      return CSS_WEIGHT_NORMAL;
    case 'bold':
      return CSS_WEIGHT_BOLD;
    case 'lighter':
      return CSS_WEIGHT_LIGHTER;
    case 'bolder':
      return CSS_WEIGHT_BOLDER;
    default: {
      const parsed = parseJavaInt(trimmed);
      return parsed === undefined ? undefined : cssWeightValue(parsed);
    }
  }
}

/**
 * `font-weight` and `font-style` to a face: weight by `UFontFace.fromCssWeight`
 * (unparseable keeps 400), italic for `italic` or `oblique` in any case.
 *
 * @see SvgSaxParser.java:1285-1301 parseFontFace
 */
export function parseFontFace(weight: string | undefined, style: string | undefined): FontFace {
  const parsedWeight = weight === undefined || weight === '' ? undefined : fromCssWeight(weight);
  const trimmedStyle = style === undefined || style === '' ? '' : javaTrim(style).toLowerCase();
  return {
    cssWeight: parsedWeight ?? CSS_WEIGHT_NORMAL,
    italic: trimmedStyle === 'italic' || trimmedStyle === 'oblique',
  };
}

/**
 * `FontConfiguration#add(FontStyle)`: clone the style set, clear it for PLAIN,
 * add the style, every other field passed through.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontConfiguration.java:301-309
 */
function addFontStyle(fc: FontConfiguration, style: FontStyle): FontConfiguration {
  const styles = new Set(fc.styles);
  if (style === FontStyle.PLAIN) styles.clear();
  styles.add(style);
  return { ...fc, styles };
}

/**
 * `underline` and `line-through` (case-sensitive substrings) add UNDERLINE and
 * STRIKE; empty, absent or `none` (any case) leaves the configuration as is.
 *
 * @see SvgSaxParser.java:1303-1319 applyTextDecoration
 */
export function applyTextDecoration(fc: FontConfiguration, decoration: string | undefined): FontConfiguration {
  if (decoration === undefined || decoration === '' || decoration.toLowerCase() === 'none') return fc;
  let out = fc;
  if (decoration.includes('underline')) out = addFontStyle(out, FontStyle.UNDERLINE);
  if (decoration.includes('line-through')) out = addFontStyle(out, FontStyle.STRIKE);
  return out;
}
