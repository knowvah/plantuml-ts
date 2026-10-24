import type { Paint } from '../../../paint.js';
import { UFontFactory } from '../../font/UFontFactory.js';
import { FontStyle, UText, getFont, type FontConfiguration, type FontFace } from '../../shape/UText.js';
import { UImageSvg } from '../../shape/UImageSvg.js';
import { UStroke } from '../../UStroke.js';
import { UTranslate } from '../../UTranslate.js';
import type { UGraphicWithScale } from '../../UGraphicWithScale.js';
import type { RenderContext } from './sax-context.js';
import type { BufferedElement } from './sax-defs.js';
import type { SaxAttributes } from './sax-events.js';
import { decodeDataImage } from './sax-text-image-use-decode.js';
import {
  applyStyleAndTransform,
  applyTextDecoration,
  getAttrOrStyle,
  getDoubleAttr,
  parseFontFace,
  parseFontSize,
} from './sax-style.js';

/**
 * The `<text>`, `<image>` and `<use>` handlers of `SvgSaxParser.RenderHandler`
 * (plans/sequence-divergence-drive-3 batch-4 T4d). Upstream's private methods
 * read the handler's `ugs`, `colorResolver` and `definitions` fields; here
 * they arrive as the {@link RenderContext}.
 *
 * Every `LOG.fine`/`LOG.warning` is dropped (no output channel in `src/`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSaxParser.java:628-912
 */

/** `fontFamily = "SansSerif"` when none is given. @see SvgSaxParser.java:645-647 */
const DEFAULT_FONT_FAMILY = 'SansSerif';
/** `parseFontSize(fontSize, 12)`. @see SvgSaxParser.java:641 */
const DEFAULT_FONT_SIZE = 12;
/** `text-anchor` values that shift the text. @see SvgSaxParser.java:669-672 */
const ANCHOR_MIDDLE = 'middle';
const ANCHOR_END = 'end';
/** `UFontFace#isBold`: CSS weight 700 and above. @see UFontFace.java:158-160 */
const BOLD_CSS_WEIGHT = 700;
const FILL_NONE = 'none';

/** `String#trim`: strips every char <= U+0020, unlike JS `trim`. */
function javaTrim(text: string): string {
  let start = 0;
  let end = text.length;
  while (start < end && text.charCodeAt(start) <= 0x20) start++;
  while (end > start && text.charCodeAt(end - 1) <= 0x20) end--;
  return text.substring(start, end);
}

/** `Double.parseDouble`'s decimal grammar (`FloatingDecimal.readJavaFormatString`, hex floats aside). */
const JAVA_DOUBLE = /^[+-]?(?:NaN|Infinity|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[fFdD]?)$/;

/** `Double.parseDouble`, `undefined` where Java throws `NumberFormatException`. */
function tryParseDouble(text: string): number | undefined {
  const trimmed = javaTrim(text);
  if (!JAVA_DOUBLE.test(trimmed)) return undefined;
  return Number(trimmed.replace(/[fFdD]$/, ''));
}

/** `Double.parseDouble`; rethrows as Java's uncaught `NumberFormatException`. */
function parseDouble(text: string): number {
  const value = tryParseDouble(text);
  if (value === undefined) throw new Error(`NumberFormatException: For input string: "${text}"`);
  return value;
}

/** `attrs.getValue(name)` read as `x != null && !x.isEmpty() ? Double.parseDouble(x) : 0`. */
function coordinate(attrs: SaxAttributes, name: string): number {
  const text = attrs.get(name);
  return text !== undefined && text !== '' ? parseDouble(text) : 0;
}

// ---------------------------------------------------------------------------
// <text>
// ---------------------------------------------------------------------------

/** `FontConfiguration.getStyles(font)`. @see FontConfiguration.java:67-80 */
function stylesOf(face: FontFace): ReadonlySet<FontStyle> {
  const styles = new Set<FontStyle>();
  if (face.italic) styles.add(FontStyle.ITALIC);
  if (face.cssWeight >= BOLD_CSS_WEIGHT) styles.add(FontStyle.BOLD);
  return styles;
}

