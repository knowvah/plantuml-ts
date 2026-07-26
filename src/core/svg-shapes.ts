/**
 * SVG shape emitters (rect/line/text/image/path/ellipse/diamond/polygon).
 * Split out of `svg.ts` (line cap); imports the low-level attr/paint helpers
 * from svg.ts. Re-exported from svg.ts so existing import sites are unchanged.
 */

import {} from './paint.js';
import type {} from './paint.js';
import { attrs, escapeXml, resolvePaint, resolvePaintAttrs, attrsFromRecord, type BoxStyle, type LineStyle, type TextStyle, type SvgAttrsPaint } from './svg.js';

/**
 * `<rect>` element.
 */
export function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  style: BoxStyle = {},
): string {
  const fillR = resolvePaint(style.fill);
  const strokeR = resolvePaint(style.stroke);
  const a = attrs([
    ['x', x],
    ['y', y],
    ['width', w],
    ['height', h],
    ['fill', fillR.value],
    ['stroke', strokeR.value],
    ['stroke-width', style.strokeWidth],
    ['stroke-dasharray', style.strokeDasharray],
    ['rx', style.rx],
    ['ry', style.ry],
    ['opacity', style.opacity],
    ['filter', style.filter],
  ] as const);
  return `${fillR.def}${strokeR.def}<rect${a}/>`;
}

/**
 * `<line>` element.
 */
export function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: LineStyle = {},
): string {
  const strokeR = resolvePaint(style.stroke);
  const a = attrs([
    ['x1', x1],
    ['y1', y1],
    ['x2', x2],
    ['y2', y2],
    ['stroke', strokeR.value],
    ['stroke-width', style.strokeWidth],
    ['stroke-dasharray', style.strokeDasharray],
    ['marker-end', style.markerEnd],
    ['marker-start', style.markerStart],
  ] as const);
  return `${strokeR.def}<line${a}/>`;
}

/**
 * `<text>` element with plain (un-tspan-wrapped) text content.
 *
 * G2 N4: previously ALWAYS wrapped content in a bare `<tspan>` -- removed.
 * jar's own single-run text draws (`SvgGraphicsCore#text`/
 * `svg-graphics-elements.ts`'s own `setTextContent`, which this port's
 * klimt path already mirrors with zero `<tspan>`) never wrap a simple
 * string in `<tspan>` at all -- `<tspan>` is reserved for MULTI-styled-run
 * or explicit multi-LINE text, each getting its OWN dedicated `<tspan
 * x="..." y="...">` (e.g. `diagrams/activity/renderer.ts`'s own multiline
 * builder, which never calls this function). Verified: 0/351+ cached jar
 * fixtures across `state`/`object` (the two other `core/svg.ts#text()`
 * consumers surveyed) contain a `<tspan>` for a single-run label; this was
 * a universal, cross-diagram-type divergence (`svg/g/g/text/tspan`,
 * 407/718 reach in class's own census alone, `plans/g2-class-svg/
 * ledger.md` N4) -- description/component/usecase are UNAFFECTED (klimt-
 * drawn, never call this function; their own census stays byte-identical).
 *
 * Content is XML-escaped. Style attributes are placed on the outer `<text>`.
 */
/**
 * Normalize a raw skinparam font-family value for SVG attribute emission.
 *
 * `skinparam defaultFontName "Liberation Mono"` retains its surrounding
 * quotes as part of the theme's raw string (mirrors upstream's own
 * `FontStack#fullDefinition`, which keeps them too) -- but `attrs()` below
 * does no XML escaping, so embedding a literal `"` inside a `"`-delimited
 * attribute value produces malformed XML. Upstream's own SVG writer
 * (`FontStack#getSvgFamily`, klimt/font/FontStack.java:187) resolves this
 * the SAME way: swap `"` for `'` rather than stripping/escaping -- jar-
 * verified (`tipude-10-tizi427`: `font-family="'Liberation Mono'"`). G2 N12.
 */
