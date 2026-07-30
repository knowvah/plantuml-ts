/**
 * svg-nanoparser-shapes.ts -- the `<circle>`/`<ellipse>`/`<text>` element
 * emitters plus the shared `applyFillAndStroke`/`getFillString` attribute
 * resolution `SvgNanoParser.drawU` dispatches to, split into its own
 * module per this task's complexity-hook budget (the combined port
 * exceeded the 500-line split threshold; none of these functions read
 * `SvgNanoParser`'s own instance state -- `data`/`minGray`/`maxGray` --
 * so they extract cleanly as free functions, matching
 * `svg-nanoparser-transform.ts`'s own split).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgNanoParser.java
 * (`applyFillAndStroke`/`drawCircle`/`drawEllipse`/`drawText`/
 * `getTextFontFamily`/`getTextFontSize`/`getFillString`)
 */

import type { UGraphicWithScale } from '../UGraphicWithScale.js';
import type { Paint } from '../../paint.js';
import { UStroke } from '../UStroke.js';
import { Fore } from '../Fore.js';
import { Back } from '../Back.js';
import { UEllipse } from '../shape/UEllipse.js';
import { UPath } from '../shape/UPath.js';
import { UText } from '../shape/UText.js';
import type { FontConfiguration } from '../shape/UText.js';
import { UTranslate } from '../UTranslate.js';
import type { ResolvedColor } from '../color/HColorSet.js';
import { parseSimpleColor, toSvgHex } from '../color/HColorSet.js';
import { extract, applyTransformAttribute } from './svg-nanoparser-transform.js';

/**
 * `emoji/GrayLevelRange.java`'s and `HColorSet#getColorOrWhite`'s WHITE
 * fallback, duplicated from `ColorResolver.ts`'s own identical private
 * constant (that file does not export it, and this task's write-set does
 * not extend to adding an export there) -- same rationale as
 * `SvgNanoParser.ts`'s own copy.
 */
const WHITE: ResolvedColor = { r: 255, g: 255, b: 255, a: 255 };

/**
 * `HColors.none()` stand-in, matching the established convention at
 * `AbstractCommonUGraphic.ts`/`StripeTree.ts` (`Paint` has no explicit
 * "unset" variant, so the SVG paint keyword `'none'` is used directly).
 * `applyFillAndStroke`'s `"none".equals(fillString)` branch applies this
 * as a background ONLY (`HColors.none().bg()`) -- not via `getTrueColor`,
 * which is why this is a literal sentinel rather than a call through the
 * color resolver.
 */
const NONE_PAINT: Paint = 'none';

/** `P_TEXT = "\<text[^<>]*\>(.*?)\</text\>"` -- unchanged, no dotAll flag
 *  (matches Java's default `.` semantics). */
const P_TEXT = /<text[^<>]*>(.*?)<\/text>/;
/** `P_FONT_SIZE = "^(\d+)p[tx]$"`, unchanged. */
const P_FONT_SIZE = /^(\d+)p[tx]$/;

/** `equals_something = "=\"([^\"]+)\""`. */
const EQUALS_SOMETHING = '="([^"]+)"';
const DATA_CX = new RegExp('cx' + EQUALS_SOMETHING);
const DATA_CY = new RegExp('cy' + EQUALS_SOMETHING);
const DATA_FILL = new RegExp('fill' + EQUALS_SOMETHING);
const DATA_FONT_FAMILY = new RegExp('font-family' + EQUALS_SOMETHING);
const DATA_FONT_SIZE = new RegExp('font-size' + EQUALS_SOMETHING);
const DATA_R = new RegExp('r' + EQUALS_SOMETHING);
const DATA_RX = new RegExp('rx' + EQUALS_SOMETHING);
const DATA_RY = new RegExp('ry' + EQUALS_SOMETHING);
/** Exported: `SvgNanoParser.ts#computeMinMaxGray` also reads `stroke=`
 *  directly (not through `getFillString`), so this one const is shared
 *  rather than duplicated. */
export const DATA_STROKE = new RegExp('stroke' + EQUALS_SOMETHING);
const DATA_STROKE_WIDTH = new RegExp('stroke-width' + EQUALS_SOMETHING);
const DATA_STYLE = new RegExp('style' + EQUALS_SOMETHING);
const DATA_X = new RegExp('x' + EQUALS_SOMETHING);
const DATA_Y = new RegExp('y' + EQUALS_SOMETHING);

