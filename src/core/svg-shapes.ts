/**
 * SVG shape emitters (rect/line/text/image/path/ellipse/diamond/polygon).
 * Split out of `svg.ts` (line cap); imports the low-level attr/paint helpers
 * from svg.ts. Re-exported from svg.ts so existing import sites are unchanged.
 */

import {} from './paint.js';
import type {} from './paint.js';
import {
  attrs,
  resolvePaint,
  resolvePaintAttrs,
  attrsFromRecord,
  strokeDecorationOf,
  PAINT_NONE,
  type BoxStyle,
  type LineStyle,
  type SvgAttrsPaint,
} from './svg.js';
export { emittedTextForm } from './svg-text-font.js';
export { text, multilineText, tspan } from './svg-shapes-text.js';
import { DEFAULT_SVG_DECIMALS, fmt, formatOpacity, shortenColor } from './svg-format.js';
import { roundedCornerAttrs } from './svg-rect-corners.js';
import { extraLineStrokeWidth } from './klimt/drawing/svg/driver-text-svg-decorations.js';
import type { ExtraLine } from './klimt/drawing/svg/driver-text-svg-decorations.js';

/**
 * `SvgGraphics#styleMe` (`klimt/drawing/svg/SvgGraphics.java:624-626`, used by
 * `svgRectangle`/`svgLine`/`svgPolygon`/`svgPath`) writes NO stroke style when
 * the formatted width is `"0"`, as `svg-graphics-core.ts#styleMe` does (add4-T3c).
 */
type StrokeAttrs = ReturnType<typeof strokeDecorationOf> & { stroke: string | undefined; styled: boolean };
function strokeAttrsOf(
  stroke: string | undefined,
  style: { strokeWidth?: number; strokeDasharray?: string },
): StrokeAttrs {
  if (style.strokeWidth !== undefined && fmt(style.strokeWidth) === '0') {
    return { stroke: undefined, strokeWidth: undefined, strokeDasharray: undefined, styled: false };
  }
  return { stroke, ...strokeDecorationOf(stroke, style.strokeWidth, style.strokeDasharray), styled: true };
}

/** `SvgGraphics#fillMe`'s test (`SvgGraphics.java:880`): `#[0-9A-Fa-f]{8}`. */
const ALPHA_HEX_FILL = /^#[0-9A-Fa-f]{8}$/;

/**
 * `SvgGraphics#fillMe` (`klimt/drawing/svg/SvgGraphics.java:880-887`): an
 * 8-digit `#RRGGBBAA` fill is written as `fill=shortenColor(fill[0..7])` plus
 * `fill-opacity=formatOpacity(parseInt(fill[7..], 16) / 255.0)`; any other
 * fill is `shortenColor(fill)` only (already applied by `resolvePaint`).
 * An opacity the caller passes explicitly wins over the alpha byte -- the
 * jar has no second source, so this only keeps existing callers' output.
 */
function fillAttrsOf(
  fill: string | undefined,
  explicitOpacity: number | undefined,
): { fill: string | undefined; fillOpacity: string | undefined } {
  const explicit = explicitOpacity === undefined ? undefined : formatOpacity(explicitOpacity, DEFAULT_SVG_DECIMALS);
  if (fill === undefined || !ALPHA_HEX_FILL.test(fill)) return { fill, fillOpacity: explicit };
  const alpha = parseInt(fill.slice(7), 16) / 255;
  return {
    fill: shortenColor(fill.slice(0, 7)),
    fillOpacity: explicit ?? formatOpacity(alpha, DEFAULT_SVG_DECIMALS),
  };
}

/**
 * `DriverPathSvg.java:65` `color.equals(back) && !(color instanceof
 * HColorGradient) && !(color instanceof HColorLinearGradient)`: both paints
 * resolved to a flat colour (no `<linearGradient>` def) and the same one.
 * `none` is not a colour here: a path with no fill has no back colour to match.
 */