function toSvgFontFamily(family: string | undefined): string | undefined {
  return family === undefined ? undefined : family.replace(/"/g, "'");
}

export function text(
  x: number,
  y: number,
  content: string,
  style: TextStyle = {},
): string {
  const fillR = resolvePaint(style.fill);
  const a = attrs([
    ['x', x],
    ['y', y],
    ['font-family', toSvgFontFamily(style.fontFamily)],
    ['font-size', style.fontSize],
    ['font-weight', style.fontWeight],
    ['font-style', style.fontStyle],
    ['fill', fillR.value],
    ['text-anchor', style.textAnchor],
    ['dominant-baseline', style.dominantBaseline],
    ['text-decoration', style.textDecoration],
    ['lengthAdjust', style.lengthAdjust],
    ['textLength', style.textLength],
  ] as const);
  return `${fillR.def}<text${a}>${escapeXml(content)}</text>`;
}

/**
 * `<image>` element -- G2 N22 (class-member-creole inline `<img>`/`<$sprite>`
 * atoms). Attribute order matches `klimt/drawing/svg/svg-graphics-elements
 * .ts#svgImageDataUri` (upstream: `SvgGraphics#svgImageDataUri`) exactly:
 * width, height, x, y, xlink:href -- the SAME shape `driver-image-svg.ts`
 * already produces for description's `UImage`-based renderer; this is the
 * pure-string equivalent for class's non-klimt renderer, no double port (both
 * ultimately just set these 5 attributes on an `<image>` element).
 */
export function image(x: number, y: number, width: number, height: number, href: string): string {
  const a = attrs([
    ['width', width],
    ['height', height],
    ['x', x],
    ['y', y],
    ['xlink:href', href],
  ] as const);
  return `<image${a}/>`;
}

/**
 * `<path>` element. Always rendered with fill="none" — paths are used
 * exclusively for lines and edges, never for filled shapes.
 */
export function path(d: string, style: LineStyle = {}): string {
  const strokeR = resolvePaint(style.stroke);
  const fillR = style.fill !== undefined ? resolvePaint(style.fill) : undefined;
  const a = attrs([
    ['d', d],
    ['fill', fillR?.value ?? 'none'],
    ['stroke', strokeR.value],
    ['stroke-width', style.strokeWidth],
    ['stroke-dasharray', style.strokeDasharray],
    ['marker-end', style.markerEnd],
    ['marker-start', style.markerStart],
    ['id', style.id],
    ['codeLine', style.codeLine],
  ] as const);
  return `${strokeR.def}${fillR?.def ?? ''}<path${a}/>`;
}

/**
 * `<ellipse>` element centred at (cx, cy) with horizontal radius rx and
 * vertical radius ry.  Optional SvgAttrs are appended after the geometry
 * attributes.
 */
export function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  extraAttrs?: SvgAttrsPaint,
): string {
  const a = attrs([
    ['cx', cx],
    ['cy', cy],
    ['rx', rx],
    ['ry', ry],
  ] as const);
  const resolved =
    extraAttrs !== undefined ? resolvePaintAttrs(extraAttrs) : undefined;
  const extra = resolved !== undefined ? attrsFromRecord(resolved.plain) : '';
  const def = resolved?.def ?? '';
  return `${def}<ellipse${a}${extra}/>`;
}

/**
 * Diamond shape rendered as a `<polygon>`.
 *
 * The four points are computed from the centre (cx, cy) and the half-size:
 * - top:    (cx, cy - size)
 * - right:  (cx + size, cy)
 * - bottom: (cx, cy + size)
 * - left:   (cx - size, cy)
 */
export function diamond(
  cx: number,
  cy: number,
  size: number,
  extraAttrs?: SvgAttrsPaint,
): string {
  const points =
    `${cx},${cy - size} ` +
    `${cx + size},${cy} ` +
    `${cx},${cy + size} ` +
    `${cx - size},${cy}`;
  const a = attrs([['points', points]] as const);
  const resolved =
    extraAttrs !== undefined ? resolvePaintAttrs(extraAttrs) : undefined;
  const extra = resolved !== undefined ? attrsFromRecord(resolved.plain) : '';
  const def = resolved?.def ?? '';
  return `${def}<polygon${a}${extra}/>`;
}

/**
 * `<polygon>` from an explicit point list, with fill/stroke styling.
 */
export function polygon(
  points: ReadonlyArray<{ x: number; y: number }>,
  style: BoxStyle = {},
): string {
  const pts = points.map((p) => `${p.x},${p.y}`).join(' ');
  const fillR = resolvePaint(style.fill);
  const strokeR = resolvePaint(style.stroke);
  const a = attrs([
    ['points', pts],
    ['fill', fillR.value],
    ['stroke', strokeR.value],
    ['stroke-width', style.strokeWidth],
    ['stroke-dasharray', style.strokeDasharray],
  ] as const);
  return `${fillR.def}${strokeR.def}<polygon${a}/>`;
}
