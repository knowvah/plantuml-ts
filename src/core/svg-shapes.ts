/**
 * SVG shape emitters (rect/line/text/image/path/ellipse/diamond/polygon).
 * Split out of `svg.ts` (line cap); imports the low-level attr/paint helpers
 * from svg.ts. Re-exported from svg.ts so existing import sites are unchanged.
 */

import {} from './paint.js';
import type {} from './paint.js';
import { attrs, escapeXmlText, resolvePaint, resolvePaintAttrs, attrsFromRecord, strokeDecorationOf, ROOT_FONT_FAMILY, PAINT_NONE, type BoxStyle, type LineStyle, type TextStyle, type SvgAttrsPaint } from './svg.js';
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
// Built from a string (not a regex literal) — a regex literal containing a
// double quote makes the complexity checker mis-tokenize the rest of the
// file (same workaround as paint.ts / svg.ts).
const DQUOTE_RE = new RegExp('"', 'g');

function toSvgFontFamily(family: string | undefined): string | undefined {
  return family === undefined ? undefined : family.replace(DQUOTE_RE, "'");
}

/**
 * Rule 3, per-element half: `font-family` is emitted only when it DIFFERS
 * from the family hoisted onto the document root (`svg.ts#svgRoot`), compared
 * case-insensitively exactly as upstream does. Every `<text>` in the default
 * family inherits it and emits nothing.
 * @see .../klimt/drawing/svg/SvgGraphics.java#text
 */
function textFontFamily(family: string | undefined): string | undefined {
  const svgFamily = toSvgFontFamily(family);
  if (svgFamily === undefined || svgFamily.toLowerCase() === ROOT_FONT_FAMILY) return undefined;
  return svgFamily;
}

/**
 * Rule 5: a one-character label has no inter-character spacing to adjust, so
 * `textLength` is skipped for it (upstream's own `text.length() > 1` guard
 * and its rationale). `textLength` stays per-element otherwise — unlike
 * `lengthAdjust`, it is not inheritable.
 */
function textLengthOf(content: string, textLength: number | undefined): number | undefined {
  return content.length > 1 ? textLength : undefined;
}

/**
 * A whitespace-ONLY label has every space swapped for NBSP (U+00A0):
 *
 * ```java
 * if (text.matches("^\\s*$"))
 *     text = text.replace(' ', (char) 160);
 * ```
 * @see .../klimt/drawing/svg/DriverTextSvg.java:115-116
 *
 * The guard is what makes this narrow, and it is easy to get wrong in the
 * generous direction: ordinary labels keep their regular spaces (verified
 * across the cached class corpus — `'int size'`, `'some page header'`), so a
 * blanket substitution would corrupt every multi-word label in the port.
 *
 * It fires in practice for json's nested-value cell, whose display string is
 * three spaces (`TextBlockJson.java:194`); the jar writes `\xa0\xa0\xa0`.
 *
 * `core/klimt/drawing/svg/driver-text-svg.ts#leadingSpaceAdjust` carries the
 * same rule for the klimt-drawn engines. This is the copy for every engine
 * that emits through these shared shape functions.
 */
const NBSP = ' ';
const WHITESPACE_ONLY_RE = new RegExp('^\\s*$');

function nbspIfBlank(content: string): string {
  return WHITESPACE_ONLY_RE.test(content) ? content.split(' ').join(NBSP) : content;
}

/**
 * `StringUtils.trin(String)` — trims only characters whose code point is
 * <= U+0020, from both ends. Deliberately NOT JS's `.trim()`, which also
 * strips U+00A0 per the ECMAScript WhiteSpace production: that would swallow
 * the very NBSPs {@link nbspIfBlank} just inserted (0xA0 > 0x20).
 *
 * `core/klimt/drawing/svg/driver-text-svg.ts#trin` is the same port for the
 * klimt-drawn engines; this is the copy for the shared shape emitters.
 * @see .../klimt/drawing/svg/DriverTextSvg.java:125
 */
function trin(text: string): string {
  let start = 0;
  let end = text.length - 1;
  while (start <= end && text.charCodeAt(start) <= 0x20) start++;
  while (end >= start && text.charCodeAt(end) <= 0x20) end--;
  return text.slice(start, end + 1);
}

/**
 * The exact string the jar puts inside a `<text>`, given the raw label.
 *
 * ORDER IS LOAD-BEARING and matches `DriverTextSvg#draw` (`:114-125`):
 * whitespace-only → NBSP FIRST, then `trin`. Reversed, a whitespace-only label
 * would be trimmed to nothing before it could become NBSP, and json's
 * three-space nested cell (`TextBlockJson.java:194`) would vanish instead of
 * rendering as `\xa0\xa0\xa0`.
 *
 * Exported because the value that reaches `textLength` must be measured from
 * THIS form, not the raw one — upstream measures after both steps
 * (`dim = calculateDimension(font, trimmed)`, `:126`). Any caller computing a
 * width for a label it will emit through {@link text} has to agree with it.
 *
 * Not ported: `leadingSpaceAdjust`'s conversion of leading spaces into an `x`
 * advance (`:118-124`). It needs a measurer, which these emitters do not have.
 * Verified unexercised by the current corpus — across 3,548 jar `<text>`
 * elements in the json/yaml goldens, ZERO carry leading or trailing
 * whitespace, so nothing in it survives to be positioned.
 */
export function emittedTextForm(content: string, fontFamily?: string): string {
  return nbspIfMonospace(trin(nbspIfBlank(content)), fontFamily);
}

/**
 * The SECOND, independent NBSP rule — and the one whose absence here made a
 * monospace label look like the whitespace-only rule was mis-scoped:
 *
 * ```java
 * if ("monospaced".equalsIgnoreCase(fontFamily))
 *     fontFamily = "monospace";
 * …
 * if (fontFamily.equalsIgnoreCase("monospace") || fontFamily.equalsIgnoreCase("courier"))
 *     text = text.replace(' ', (char) 160);
 * ```
 * @see .../klimt/drawing/svg/SvgGraphics.java:720-728
 *
 * EVERY space becomes NBSP under a monospace or courier family, whitespace-only
 * or not — which is why the jar writes
 * `Your\xa0data\xa0does\xa0not\xa0sound\xa0like\xa0JSON\xa0data` for a message
 * that {@link nbspIfBlank} would leave completely alone.
 *
 * Three details, all load-bearing:
 *  - The comparison is `equalsIgnoreCase` against the WHOLE family, not a
 *    substring. A CSS stack like `"Courier, monospace"` does NOT qualify.
 *  - `monospaced` (PlantUML's own logical font name) is renamed to `monospace`
 *    BEFORE the test, so it qualifies through the rename.
 *  - Upstream applies this in `SvgGraphics#text`, AFTER `DriverTextSvg` has
 *    already measured and passed `textLength` down. So it is emission-only:
 *    the width still reflects the SPACE-bearing string. Hence its position
 *    here, outside anything a caller measures.
 *
 * `core/klimt/drawing/svg/svg-graphics-elements.ts#applyTextFontFamily` is the
 * same rule for the klimt-drawn engines, which already had it; this is the
 * copy for every engine emitting through these shared shape functions.
 */
function nbspIfMonospace(content: string, fontFamily: string | undefined): string {
  if (fontFamily === undefined) return content;
  const lower = (fontFamily.toLowerCase() === 'monospaced' ? 'monospace' : fontFamily).toLowerCase();
  if (lower !== 'monospace' && lower !== 'courier') return content;
  return content.split(' ').join(NBSP);
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