function isSameFlatColour(
  fill: { value: string | undefined; def: string } | undefined,
  stroke: { value: string | undefined; def: string },
): boolean {
  if (fill === undefined || fill.value === undefined || stroke.value === undefined) return false;
  if (fill.def !== '' || stroke.def !== '' || fill.value === PAINT_NONE) return false;
  return fill.value.toLowerCase() === stroke.value.toLowerCase();
}

/**
 * `<rect>` element.
 */
export function rect(x: number, y: number, w: number, h: number, style: BoxStyle = {}): string {
  const fillR = resolvePaint(style.fill);
  const strokeR = resolvePaint(style.stroke);
  const sd = strokeAttrsOf(strokeR.value, style);
  const opacity = style.opacity === undefined ? undefined : formatOpacity(style.opacity, DEFAULT_SVG_DECIMALS);
  const fillA = fillAttrsOf(fillR.value, style.fillOpacity);
  const a = attrs([
    ['x', x],
    ['y', y],
    ['width', w],
    ['height', h],
    ['fill', fillA.fill],
    // Directly after `fill`, matching the jar's own emission order for a
    // transparent hit target: `<rect ... fill="#000" fill-opacity="0"/>`.
    ['fill-opacity', fillA.fillOpacity],
    ['stroke', sd.stroke],
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
export function line(x1: number, y1: number, x2: number, y2: number, style: LineStyle = {}): string {
  const strokeR = resolvePaint(style.stroke);
  const sd = strokeAttrsOf(strokeR.value, style);
  const a = attrs([
    ['x1', x1],
    ['y1', y1],
    ['x2', x2],
    ['y2', y2],
    ['stroke', sd.stroke],
    ['stroke-width', sd.strokeWidth],
    ['stroke-dasharray', sd.strokeDasharray],
    ['marker-end', style.markerEnd],
    ['marker-start', style.markerStart],
  ] as const);
  return `${strokeR.def}<line${a}/>`;
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
  const fillA = fillAttrsOf(fillR?.value, style.fillOpacity);
  // `DriverPathSvg#draw` (`DriverPathSvg.java:65-69`): colour == back colour,
  // neither a gradient, draws with `setStrokeColor("")` + `setStrokeWidth(0)`.
  const strokeless = isSameFlatColour(fillR, strokeR);
  const sd = strokeAttrsOf(strokeR.value, strokeless ? { ...style, strokeWidth: 0 } : style);
  const a = attrs([
    ['d', d],
    ['fill', fillA.fill ?? PAINT_NONE],
    ['fill-opacity', fillA.fillOpacity],
    ['stroke', sd.stroke],
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
export function ellipse(cx: number, cy: number, rx: number, ry: number, extraAttrs?: SvgAttrsPaint): string {
  const a = attrs([
    ['cx', cx],
    ['cy', cy],
    ['rx', rx],
    ['ry', ry],
  ] as const);
  const resolved = extraAttrs !== undefined ? resolvePaintAttrs(extraAttrs) : undefined;
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
  const fillA = fillAttrsOf(fillR.value, undefined);
  const a = attrs([
    ['cx', cx],
    ['cy', cy],
    ['r', r],
    ['fill', fillA.fill],
    ['fill-opacity', fillA.fillOpacity],
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
export function diamond(cx: number, cy: number, size: number, extraAttrs?: SvgAttrsPaint): string {
  const points =
    `${fmt(cx)},${fmt(cy - size)} ` +
    `${fmt(cx + size)},${fmt(cy)} ` +
    `${fmt(cx)},${fmt(cy + size)} ` +
    `${fmt(cx - size)},${fmt(cy)}`;
  const a = attrs([['points', points]] as const);
  const resolved = extraAttrs !== undefined ? resolvePaintAttrs(extraAttrs) : undefined;
  const extra = resolved !== undefined ? attrsFromRecord(resolved.plain) : '';
  const def = resolved?.def ?? '';
  return `${def}<polygon${a}${extra}/>`;
}

/**
 * `<polygon>` from an explicit point list, with fill/stroke styling.
 */
export function polygon(points: ReadonlyArray<{ x: number; y: number }>, style: BoxStyle = {}): string {
  // Flat comma-separated, which is how the jar writes it —
  // `svg-graphics-elements.ts:200` (`points.map(format).join(',')`), mirroring
  // `SvgGraphics`. Every cached golden agrees: `points="54,98,64,88,1006,88,…"`,
  // never a space between pairs. This emitter used to join pairs with a space;
  // `normalize.ts#normalizePoints` normalizes the NUMBERS inside the attribute
  // but not the separators, so the two forms do not compare equal.
  const pts = points.flatMap((p) => [fmt(p.x), fmt(p.y)]).join(',');
  const fillR = resolvePaint(style.fill);
  const strokeR = resolvePaint(style.stroke);
  const sd = strokeAttrsOf(strokeR.value, style);
  const fillA = fillAttrsOf(fillR.value, undefined);
  const a = attrs([
    ['points', pts],
    ['fill', fillA.fill],
    ['fill-opacity', fillA.fillOpacity],
    ['stroke', sd.stroke],
    ['stroke-width', sd.strokeWidth],
    ['stroke-dasharray', sd.strokeDasharray],
    // On every styled polygon, as `SvgGraphics.java:658` writes it (`styleMe
    // (elt, "stroke-linejoin:miter;stroke-miterlimit:10;")`), which
    // `core/klimt/.../svg-graphics-elements.ts:202` already mirrors for the
    // klimt path. 4018 of the 4037 polygons in the cached corpus carry it.
    ['stroke-linejoin', sd.styled ? 'miter' : undefined],
    ['stroke-miterlimit', sd.styled ? 10 : undefined],
  ] as const);
  return `${fillR.def}${strokeR.def}<polygon${a}/>`;
}

/**
 * `<polyline>` -- the open counterpart of {@link polygon}. Same attributes,
 * same order; only the element name differs, so the two cannot drift.
 */
export function polyline(points: ReadonlyArray<{ x: number; y: number }>, style: BoxStyle = {}): string {
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
  const fillA = fillAttrsOf(fillR.value, undefined);
  const a = attrs([
    ['points', pts],
    ['fill', fillA.fill],
    ['fill-opacity', fillA.fillOpacity],
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
 * replaced by a folded dog-ear, plus the fold itself.
 *
 * TWO paths, which is what upstream emits. `Opale.getCorner`
 * (`Opale.java:134-147`) builds the fold as ONE closed `UPath` --
 * `moveTo(width - cornersize, 0)`, `lineTo(width - cornersize, cornersize)`,
 * `lineTo(width, cornersize)`, `lineTo(width - cornersize, 0)`, `closePath` --
 * drawn once beside `getPolygonNormal`'s body (`:149-169`, `ComponentRoseNote
 * .java:118-124`). The jar's own output for a sequence note is exactly
 * `d="M15,97 L15,120 L75,120 L75,107 L65,97 L15,97"` plus
 * `d="M65,97 L65,107 L75,107 L65,97"`, both filled with the note colour.
 *
 * This used to draw the fold as TWO `<line>`s, so every note cost three
 * top-level children where the jar spends two. Like the actor stick man
 * (`sequence/renderer-participant-shapes.ts#renderActorShape`), the excess is
 * per-construct, so it grew with how much of a diagram this port rendered.
 *
 * Still divergent, deliberately not changed here: the BODY path starts
 * top-left and runs right along the top, where upstream starts top-left and
 * runs DOWN the left side first (`:152-157`). That is a `d`-string
 * difference, not a child-count one, and it would move bytes in three
 * engines at once.
 *
 * Returns only the shape SVG — callers render text on top.
 *
 * @param dogEar - Size of the folded corner in px (default 10).
 * @see ~/git/plantuml/.../skin/rose/Opale.java#getCorner
 */
export function noteBox(x: number, y: number, w: number, h: number, style: NoteBoxStyle = {}): string {
  const { fill = '#FEFECE', stroke = '#AAAAAA', strokeWidth = 1, dogEar = 10 } = style;
  const paint = shortenColor(stroke);
  // Rule 4: `stroke:none` suppresses `stroke-width` here too.
  const paintAttrs = attrs([
    ['fill', fill],
    ['stroke', stroke],
    ['stroke-width', paint === PAINT_NONE ? undefined : strokeWidth],
  ]);
  const d = dogEar;
  // Pentagon: top-left → fold-point on top edge → dog-ear corner → bottom-right → bottom-left
  const bodyD =
    `M${fmt(x)},${fmt(y)} L${fmt(x + w - d)},${fmt(y)} L${fmt(x + w)},${fmt(y + d)} ` +
    `L${fmt(x + w)},${fmt(y + h)} L${fmt(x)},${fmt(y + h)} Z`;
  const body = '<path' + attrs([['d', bodyD]]) + paintAttrs + '/>';
  // The fold, as ONE closed path -- `Opale#getCorner`'s four points, in its
  // order. The final `lineTo` returns to the start, which is why upstream's
  // `closePath()` adds nothing to the emitted `d` (its own goldens end at the
  // last `L`, with no `Z`); this matches that.
  const foldD =
    `M${fmt(x + w - d)},${fmt(y)} L${fmt(x + w - d)},${fmt(y + d)} ` +
    `L${fmt(x + w)},${fmt(y + d)} L${fmt(x + w - d)},${fmt(y)}`;
  const fold = '<path' + attrs([['d', foldD]]) + paintAttrs + '/>';
  return body + fold;
}
/**
 * `<foreignObject>` element.
 *
 * Used to embed HTML/MathML content (e.g. KaTeX MathML) inside SVG.
 * The `content` string is inserted verbatim — callers are responsible for
 * providing valid (X)HTML content including any required namespace attributes.
 *
 * @param x       - Top-left x coordinate.
 * @param y       - Top-left y coordinate.
 * @param w       - Width of the foreignObject.
 * @param h       - Height of the foreignObject.
 * @param content - Inner HTML/MathML string (verbatim, not escaped).
 */
export function foreignObject(x: number, y: number, w: number, h: number, content: string): string {
  const a = attrs([
    ['x', x],
    ['y', y],
    ['width', w],
    ['height', h],
  ] as const);
  return '<foreignObject' + a + '>' + content + '</foreignObject>';
}

/**
 * Upstream `DriverTextSvg.ExtraLines#drawAll` (`DriverTextSvg.java:68-75`):
 * one `<line>` per custom-coloured underline/strike-through, spanning the
 * run's measured width at `y + deltaY`, stroked at `font.getSize2D()/28`.
 *
 * Lives here, with the other shape emitters, so class's two string
 * renderers (`renderer-classifier-rows.ts`, `renderer-note.ts`) share the
 * emission the same way they now share the decision
 * (`klimt/drawing/svg/driver-text-svg-decorations.ts`); the klimt driver
 * draws the identical lines through `SvgGraphics#svgLine` instead.
 *
 * `color` is the raw `extendedColor` token; `line()`'s own `stroke`
 * resolution shortens it exactly as upstream's `toSvg(mapper)` does.
 */
export function decorationLines(
  extraLines: readonly ExtraLine[],
  x: number,
  y: number,
  width: number,
  drawnFontSize: number,
): string {
  return extraLines
    .map((extra) =>
      line(x, y + extra.deltaY, x + width, y + extra.deltaY, {
        stroke: extra.color,
        strokeWidth: extraLineStrokeWidth(drawnFontSize),
      }),
    )
    .join('');
}