/** `colon_something = ":([^;\"]+)"`. */
const COLON_SOMETHING = ':([^;"]+)';
/** `Pattern.quote("fill") + colon_something` -- `Pattern.quote` is a no-op
 *  here since "fill" contains no regex metacharacters, so the literal
 *  string is used directly rather than adding an escaping helper. */
const STYLE_FILL = new RegExp('fill' + COLON_SOMETHING);
const STYLE_FONT_SIZE = new RegExp('font-size' + COLON_SOMETHING);
const STYLE_FONT_FAMILY = new RegExp('font-family' + COLON_SOMETHING);

/**
 * `HColorSet#getColorOrWhite`, scoped to the single-token hex/named-color
 * path a raw `<text>` `fill=`/`style="fill:..."` value uses -- same scope
 * decision `ColorResolver.ts`'s own private `getColorOrWhite` documents
 * (not upstream's full gradient-separator `parseColor`). `undefined`
 * (attribute absent) resolves to white, matching `HColorSet#parseColor
 * (null)` -> `null` -> `getColorOrWhite`'s `WHITE` fallback.
 */
function getColorOrWhite(code: string | undefined): ResolvedColor {
  if (code === undefined) return WHITE;
  return parseSimpleColor(code) ?? WHITE;
}

/** @see SvgNanoParser.java#getFillString */
export function getFillString(s: string, stackG: readonly string[] | null): string | undefined {
  let color = extract(DATA_FILL, s);
  if (color === undefined) {
    const style = extract(DATA_STYLE, s);
    if (style !== undefined) color = extract(STYLE_FILL, style);
  }

  if (color === undefined && stackG !== null) {
    for (const g of stackG) {
      color = getFillString(g, null);
      if (color !== undefined) return color;
    }
  }

  return color;
}

/**
 * @see SvgNanoParser.java#applyFillAndStroke
 *
 * `ugs.apply(stroke)`/`.apply(fill)` (upstream: `HColor` itself is a
 * `UChange`) become `.apply(new Fore(paint))`; `.bg()` (upstream:
 * `HColor#bg()`) becomes `new Back(paint)` -- this port's `Paint`
 * carries no methods of its own, matching every other klimt seam
 * (`UBackground.ts`/`UForeground.ts`).
 */
export function applyFillAndStroke(
  ugs: UGraphicWithScale,
  s: string,
  stackG: readonly string[],
): UGraphicWithScale {
  const fillString = getFillString(s, stackG);
  const strokeString = extract(DATA_STROKE, s);

  const strokeWidth = extract(DATA_STROKE_WIDTH, s);
  if (strokeWidth !== undefined) {
    const scale = ugs.getInitialScale();
    ugs = ugs.apply(UStroke.withThickness(scale * Number.parseFloat(strokeWidth)));
  }

  if (strokeString !== undefined) {
    const stroke = ugs.getTrueColor(strokeString);
    ugs = ugs.apply(new Fore(stroke));
    if (fillString === undefined) return ugs.apply(new Back(ugs.getDefaultColor()));
  }

  if (fillString === 'none') {
    ugs = ugs.apply(new Back(NONE_PAINT));
  } else {
    const fill = fillString === undefined ? ugs.getDefaultColor() : ugs.getTrueColor(fillString);

    if (strokeString === undefined) ugs = ugs.apply(new Fore(fill));
    ugs = ugs.apply(new Back(fill));
  }

  return ugs;
}

/** @see SvgNanoParser.java#drawCircle */
export function drawCircle(ugs: UGraphicWithScale, s: string, stackG: readonly string[]): void {
  ugs = applyFillAndStroke(ugs, s, stackG);
  ugs = applyTransformAttribute(ugs, s);

  const at = ugs.getAffineTransform();
  const scalex = at.getScaleX();
  const scaley = at.getScaleY();

  const deltax = at.getTranslateX();
  const deltay = at.getTranslateY();

  const cx = Number.parseFloat(extract(DATA_CX, s)!) * scalex;
  const cy = Number.parseFloat(extract(DATA_CY, s)!) * scaley;
  const rx = Number.parseFloat(extract(DATA_R, s)!) * scalex;
  const ry = Number.parseFloat(extract(DATA_R, s)!) * scaley;

  const translate = new UTranslate(deltax + cx - rx, deltay + cy - ry);
  ugs.apply(translate).draw(UEllipse.build(rx * 2, ry * 2));
}

