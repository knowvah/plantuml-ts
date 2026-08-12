/**
 * SVG shape emitters (rect/line/text/image/path/ellipse/diamond/polygon).
 * Split out of `svg.ts` (line cap); imports the low-level attr/paint helpers
 * from svg.ts. Re-exported from svg.ts so existing import sites are unchanged.
 */

import {} from './paint.js';
import type {} from './paint.js';
import { attrs, escapeXmlText, resolvePaint, resolvePaintAttrs, attrsFromRecord, strokeDecorationOf, PAINT_NONE, type BoxStyle, type LineStyle, type TextStyle, type SvgAttrsPaint } from './svg.js';
import { textFontFamily, emittedTextForm } from './svg-text-font.js';
export { emittedTextForm } from './svg-text-font.js';
import { DEFAULT_SVG_DECIMALS, fmt, formatOpacity, shortenColor } from './svg-format.js';
import { roundedCornerAttrs } from './svg-rect-corners.js';

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
  const sd = strokeDecorationOf(strokeR.value, style.strokeWidth, style.strokeDasharray);
  const opacity = style.opacity === undefined ? undefined : formatOpacity(style.opacity, DEFAULT_SVG_DECIMALS);
  const a = attrs([
    ['x', x],
    ['y', y],
    ['width', w],
    ['height', h],
    ['fill', fillR.value],
    ['stroke', strokeR.value],
    ['stroke-width', sd.strokeWidth],
    ['stroke-dasharray', sd.strokeDasharray],
    ...roundedCornerAttrs(style.rx, style.ry),
    ['opacity', opacity],
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
  const sd = strokeDecorationOf(strokeR.value, style.strokeWidth, style.strokeDasharray);
  const a = attrs([
    ['x1', x1],
    ['y1', y1],
    ['x2', x2],
    ['y2', y2],
    ['stroke', strokeR.value],
    ['stroke-width', sd.strokeWidth],
    ['stroke-dasharray', sd.strokeDasharray],
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
 * Rule 5: a one-character label has no inter-character spacing to adjust, so
 * `textLength` is skipped for it (upstream's own `text.length() > 1` guard
 * and its rationale). `textLength` stays per-element otherwise — unlike
 * `lengthAdjust`, it is not inheritable.
 */
function textLengthOf(content: string, textLength: number | undefined): number | undefined {
  return content.length > 1 ? textLength : undefined;
}

export function text(
  x: number,
  y: number,
  rawContent: string,
  style: TextStyle = {},
): string {
  const content = emittedTextForm(rawContent, style.fontFamily);
  const fillR = resolvePaint(style.fill);
  const a = attrs([
    ['x', x],
    ['y', y],
    ['font-family', textFontFamily(style.fontFamily)],
    ['font-size', style.fontSize],
    ['font-weight', style.fontWeight],
    ['font-style', style.fontStyle],
    ['fill', fillR.value],
    ['text-anchor', style.textAnchor],
    ['transform', style.transform],
    ['dominant-baseline', style.dominantBaseline],
    ['text-decoration', style.textDecoration],
    // Rule 3: no `lengthAdjust` — hoisted onto the document root and
    // inherited. `TextStyle.lengthAdjust` is kept as a field (callers still
    // set it) but is no longer emitted per element.
    ['textLength', textLengthOf(content, style.textLength)],
  ] as const);
  return `${fillR.def}<text${a}>${escapeXmlText(content)}</text>`;
}

/**
 * `<text>` with stacked `<tspan>` children -- one per line, advancing the
 * baseline by `lineHeight`. Upstream has no single element for this (its
 * `TextBlock` composes one `svgText` per line), but five byte-identical
 * hand-built copies existed in `activity-renderer-shapes.ts` alone, each
 * with its own `toFixed(1)` and its own three-`replace` XML escaping. This
 * is the one emitter they now share, so rules 1-3 reach them.
 *
 * The parent `<text>` carries the shared attributes only; `x`/`y` live on
 * the tspans, which is why this cannot just call {@link text}.
 */
export function multilineText(
  lines: readonly string[],
  x: number,
  firstBaselineY: number,
  lineHeight: number,
  style: TextStyle = {},
): string {
  const fillR = resolvePaint(style.fill);
  const a = attrs([
    ['text-anchor', style.textAnchor],
    ['font-family', textFontFamily(style.fontFamily)],
    ['font-size', style.fontSize],
    ['font-weight', style.fontWeight],
    ['font-style', style.fontStyle],
    ['fill', fillR.value],
  ] as const);
  const tspans = lines
    .map((ln, i) => {
      const ta = attrs([
        ['x', x],
        ['y', firstBaselineY + lineHeight * i],
      ] as const);
      return `<tspan${ta}>${escapeXmlText(ln)}</tspan>`;
    })
    .join('');
  return `${fillR.def}<text${a}>${tspans}</text>`;
}

/**
 * A single `<tspan>`. Same attribute choke point as {@link text}, so a color
 * inside a creole run shortens exactly like one on a plain label -- they did
 * not, and `spansToTspan` also emitted its content raw, producing invalid
 * XML for any text containing `&` or `<`.
 */
export function tspan(content: string, style: TextStyle = {}): string {
  const fillR = resolvePaint(style.fill);
  const a = attrs([
    ['fill', fillR.value],
    ['font-weight', style.fontWeight],
    ['font-style', style.fontStyle],
    ['text-decoration', style.textDecoration],
  ] as const);
  return `${fillR.def}<tspan${a}>${escapeXmlText(content)}</tspan>`;
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
  const sd = strokeDecorationOf(strokeR.value, style.strokeWidth, style.strokeDasharray);
  const a = attrs([
    ['d', d],
    ['fill', fillR?.value ?? PAINT_NONE],
    ['fill-opacity', style.fillOpacity === undefined ? undefined : formatOpacity(style.fillOpacity, DEFAULT_SVG_DECIMALS)],
    ['stroke', strokeR.value],
    ['stroke-width', sd.strokeWidth],
    ['stroke-dasharray', sd.strokeDasharray],
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
 * `<circle>` element. Distinct from {@link ellipse} on purpose: twelve call
 * sites across the activity, sequence and json engines already emit a real
 * `<circle>`, and rewriting them as an equal-radii `<ellipse>` would change
 * the emitted element for no benefit. What they were missing is this
 * function's whole point -- going through {@link attrs}, which is where
 * rule 1 (decimal formatting) and rule 2 (`shortenColor`) are applied.
 *
 * Attribute order matches what those call sites already emitted, so the only
 * byte difference is the formatting that was missing.
 */
export function circle(cx: number, cy: number, r: number, style: BoxStyle = {}): string {
  const fillR = resolvePaint(style.fill);
  const strokeR = resolvePaint(style.stroke);
  const sd = strokeDecorationOf(strokeR.value, style.strokeWidth, style.strokeDasharray);
  const a = attrs([
    ['cx', cx],
    ['cy', cy],
    ['r', r],
    ['fill', fillR.value],
    ['stroke', strokeR.value],
    ['stroke-width', sd.strokeWidth],
    ['stroke-dasharray', sd.strokeDasharray],
  ] as const);
  return `${fillR.def}${strokeR.def}<circle${a}/>`;
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
    `${fmt(cx)},${fmt(cy - size)} ` +
    `${fmt(cx + size)},${fmt(cy)} ` +
    `${fmt(cx)},${fmt(cy + size)} ` +
    `${fmt(cx - size)},${fmt(cy)}`;
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
  // Flat comma-separated, which is how the jar writes it —
  // `svg-graphics-elements.ts:200` (`points.map(format).join(',')`), mirroring
  // `SvgGraphics`. Every cached golden agrees: `points="54,98,64,88,1006,88,…"`,
  // never a space between pairs. This emitter used to join pairs with a space;
  // `normalize.ts#normalizePoints` normalizes the NUMBERS inside the attribute
  // but not the separators, so the two forms do not compare equal.
  const pts = points.flatMap((p) => [fmt(p.x), fmt(p.y)]).join(',');
  const fillR = resolvePaint(style.fill);
  const strokeR = resolvePaint(style.stroke);
  const sd = strokeDecorationOf(strokeR.value, style.strokeWidth, style.strokeDasharray);
  const a = attrs([
    ['points', pts],
    ['fill', fillR.value],
    ['stroke', strokeR.value],
    ['stroke-width', sd.strokeWidth],
    ['stroke-dasharray', sd.strokeDasharray],
    // Unconditional on a polygon, exactly as `SvgGraphics.java:658` writes it
    // (`styleMe(elt, "stroke-linejoin:miter;stroke-miterlimit:10;")`), which
    // `core/klimt/.../svg-graphics-elements.ts:202` already mirrors for the
    // klimt path. 4018 of the 4037 polygons in the cached corpus carry it.
    ['stroke-linejoin', 'miter'],
    ['stroke-miterlimit', 10],
  ] as const);
  return `${fillR.def}${strokeR.def}<polygon${a}/>`;
}

/**
 * `<polyline>` -- the open counterpart of {@link polygon}. Same attributes,
 * same order; only the element name differs, so the two cannot drift.
 */
export function polyline(
  points: ReadonlyArray<{ x: number; y: number }>,
  style: BoxStyle = {},
): string {
  // Flat comma-separated, which is how the jar writes it —
  // `svg-graphics-elements.ts:200` (`points.map(format).join(',')`), mirroring
  // `SvgGraphics`. Every cached golden agrees: `points="54,98,64,88,1006,88,…"`,
  // never a space between pairs. This emitter used to join pairs with a space;
  // `normalize.ts#normalizePoints` normalizes the NUMBERS inside the attribute
  // but not the separators, so the two forms do not compare equal.
  const pts = points.flatMap((p) => [fmt(p.x), fmt(p.y)]).join(',');
  const fillR = resolvePaint(style.fill);
  const strokeR = resolvePaint(style.stroke);
  const sd = strokeDecorationOf(strokeR.value, style.strokeWidth, style.strokeDasharray);
  const a = attrs([
    ['points', pts],
    ['fill', fillR.value],
    ['stroke', strokeR.value],
    ['stroke-width', sd.strokeWidth],
    ['stroke-dasharray', sd.strokeDasharray],
  ] as const);
  return `${fillR.def}${strokeR.def}<polyline${a}/>`;
}

// ---------------------------------------------------------------------------
// Note box (sticky-note shape with dog-ear fold)
// ---------------------------------------------------------------------------

export interface NoteBoxStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  dogEar?: number;
}

/**
 * Renders a sticky-note shape: a rectangle with the top-right corner
 * replaced by a folded dog-ear, plus two crease lines that show the fold.
 *
 * Returns only the shape SVG — callers render text on top. Moved here from
 * `svg.ts` (line cap) and re-exported from it, so callers are unaffected.
 *
 * @param dogEar - Size of the folded corner in px (default 10).
 */
export function noteBox(
  x: number,
  y: number,
  w: number,
  h: number,
  style: NoteBoxStyle = {},
): string {
  const { fill = '#FEFECE', stroke = '#AAAAAA', strokeWidth = 1, dogEar = 10 } = style;
  const paint = shortenColor(stroke);
  // Rule 4: `stroke:none` suppresses `stroke-width` here too.
  const sw = paint === PAINT_NONE ? '' : ` stroke-width="${fmt(strokeWidth)}"`;
  const d = dogEar;
  // Pentagon: top-left → fold-point on top edge → dog-ear corner → bottom-right → bottom-left
  const body =
    `<path d="M${fmt(x)},${fmt(y)} L${fmt(x + w - d)},${fmt(y)} L${fmt(x + w)},${fmt(y + d)} ` +
    `L${fmt(x + w)},${fmt(y + h)} L${fmt(x)},${fmt(y + h)} Z" ` +
    `fill="${shortenColor(fill)}" stroke="${paint}"${sw}/>`;
  // Two crease lines: vertical drop from fold-point, then horizontal to right edge
  const crease =
    `<line x1="${fmt(x + w - d)}" y1="${fmt(y)}" x2="${fmt(x + w - d)}" y2="${fmt(y + d)}" stroke="${paint}"${sw}/>` +
    `<line x1="${fmt(x + w - d)}" y1="${fmt(y + d)}" x2="${fmt(x + w)}" y2="${fmt(y + d)}" stroke="${paint}"${sw}/>`;
  return body + crease;
}