/** A gradient has no `string` colour; `FontConfigurationBridge` throws the same cast. */
function solidPaint(paint: Paint): string {
  if (typeof paint !== 'string') throw new Error('ClassCastException: a text colour cannot be a gradient');
  return paint;
}

/**
 * `FontConfiguration.create(font, textColor, textColor, UStroke.simple(), 8)`
 * over `UFontFactory.build(fontFamily, face, fontSizeValue)`. The tab size
 * has no field on this port's `FontConfiguration`.
 *
 * @see SvgSaxParser.java:648-659
 * @see FontConfiguration.java:57-61
 */
function createFontConfiguration(family: string, face: FontFace, size: number, textColor: string): FontConfiguration {
  const font = UFontFactory.build(family, face, size);
  return {
    family: font.getFontStack().getFullDefinition(),
    size: font.getSize(),
    color: textColor,
    styles: stylesOf(font.getFontFace()),
    fontFace: font.getFontFace(),
    hyperlinkColor: textColor,
    hyperlinkUnderlineStroke: UStroke.simple(),
  };
}

/** @see SvgSaxParser.java:651-657 */
function resolveTextColor(elementUgs: UGraphicWithScale, fillString: string | undefined): string {
  const fill = fillString !== undefined && fillString !== '' && fillString !== FILL_NONE ? fillString : undefined;
  return solidPaint(fill === undefined ? elementUgs.getDefaultColor() : elementUgs.getTrueColor(fill));
}

/** @see SvgSaxParser.java:666-675 */
function anchorShift(elementUgs: UGraphicWithScale, utext: UText, textAnchor: string | undefined): number {
  if (textAnchor === undefined || textAnchor === '') return 0;
  const bounder = elementUgs.getUg().getStringBounder();
  // UText#calculateDimension (UText.java:90-92): stringBounder.calculateDimension(font.getFont(), text).
  const textWidth = bounder.calculateDimension(getFont(utext.getFontConfiguration()), utext.getText()).getWidth();
  const anchor = textAnchor.toLowerCase();
  if (anchor === ANCHOR_MIDDLE) return -textWidth / 2.0;
  if (anchor === ANCHOR_END) return -textWidth;
  return 0;
}

/**
 * `<text>`, drawn at `</text>` with the character data of the element.
 *
 * @see SvgSaxParser.java:628-678 handleText (called at `</text>`, :445)
 */
export function handleText(ctx: RenderContext, attrs: SaxAttributes, content: string): void {
  const elementUgs = applyStyleAndTransform(ctx, attrs, ctx.ugs);
  const fontFamily = getAttrOrStyle(attrs, 'font-family', 'font-family');
  const fontSize = getAttrOrStyle(attrs, 'font-size', 'font-size');
  const fontWeight = getAttrOrStyle(attrs, 'font-weight', 'font-weight');
  const fontStyle = getAttrOrStyle(attrs, 'font-style', 'font-style');
  const textDecoration = getAttrOrStyle(attrs, 'text-decoration', 'text-decoration');
  const fillString = getAttrOrStyle(attrs, 'fill', 'fill');

  const textContent = javaTrim(content);
  const fontSizeValue = parseFontSize(fontSize, DEFAULT_FONT_SIZE);
  const face = parseFontFace(fontWeight, fontStyle);
  const family = fontFamily === undefined || fontFamily === '' ? DEFAULT_FONT_FAMILY : fontFamily;

  const textColor = resolveTextColor(elementUgs, fillString);
  const fontConfig = applyTextDecoration(
    createFontConfiguration(family, face, fontSizeValue, textColor),
    textDecoration,
  );
  const utext = UText.build(textContent, fontConfig);

  const x = coordinate(attrs, 'x');
  const y = coordinate(attrs, 'y');
  const shift = anchorShift(elementUgs, utext, attrs.get('text-anchor'));
  elementUgs.apply(new UTranslate(x + shift, y)).draw(utext);
}

// ---------------------------------------------------------------------------
// <image>
// ---------------------------------------------------------------------------

/** Longs saturate: `Math.round(double)` clamps to these. */
const LONG_MAX = 2n ** 63n - 1n;
const LONG_MIN = -(2n ** 63n);