/**
 * @see SvgNanoParser.java#drawEllipse
 *
 * Upstream's local `debug` variable is a compile-time-constant `false`
 * with no way to ever become `true` (no flag/toggle reaches it), so its
 * four `if (debug) lineTo(...) else arcTo(...)` pairs always take the
 * `arcTo` branch -- ported as that single reachable branch, not as a
 * dead conditional.
 */
export function drawEllipse(ugs: UGraphicWithScale, s: string, stackG: readonly string[]): void {
  ugs = applyFillAndStroke(ugs, s, stackG);
  ugs = applyTransformAttribute(ugs, s);

  const cx = Number.parseFloat(extract(DATA_CX, s)!);
  const cy = Number.parseFloat(extract(DATA_CY, s)!);
  const rx = Number.parseFloat(extract(DATA_RX, s)!);
  const ry = Number.parseFloat(extract(DATA_RY, s)!);

  let path = UPath.none();
  path.moveTo(0, ry);
  path.arcTo(rx, ry, 0, 0, 1, rx, 0);
  path.arcTo(rx, ry, 0, 0, 1, 2 * rx, ry);
  path.arcTo(rx, ry, 0, 0, 1, rx, 2 * ry);
  path.arcTo(rx, ry, 0, 0, 1, 0, ry);
  path.closePath();

  path = path.translate(cx - rx, cy - ry);
  path = path.affine(ugs.getAffineTransform(), ugs.getAngle(), ugs.getInitialScale());

  ugs.draw(path);
}

/** @see SvgNanoParser.java#getTextFontFamily */
function getTextFontFamily(s: string, stackG: readonly string[] | null): string | undefined {
  let family = extract(DATA_FONT_FAMILY, s);
  if (family === undefined) {
    const style = extract(DATA_STYLE, s);
    if (style !== undefined) family = extract(STYLE_FONT_FAMILY, style);
  }
  if (family === undefined && stackG !== null) {
    for (const g of stackG) {
      family = getTextFontFamily(g, null);
      if (family !== undefined) return family;
    }
  }
  return family;
}

/** @see SvgNanoParser.java#getTextFontSize */
function getTextFontSize(s: string): number {
  let fontSize = extract(DATA_FONT_SIZE, s);
  if (fontSize === undefined) {
    const style = extract(DATA_STYLE, s);
    if (style !== undefined) fontSize = extract(STYLE_FONT_SIZE, style);
  }
  if (fontSize === undefined) return 14;

  if (P_FONT_SIZE.test(fontSize)) return Number.parseInt(fontSize.replace(/[a-z]/g, ''), 10);

  return Number.parseInt(fontSize, 10);
}

/** @see SvgNanoParser.java#drawText */
export function drawText(ugs: UGraphicWithScale, s: string, stackG: readonly string[]): void {
  ugs = applyFillAndStroke(ugs, s, stackG);
  ugs = applyTransformAttribute(ugs, s);

  const at = ugs.getAffineTransform();
  const scalex = at.getScaleX();
  const scaley = at.getScaleY();

  const deltax = at.getTranslateX();
  const deltay = at.getTranslateY();

  const x = Number.parseFloat(extract(DATA_X, s)!) * scalex + deltax;
  const y = Number.parseFloat(extract(DATA_Y, s)!) * scaley + deltay;
  const fontColor = getFillString(s, stackG);
  const fontSize = Math.trunc(getTextFontSize(s) * ugs.getInitialScale());

  const m = P_TEXT.exec(s);
  if (m !== null) {
    const text = m[1]!;
    const color = toSvgHex(getColorOrWhite(fontColor));
    const fontFamily = getTextFontFamily(s, stackG) ?? 'SansSerif';
    const fc: FontConfiguration = { family: fontFamily, size: fontSize, color, styles: new Set() };
    const utext = UText.build(text, fc);
    const ug = ugs.getUg().apply(new UTranslate(x, y));
    ug.draw(utext);
  }
}
