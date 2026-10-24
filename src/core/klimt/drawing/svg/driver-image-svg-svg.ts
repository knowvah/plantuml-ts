/**
 * driver-image-svg-svg.ts — `UImageSvg` → SVG `<image>` with an inlined,
 * base64-encoded SVG document (`DriverImageSvgSvg`).
 *
 * `DriverImageSvgSvg#draw` only forwards to `SvgGraphics#svgImage(UImageSvg,
 * x, y)`; that method's secure branch (`SvgGraphics.java:1008-1035`) is
 * ported here on top of this port's `SvgGraphics#svgImageDataUri`, which
 * already emits the `<image width height x y xlink:href>` element
 * (`SvgGraphics.java:1008-1013`) and the `ensureVisible` pair. The
 * `SecurityProfile.INSECURE` branch (`svgImageUnsecure`, `:987-999`,
 * `:1002-1004`) is not ported: the profile is a process-global
 * `PLANTUML_SECURITY_PROFILE` read this port never makes, so it is never
 * INSECURE here. `ensureVisible` upstream uses the unscaled `getData`
 * extent while `svgImageDataUri` uses the element's own; they differ only
 * for `UImageSvg.getScale() != 1`, which the one drawer of this shape
 * (`SvgSaxParser#handleImage`, `new UImageSvg(svgImage, 1.0)`, :712-713) never
 * builds.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverImageSvgSvg.java:42-44
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:1001-1050
 */

import type { UDriver } from '../../AbstractCommonUGraphic.js';
import type { UParam } from '../../UParam.js';
import type { UImageSvg } from '../../shape/UImageSvg.js';
import { toBase64 } from '../../sprite/png-encoder.js';
import { escapeAttribute, formatDecimal } from '../../../svg-format.js';
import type { SvgGraphics } from './svg-graphics.js';
import type { SvgOption } from './svg-option.js';

const DATA_URI_PREFIX = 'data:image/svg+xml;base64,';
const XLINK_ATTRIBUTE = 'xmlns:xlink="http://www.w3.org/1999/xlink" ';
const SVG_ATTRIBUTES = 'xmlns="http://www.w3.org/2000/svg" >';
const BARE_SVG_OPEN = '<svg>';
const BARE_SVG_CLOSE = '</svg>';
const GROUP_OPEN_PATTERN = /<g\b/;

/** `name="value"`, the value escaped once (the numbers here need none). */
function attribute(name: string, value: string | number): string {
  return name + '="' + escapeAttribute(String(value)) + '"';
}

/** Java's `String#replaceFirst` with a literal pattern and replacement. */
function replaceFirstLiteral(text: string, search: string, replacement: string): string {
  const index = text.indexOf(search);
  return index === -1 ? text : text.slice(0, index) + replacement + text.slice(index + search.length);
}

/**
 * `SvgGraphics#manageScale`: the document with its first `<g>` carrying
 * `scale(f,f)`, `f = format(svgScale)` (so the option scale is applied by
 * `format`), unless both scales cancel out.
 *
 * @see SvgGraphics.java:1037-1050
 */
function manageScale(image: UImageSvg, option: SvgOption): string {
  const svgScale = image.getScale();
  let svg = image.getSvg(false);
  if (svgScale * option.scale === 1) return svg;

  const flat = svg.replace(/[\n\r]/g, ' ');
  if (!flat.includes('<g ') && !flat.includes('<g>')) {
    svg = replaceFirstLiteral(svg, BARE_SVG_OPEN, '<svg><g>');
    svg = replaceFirstLiteral(svg, BARE_SVG_CLOSE, '</g></svg>');
  }
  const factor = formatDecimal(svgScale * option.scale, option.decimal);
  return svg.replace(GROUP_OPEN_PATTERN, () => `<g ${attribute('transform', `scale(${factor},${factor})`)} `);
}

/**
 * The document `svgImage` base64-encodes: a fresh root with the integer
 * `height`/`width` (`(int)(size * option.getScale())`) and the namespaces,
 * then everything after the bare `<svg>` of `manageScale`'s result.
 *
 * @see SvgGraphics.java:1015-1026
 */
function svgImageDocument(image: UImageSvg, option: SvgOption): string {
  const svg = manageScale(image, option);
  const height = Math.trunc(image.getHeight() * option.scale);
  const width = Math.trunc(image.getWidth() * option.scale);
  const xlink = image.containsXlink() ? XLINK_ATTRIBUTE : '';
  const root = `<svg ${attribute('height', height)} ${attribute('width', width)} ${xlink}${SVG_ATTRIBUTES}`;
  return root + svg.substring(BARE_SVG_OPEN.length);
}

/** `UImageSvg` → `<image>` carrying the SVG as a base64 data URI. */
export class DriverImageSvgSvg implements UDriver<UImageSvg> {
  constructor(
    private readonly svg: SvgGraphics,
    private readonly option: SvgOption,
  ) {}

  /** @see DriverImageSvgSvg.java:42-44 */
  draw(image: UImageSvg, param: UParam): void {
    const x = param.getTranslate().getDx();
    const y = param.getTranslate().getDy();
    const href = DATA_URI_PREFIX + toBase64(new TextEncoder().encode(svgImageDocument(image, this.option)));
    this.svg.svgImageDataUri(x, y, image.getWidth(), image.getHeight(), href);
  }
}