/** @see SvgSaxParser.java:726-731 getHref */
function getHref(attrs: SaxAttributes): string | undefined {
  const href = attrs.get('href');
  return href === undefined || href === '' ? attrs.get('xlink:href') : href;
}

/** @see SvgSaxParser.java:733-752 resolveImageScale */
function resolveImageScale(
  widthAttr: string | undefined,
  heightAttr: string | undefined,
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number,
): number {
  // #lizard forgives -- 6 parameters mirror upstream's `resolveImageScale` signature (:734-735).
  if (imageWidth <= 0 || imageHeight <= 0) return 1.0;
  const scaleX = width / imageWidth;
  const scaleY = height / imageHeight;
  if (widthAttr === undefined && heightAttr === undefined) return 1.0;
  if (Math.abs(scaleX - scaleY) < 0.0001) return scaleX;
  if (widthAttr !== undefined) return scaleX;
  return scaleY;
}

/** `Math.round(double)` for a value that equals its own `rint`: a `long`, saturating. */
function roundToLong(value: number): bigint {
  if (value === Infinity) return LONG_MAX;
  if (value === -Infinity) return LONG_MIN;
  const exact = BigInt(value);
  if (exact > LONG_MAX) return LONG_MAX;
  return exact < LONG_MIN ? LONG_MIN : exact;
}

/**
 * `Double.toString` for a non-integral value: plain decimal for 1e-3 <= |v| < 1e7
 * (where it agrees with JS's shortest round-trip form), `d.dddE<n>` outside.
 */
function javaDoubleToString(value: number): string {
  const magnitude = Math.abs(value);
  if (Number.isNaN(value) || (magnitude >= 1e-3 && magnitude < 1e7)) return String(value);
  const [mantissa, exponent] = value.toExponential().split('e') as [string, string];
  const digits = mantissa.includes('.') ? mantissa : mantissa + '.0';
  return digits + 'E' + String(Number(exponent));
}

/** @see SvgSaxParser.java:809-815 formatNumber */
function formatNumber(value: number): string {
  if (Number.isInteger(value) || value === Infinity || value === -Infinity) return roundToLong(value).toString();
  return javaDoubleToString(value);
}

/** @see SvgSaxParser.java:801-808 buildSvgImage */
function buildSvgImage(href: string, width: number, height: number): string {
  const safeHref = href.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  const w = formatNumber(width);
  const h = formatNumber(height);
  // Concatenated as upstream does (:803-806): the one escaping is the jar's own two-entity
  // `replace` above, so the values must not pass through `attrs()` a second time.
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
    'width="' +
    w +
    '" height="' +
    h +
    '">' +
    '<image x="0" y="0" width="' +
    w +
    '" height="' +
    h +
    '" xlink:href="' +
    safeHref +
    '"/>' +
    '</svg>'
  );
}

/**
 * `<image>` with an embedded PNG/JPEG data URI. Upstream branches on
 * `elementUgs.getUg().matchesProperty("SVG")` (:710): the SVG arm builds a
 * `UImageSvg`, the other a bilinear `UImage` (:718-723). Every graphic this
 * port ever draws through is an SVG one (`StringBounderSvg`/`UGraphicSvg`
 * answer true, `UGraphicSvg.java:175-176`; `UGraphic` carries no
 * `matchesProperty`), so only the SVG arm is taken.
 *
 * @see SvgSaxParser.java:680-724 handleImage
 */
export function handleImage(ctx: RenderContext, attrs: SaxAttributes): void {
  const href = getHref(attrs);
  if (href === undefined || href === '') return;
  const image = decodeDataImage(href);
  if (image === undefined) return;

  const elementUgs = applyStyleAndTransform(ctx, attrs, ctx.ugs);
  const x = getDoubleAttr(attrs, 'x', 0);
  const y = getDoubleAttr(attrs, 'y', 0);

  const widthAttr = attrs.get('width');
  const heightAttr = attrs.get('height');
  const width = getDoubleAttr(attrs, 'width', image.width);
  const height = getDoubleAttr(attrs, 'height', image.height);
  if (width <= 0 || height <= 0) return;

  const scale = resolveImageScale(widthAttr, heightAttr, width, height, image.width, image.height);
  if (scale <= 0) return;

  elementUgs.apply(new UTranslate(x, y)).draw(new UImageSvg(buildSvgImage(href, width, height), 1.0));
}

