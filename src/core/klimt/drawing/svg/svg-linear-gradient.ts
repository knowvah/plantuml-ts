/**
 * svg-linear-gradient.ts -- the multi-stop half of `SvgGraphics#createSvgGradient`.
 * Split out of `svg-graphics-core.ts` (line cap); the core keeps the one
 * `gradients` map and the id counter (`SvgGraphics.java:365,431`) that BOTH
 * overloads share, and calls the pure builders here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:411-461
 */

import type { LinearGradientPaint, LinearGradientStopPaint, Paint } from '../../../paint.js';
import { formatOpacity, formatPercent, shortenColor } from '../../../svg-format.js';
import type { ColorMapper } from '../../color/ColorMapper.js';
import { parseSimpleColor, type ResolvedColor } from '../../color/HColorSet.js';
import { HColorSimple } from '../../color/HColorSimple.js';
import type { XmlDocument, XmlNode } from './xml-writer.js';

/** An opaque 8-bit channel (`XColor#getAlpha` of a fully opaque colour). */
const MAX_ALPHA = 255;
/** `if (opacity < 0.9999)` -- below this a `stop-opacity` is written (`SvgGraphics.java:441`). */
const OPACITY_EMIT_BELOW = 0.9999;
/** `String.format("#%06X", rgb & 0xFFFFFF)` is six uppercase hex digits. */
const HEX_RGB_DIGITS = 6;
const BYTE_BITS = 8;
const TWO_BYTES_BITS = 16;
/** Black, used for a stop colour that is not a colour literal (cannot occur: `getTrueColor` yields a literal). */
const OPAQUE_BLACK: ResolvedColor = { r: 0, g: 0, b: 0, a: MAX_ALPHA };

/** A formatter of one user-space number (`SvgGraphics#format`: scaled, `%.<decimal>f`, zeros trimmed). */
export type NumberFormat = (value: number) => string;

/** `stop.getColor().toColor(mapper)` over the port's `Paint` seam (a gradient stop collapses to its first colour). */
function stopXColor(color: Paint, mapper: ColorMapper): ResolvedColor {
  const solid = typeof color === 'string' ? color : color.color1;
  const resolved = parseSimpleColor(solid);
  return resolved === undefined ? OPAQUE_BLACK : mapper.fromColorSimple(HColorSimple.create(resolved));
}

/** `XColor.toHexRGBColor(color.getRGB())`: `#RRGGBB`, uppercase, alpha dropped. */
function toHexRGB(c: ResolvedColor): string {
  const rgb = (c.r << TWO_BYTES_BITS) | (c.g << BYTE_BITS) | c.b;
  return '#' + rgb.toString(16).padStart(HEX_RGB_DIGITS, '0').toUpperCase();
}

/** `Double.valueOf(x)` as a key part: `Double.equals` tells `-0.0` from `0.0`; `JSON` does not. */
function doublePart(value: number): string {
  return Object.is(value, -0) ? '-0' : String(value);
}

/**
 * `buildLinearGradientKey`: the `gradients` map key of one gradient. The
 * colour part is the RGB hex ONLY -- the alpha byte is not in the key
 * (`SvgGraphics.java:459-461`), so two stops differing only in alpha share an id.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:450-466
 */
export function buildLinearGradientKey(gr: LinearGradientPaint, mapper: ColorMapper): string {
  const parts = ['linear', String(gr.userSpaceOnUse), gr.spreadMethod];
  for (const n of [gr.x1, gr.y1, gr.x2, gr.y2]) parts.push(doublePart(n));
  for (const stop of gr.stops) {
    parts.push(doublePart(stop.offset), toHexRGB(stopXColor(stop.color, mapper)), doublePart(stop.opacity));
  }
  return JSON.stringify(parts);
}

/**
 * The `<linearGradient>` element up to and including `spreadMethod`: the
 * vector in `userSpaceOnUse` user units (`format`) or as `objectBoundingBox`
 * percentages (`formatPercent`). The caller sets `id` next and appends the
 * stops, as the Java does (`:431-432`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:414-430
 */
export function createLinearGradientElement(
  document: XmlDocument,
  gr: LinearGradientPaint,
  format: NumberFormat,
  decimal: number,
): XmlNode {
  const elt = document.createElement('linearGradient');
  if (gr.userSpaceOnUse) elt.setAttribute('gradientUnits', 'userSpaceOnUse');
  const place: NumberFormat = gr.userSpaceOnUse ? format : (value) => formatPercent(value, decimal);
  elt.setAttribute('x1', place(gr.x1));
  elt.setAttribute('y1', place(gr.y1));
  elt.setAttribute('x2', place(gr.x2));
  elt.setAttribute('y2', place(gr.y2));
  if (gr.spreadMethod !== 'PAD') elt.setAttribute('spreadMethod', gr.spreadMethod.toLowerCase());
  return elt;
}

/** One `<stop>`: `offset`, `stop-color` (RGB, shortened), then `stop-opacity` when below 0.9999. */
function createStopElement(
  document: XmlDocument,
  stop: LinearGradientStopPaint,
  mapper: ColorMapper,
  decimal: number,
): XmlNode {
  const stopElt = document.createElement('stop');
  stopElt.setAttribute('offset', formatPercent(stop.offset, decimal));
  const color = stopXColor(stop.color, mapper);
  stopElt.setAttribute('stop-color', shortenColor(toHexRGB(color)));
  const opacity = (color.a / MAX_ALPHA) * stop.opacity;
  if (opacity < OPACITY_EMIT_BELOW) stopElt.setAttribute('stop-opacity', formatOpacity(opacity, decimal));
  return stopElt;
}

/**
 * Append one `<stop>` per normalised stop, in stop order.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:435-445
 */
export function appendLinearGradientStops(
  document: XmlDocument,
  elt: XmlNode,
  gr: LinearGradientPaint,
  mapper: ColorMapper,
  decimal: number,
): void {
  for (const stop of gr.stops) elt.appendChild(createStopElement(document, stop, mapper, decimal));
}
