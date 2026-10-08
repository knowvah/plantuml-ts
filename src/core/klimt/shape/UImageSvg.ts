/**
 * Port of `UImageSvg` -- an SVG document drawn as an image, as
 * `EmbeddedDiagram#drawU` builds it for a `{{ }}` sub-diagram
 * (`EmbeddedDiagram.java:169-174`) -- plus the payload `SvgGraphics#svgImage
 * (UImageSvg, x, y)` wraps it in before base64-encoding it into an
 * `<image xlink:href="data:image/svg+xml;base64,...">`
 * (`SvgGraphics.java:1001-1053`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/UImageSvg.java
 */

import { escapeAttribute } from '../../svg-format.js';

const XLINK_NS_DECL = 'xmlns:xlink="http://www.w3.org/1999/xlink"';
const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const BARE_SVG_OPEN = '<svg>';
const BARE_G_OPEN = '<g>';

/** `UImageSvg.java:95`. */
const BACKGROUND = /background:([^;]+)/;
/** `UImageSvg.java:105`, `(?i)`. */
const STYLE = /<svg[^>]+style="([^">]+)"/i;
/** `UImageSvg.java:114-115`. */
const VIEWBOX = /viewBox[= "']+([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/;

/**
 * One `name="value"` pair, escaped once. Not `attrs()`: that shortens
 * colours (`#FFFFFF` -> `#FFF`), and upstream writes these verbatim
 * (`UImageSvg.java:84-85`, `SvgGraphics.java:1019-1024`).
 */
function attribute(name: string, value: string | number): string {
  return name + '="' + escapeAttribute(String(value)) + '"';
}

/** Java `String#replaceFirst` with a literal replacement (no `$` groups). */
function replaceFirstLiteral(text: string, search: string, replacement: string): string {
  const index = text.indexOf(search);
  if (index === -1) return text;
  return text.slice(0, index) + replacement + text.slice(index + search.length);
}

export class UImageSvg {
  private cachedWidth = -1;
  private cachedHeight = -1;

  constructor(
    private readonly svg: string,
    private readonly scale: number,
  ) {}

  containsXlink(): boolean {
    return this.svg.includes(XLINK_NS_DECL);
  }

  /** `UImageSvg.java:65-93`: the document re-rooted at a bare `<svg>`, its
   *  root `style` background repainted as a leading `<rect>`. */
  getSvg(raw: boolean): string {
    let result = this.svg;
    if (raw) return result;
    if (result.startsWith('<?xml')) result = result.substring(result.indexOf('<svg'));
    if (result.startsWith('<svg')) result = BARE_SVG_OPEN + result.substring(result.indexOf('>') + 1);
    const style = STYLE.exec(this.svg)?.[1];
    const background = style === undefined ? undefined : BACKGROUND.exec(style)?.[1];
    if (style !== undefined && background !== undefined) {
      const size = [attribute('width', this.getData('width')), attribute('height', this.getData('height'))];
      const rect = ['<g><rect', attribute('fill', background), attribute('style', style), ...size].join(' ') + '/> ';
      result = replaceFirstLiteral(result, BARE_G_OPEN, rect);
    }
    if (!result.startsWith(BARE_SVG_OPEN)) throw new Error('UImageSvg: document does not start with <svg');
    return result;
  }

  /** `UImageSvg.java:118-146`: `viewBox` extent rounded UP, else the root's
   *  integer `width`/`height` attribute. */
  getData(name: 'width' | 'height'): number {
    const box = VIEWBOX.exec(this.svg);
    if (box !== null) return Math.ceil(Number(name === 'width' ? box[3] : box[4]));
    const attr = new RegExp(`<svg[^>]+${name}\\W+(\\d+)`, 'i').exec(this.svg);
    if (attr === null) throw new Error(`UImageSvg: cannot find ${name}`);
    return Number.parseInt(attr[1]!, 10);
  }

  getHeight(): number {
    if (this.cachedHeight === -1) this.cachedHeight = this.getData('height');
    return this.cachedHeight * this.scale;
  }

  getWidth(): number {
    if (this.cachedWidth === -1) this.cachedWidth = this.getData('width');
    return this.cachedWidth * this.scale;
  }

  getScale(): number {
    return this.scale;
  }
}

/** `SvgGraphics#manageScale` (`SvgGraphics.java:1037-1053`), `option.getScale()`
 *  fixed at 1 (this port has no global SVG output scale). */
function manageScale(image: UImageSvg): string {
  const svgScale = image.getScale();
  let svg = image.getSvg(false);
  if (svgScale === 1) return svg;
  const flat = svg.replace(/[\n\r]/g, ' ');
  if (!flat.includes('<g ') && !flat.includes(BARE_G_OPEN)) {
    svg = replaceFirstLiteral(svg, BARE_SVG_OPEN, '<svg><g>');
    svg = replaceFirstLiteral(svg, '</svg>', '</g></svg>');
  }
  const factor = String(svgScale);
  return svg.replace(/<g\b/, '<g ' + attribute('transform', `scale(${factor},${factor})`) + ' ');
}

/**
 * The SVG text `SvgGraphics#svgImage(UImageSvg, x, y)` base64-encodes into
 * its `<image>` href (`SvgGraphics.java:1015-1026`): a fresh root carrying
 * only the integer `height`/`width` and the namespace declarations, followed
 * by everything after `getSvg`'s bare `<svg>`.
 */
export function svgImagePayload(image: UImageSvg): string {
  const svg = manageScale(image);
  const height = Math.trunc(image.getHeight());
  const width = Math.trunc(image.getWidth());
  const root = [attribute('height', height), attribute('width', width)];
  if (image.containsXlink()) root.push(attribute('xmlns:xlink', XLINK_NS));
  root.push(attribute('xmlns', SVG_NS));
  return '<svg ' + root.join(' ') + ' >' + svg.substring(BARE_SVG_OPEN.length);
}