// ---------------------------------------------------------------------------
// <use>
// ---------------------------------------------------------------------------

const JAVA_REGEX_WHITESPACE: ReadonlySet<string> = new Set([' ', '\t', '\n', '\u000B', '\f', '\r']);
const NUMBER_LIST_SEPARATOR = ',';

/**
 * `raw.trim().split("[,\\s]+")` parsed with `Double.parseDouble`, empty
 * parts and invalid numbers skipped. (`\s` is Java's ASCII class, not JS's.)
 *
 * @see SvgSaxParser.java:1227-1250 parseNumberList
 */
function parseNumberList(raw: string): number[] {
  const values: number[] = [];
  let part = '';
  const flush = (): void => {
    const value = part === '' ? undefined : tryParseDouble(part);
    if (value !== undefined) values.push(value);
    part = '';
  };
  for (const ch of javaTrim(raw)) {
    if (ch === NUMBER_LIST_SEPARATOR || JAVA_REGEX_WHITESPACE.has(ch)) flush();
    else part += ch;
  }
  flush();
  return values;
}

/** @see SvgSaxParser.java:865-892 applySymbolViewport */
function applySymbolViewport(
  referenced: BufferedElement,
  elementUgs: UGraphicWithScale,
  width: number,
  height: number,
): UGraphicWithScale {
  const viewBox = referenced.attributes.get('viewBox');
  if (viewBox === undefined || viewBox === '') return elementUgs;

  const values = parseNumberList(viewBox);
  if (values.length < 4) return elementUgs;

  const [minX, minY, vbWidth, vbHeight] = values as [number, number, number, number];
  if (vbWidth === 0 || vbHeight === 0) return elementUgs;

  const scaleX = width > 0 ? width / vbWidth : 1.0;
  const scaleY = height > 0 ? height / vbHeight : 1.0;
  return elementUgs.applyTranslate(-minX, -minY).applyScale(scaleX, scaleY);
}

/** `wrapSvgFragment`. @see SvgSaxParser.java:894-896 */
function wrapSvgFragment(fragment: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg">${fragment}</svg>`;
}

/** @see SvgSaxParser.java:850-863 renderUseReference */
function renderUseReference(
  ctx: RenderContext,
  referenced: BufferedElement,
  elementUgs: UGraphicWithScale,
  width: number,
  height: number,
): void {
  if (referenced.xmlContent === '') return; // :852-855
  const target =
    referenced.tagName === 'symbol' ? applySymbolViewport(referenced, elementUgs, width, height) : elementUgs;
  ctx.renderFragment(wrapSvgFragment(referenced.xmlContent), target); // :861-862
}

/**
 * `<use href="#id">`: re-renders the buffered definition of `id` at `(x, y)`.
 * A missing id draws nothing (:826-830).
 *
 * @see SvgSaxParser.java:816-848 handleUse
 */
export function handleUse(ctx: RenderContext, attrs: SaxAttributes): void {
  const href = getHref(attrs);
  if (href === undefined || href === '' || !href.startsWith('#')) return;

  const referenced = ctx.definitions.get(href.substring(1));
  if (referenced === undefined) return;

  const x = getDoubleAttr(attrs, 'x', 0);
  const y = getDoubleAttr(attrs, 'y', 0);
  const width = getDoubleAttr(attrs, 'width', -1);
  const height = getDoubleAttr(attrs, 'height', -1);

  let elementUgs = applyStyleAndTransform(ctx, attrs, ctx.ugs);
  if (x !== 0 || y !== 0) {
    const at = elementUgs.getAffineTransform();
    elementUgs = elementUgs.apply(new UTranslate(x * at.getScaleX(), y * at.getScaleY())); // :841-844
  }
  renderUseReference(ctx, referenced, elementUgs, width, height);
}
