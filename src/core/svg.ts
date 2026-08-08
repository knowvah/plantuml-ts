/**
 * SVG primitive builders — pure string functions, no DOM API.
 *
 * All SVG markup in plantuml-ts flows through these functions.
 * Callers compose the returned strings; nothing here touches document or DOM.
 *
 * Numeric precision is applied HERE, at emission (ADR-1,
 * `plans/svg-output-size-reduction/decisions.md`), mirroring upstream's
 * `SvgGraphics#format`: every numeric attribute value goes through
 * `svg-format.ts#formatDecimal` on its way out, so callers must NOT
 * pre-round geometry (`javaRound4`/`javaFixed4`) — doing both double-rounds
 * (`1.2345 -> 1.2345 -> 1.235` where direct-to-3dp is `1.234`).
 * @see ~/git/plantuml/.../klimt/drawing/svg/SvgGraphics.java
 */

import { paintToSvg } from './paint.js';
import type { Paint } from './paint.js';
import { arrowHead, ALL_ARROW_TYPES } from './svg-markers.js';
import {
  DEFAULT_SVG_DECIMALS,
  formatDecimal,
  shortenColor,
} from './svg-format.js';

// Arrow-marker builders live in ./svg-markers (no Paint involvement); re-export
// them here so existing importers of `core/svg.js` are unaffected by the split.
export { arrowHead, arrowHeadRef, ALL_ARROW_TYPES } from './svg-markers.js';
export type { ArrowType } from './svg-markers.js';

// ---------------------------------------------------------------------------
// Style interfaces
// ---------------------------------------------------------------------------

export interface BoxStyle {
  fill?: Paint;
  stroke?: Paint;
  strokeWidth?: number;
  strokeDasharray?: string;
  rx?: number;
  ry?: number;
  opacity?: number;
  filter?: string;
}

export interface LineStyle {
  stroke?: Paint;
  strokeWidth?: number;
  strokeDasharray?: string;
  markerEnd?: string;
  markerStart?: string;
  /** `<path id="...">` -- jar's `Link#idCommentForSvg()` value
   *  (`class/renderer.ts#linkIdForSvg`). */
  id?: string;
  /** `<path codeLine="...">` -- jar's `Link#getCodeLine()` (0-indexed
   *  source line), emitted verbatim as a string attribute, matching
   *  `core/klimt/drawing/svg/svg-graphics-elements.ts`'s own `codeLine`
   *  emission for the klimt path. */
  codeLine?: string;
  /** `<path fill="...">` -- OPTIONAL, defaults to `'none'` (this function's
   *  own long-standing "paths are lines/edges, never filled shapes"
   *  convention, unchanged for every existing caller that omits it). G2/N13
   *  (`class/renderer-note.ts#renderTipNote`) is the first caller that
   *  needs a FILLED path: the Opale zigzag-notch note outline is a single
   *  `<path>` (arc + line commands, not representable as a `<polygon>`)
   *  with a real background fill, matching jar's own `Opale.java#drawU`
   *  (`ug.apply(noteBackgroundColor.bg())` before `ug.draw(polygon)`). */
  fill?: Paint;
}

export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  /** G2 N18: jar's deterministic-text SVG emits the RAW numeric weight
   *  (`font-weight="700"`), never the CSS keyword `"bold"` -- confirmed
   *  corpus-wide (184/184 class fixtures with bold text use `"700"`, ZERO
   *  use `"bold"`). `'700'` is additive (a new allowed literal, not a
   *  behavior change for existing `'bold'` callers -- `activity/renderer
   *  .ts`/`json/renderer.ts` are unaudited for this same gap and are
   *  OUT OF this mission's write-set; only `class-namespace-shape.ts`'s
   *  folder-tab title (G2 N17/N18) uses `'700'`). */
  fontWeight?: 'normal' | 'bold' | '700';
  fontStyle?: 'normal' | 'italic';
  fill?: Paint;
  textAnchor?: 'start' | 'middle' | 'end';
  dominantBaseline?: 'middle' | 'central' | 'auto' | 'hanging';
  /**
   * Emitted verbatim as the SVG `text-decoration` attribute. The error diagram
   * (`src/core/error/error-renderer.ts`) needs `wavy underline` -- what the jar
   * emits under the offending source line -- and `underline` for the Welcome
   * block's hyperlink. Neither is expressible as a font property.
   */
  textDecoration?: string;
  /**
   * G2 N4: the pre-measured text width, matching klimt's own `textLength`
   * emission (`core/klimt/drawing/svg/svg-graphics-elements.ts`'s
   * `applyTextLengthAdjust`) -- jar (`-DPLANTUML_DETERMINISTIC_TEXT=true`)
   * emits this on every `<text>` so the SVG viewer stretches/compresses
   * glyphs to the SAME width this port's own measurer computed, rather than
   * leaving inter-character spacing up to the viewer's own font metrics.
   * Additive/optional: every pre-existing caller of `text()` omits it
   * (unchanged output) except class's member/header rows (G2 N4).
   */
  textLength?: number;
  /** Always `'spacing'` in this codebase's own usage (matches klimt's own
   *  `LengthAdjust.SPACING` default). NO LONGER EMITTED per `<text>` (rule 3):
   *  the value is hoisted onto the document root by {@link svgRoot} and
   *  inherited. Kept as a field so the many callers that set it need no
   *  change, and so a future per-element override has somewhere to live. */
  lengthAdjust?: 'spacing' | 'spacingAndGlyphs';
}

/**
 * Arbitrary SVG attribute map.  Keys are attribute names (e.g. `fill`,
 * `transform`); values are strings or numbers — `undefined` entries are
 * silently omitted from output.
 */
export type SvgAttrs = Record<string, string | number | undefined>;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// Named-entity replacements for the XML-significant characters. Built from a
// string (not a regex literal) — the complexity checker miscounts regex
// literals containing `<`/`>` (same workaround as paint.ts).
const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};
const XML_RE = new RegExp('[&<>"]', 'g');

/**
 * Escape characters that are special in XML text content and attribute values.
 */
export function escapeXml(s: string): string {
  return s.replace(XML_RE, (ch) => XML_ENTITIES[ch] ?? ch);
}

/**
 * The one place a value becomes attribute text (ADR-1): a `number` is
 * rounded to `decimals` places the way Java's `%.<n>f` does it and stripped
 * of trailing zeros; a `string` passes through verbatim (already-formatted
 * values, ids, transforms, path data).
 */
function formatAttrValue(value: string | number, decimals: number): string {
  return typeof value === 'number' ? formatDecimal(value, decimals) : value;
}

/**
 * Build a flat attribute string from an object.
 * Only includes entries where the value is not undefined.
 *
 * `decimals` mirrors upstream's `SvgOption.decimal` (ADR-2) — threaded, not
 * hardcoded, even though production has exactly one value today.
 */
export function attrs(
  entries: ReadonlyArray<readonly [string, string | number | undefined]>,
  decimals = DEFAULT_SVG_DECIMALS,
): string {
  const parts: string[] = [];
  for (const [name, value] of entries) {
    if (value !== undefined) {
      parts.push(`${name}="${formatAttrValue(value, decimals)}"`);
    }
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

/**
 * Build a flat attribute string from a SvgAttrs record.
 * Only includes entries where the value is not undefined.
 * `decimals` as in {@link attrs}.
 */
export function attrsFromRecord(record: SvgAttrs, decimals = DEFAULT_SVG_DECIMALS): string {
  const parts: string[] = [];
  for (const [name, value] of Object.entries(record)) {
    if (value !== undefined) {
      parts.push(`${name}="${formatAttrValue(value, decimals)}"`);
    }
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

/**
 * Like {@link SvgAttrs} but each value may also be a {@link Paint}. Used by the
 * free-form `extraAttrs` bag of `ellipse`/`diamond`, resolved via
 * {@link resolvePaintAttrs}.
 */
export type SvgAttrsPaint = Record<string, string | number | Paint | undefined>;

/**
 * Resolve one {@link Paint} (a style's `fill`/`stroke`) to its plain attribute
 * value plus any inline `<linearGradient>` def it needs. A plain
 * string/`undefined` round-trips with `def: ''`, so output stays byte-identical
 * to the pre-Paint implementation for non-gradient input.
 */
export function resolvePaint(p: Paint | undefined): {
  value: string | undefined;
  def: string;
} {
  if (p === undefined) return { value: undefined, def: '' };
  const resolved = paintToSvg(p);
  return {
    value: shortenColor(resolved.fill),
    def: shortenStopColors(resolved.def ?? ''),
  };
}

/** Attribute names whose value is a color, and so is subject to rule 2's
 *  `#RRGGBB` -> `#RGB` shortening. Free-form attribute bags
 *  ({@link SvgAttrsPaint}) carry non-color values too (`transform`, ids),
 *  which must never be rewritten. */
const COLOR_ATTRS: ReadonlySet<string> = new Set([
  'fill',
  'stroke',
  'stop-color',
  'color',
]);

// One `<stop stop-color="…">` value inside a `paint.ts#paintToSvg` gradient
// def. Built from a string (not a regex literal) — the complexity checker
// miscounts regex literals containing `<`/`>` (same workaround as paint.ts).
const STOP_COLOR_RE = new RegExp('stop-color="([^"]*)"', 'g');

/**
 * Rule 2 at the gradient stops (upstream shortens both `stop-color`s in
 * `createSvgGradient`). The def is built by `paint.ts#paintToSvg`, whose
 * `<stop>` writer is the natural home for this; applied here instead so the
 * rule lands with the rest of the emitter's rule-2 sites, and scoped exactly
 * to that one producer's shape — a resolved color never contains a `"`.
 * @see .../klimt/drawing/svg/SvgGraphics.java#createSvgGradient
 */
function shortenStopColors(def: string): string {
  if (def === '') return '';
  return def.replace(STOP_COLOR_RE, (_m, color: string) => `stop-color="${shortenColor(color)}"`);
}

/**
 * Resolve every {@link Paint} in a free-form {@link SvgAttrsPaint} record to a
 * plain {@link SvgAttrs}, collecting the `<linearGradient>` defs those gradients
 * need. A non-Paint entry passes through unchanged unless its key names a
 * color ({@link COLOR_ATTRS}), which rule 2 shortens.
 */
export function resolvePaintAttrs(record: SvgAttrsPaint): {
  plain: SvgAttrs;
  def: string;
} {
  const plain: SvgAttrs = {};
  let def = '';
  for (const [key, value] of Object.entries(record)) {
    if (value !== null && typeof value === 'object') {
      const resolved = resolvePaint(value);
      plain[key] = resolved.value;
      def += resolved.def;
    } else if (typeof value === 'string' && COLOR_ATTRS.has(key)) {
      plain[key] = shortenColor(value);
    } else {
      plain[key] = value;
    }
  }
  return { plain, def };
}

// ---------------------------------------------------------------------------
// Emission rules shared with the shape emitters (./svg-shapes)
// ---------------------------------------------------------------------------

/** The `stroke`/`fill` value meaning "do not paint this". */
export const PAINT_NONE = 'none';

/** Hoisted onto the document root and inherited by every `<text>`, so a
 *  `<text>` in this family emits no `font-family` of its own (rule 3).
 *  @see .../klimt/drawing/svg/SvgGraphics.java (gRoot's `font-family`) */
export const ROOT_FONT_FAMILY = 'sans-serif';

/** Hoisted onto the document root the same way (rule 3). Upstream takes it
 *  from `SvgOption.getLengthAdjust()`; every text emitter in this codebase
 *  uses `spacing` (klimt's own `LengthAdjust.SPACING` default). */
const ROOT_LENGTH_ADJUST = 'spacing';

/**
 * Rule 4 — `stroke:none` suppresses BOTH `stroke-width` and
 * `stroke-dasharray`: with nothing painted, neither has any effect, and
 * upstream drops both under one `if ("none".equals(stroke) == false)` guard.
 * @see .../klimt/drawing/svg/SvgGraphics.java (the style builder)
 */
export function strokeDecorationOf(
  stroke: string | undefined,
  strokeWidth: number | undefined,
  strokeDasharray: string | undefined,
): { strokeWidth: number | undefined; strokeDasharray: string | undefined } {
  if (stroke === PAINT_NONE) return { strokeWidth: undefined, strokeDasharray: undefined };
  return { strokeWidth, strokeDasharray };
}

/** {@link formatDecimal} at the default precision — for the handful of
 *  numeric values this module interpolates into markup directly rather than
 *  passing through {@link attrs} (which threads `decimals` per ADR-2; these
 *  sites have no options object to thread it from). */
function fmt(x: number): string {
  return formatDecimal(x, DEFAULT_SVG_DECIMALS);
}

// ---------------------------------------------------------------------------
// Primitive builders
// ---------------------------------------------------------------------------


// Shape emitters moved to a sibling module (line cap); re-exported. `noteBox`
// joined them for the same reason when the emission rules below grew this
// file past the cap.
export { rect, line, text, image, path, ellipse, diamond, polygon, noteBox } from './svg-shapes.js';
export type { NoteBoxStyle } from './svg-shapes.js';

/**
 * `<g>` group element — two overloads:
 *
 * 1. Legacy: `group(id: string, children: string[])` — wraps an array of
 *    child strings in `<g id="…">…</g>`.  Used throughout the existing
 *    codebase.
 *
 * 2. New: `group(children: string, extraAttrs?: SvgAttrs)` — wraps a single
 *    pre-composed child string in `<g …>…</g>` with arbitrary SVG attrs.
 */
export function group(id: string, children: string[]): string;
export function group(children: string, extraAttrs?: SvgAttrs): string;
export function group(
  first: string,
  second?: string[] | SvgAttrs,
): string {
  if (Array.isArray(second)) {
    // Legacy overload: group(id, children[])
    return `<g id="${first}">${second.join('')}</g>`;
  }
  // New overload: group(children, extraAttrs?)
  // After the Array.isArray guard, `second` is narrowed to SvgAttrs | undefined
  const extra = second !== undefined ? attrsFromRecord(second) : '';
  return `<g${extra}>${first}</g>`;
}

/**
 * `<a>` link wrapper -- `klimt/drawing/svg/SvgGraphics.java`'s
 * `LinkData#updateAttributesOf` (`openLink`/`closeLink`), the SAME
 * attribute set/order for EVERY caller across the whole engine (class
 * diagrams, description, ...): `target`, `href`, `xlink:href`,
 * `xlink:type="simple"`, `xlink:actuate="onRequest"`, `xlink:show="new"`,
 * `title`, `xlink:title` (jar-verified byte-exact against
 * `gavimi-70-nuju057`/`cokeje-99-gede231`). `target` defaults to `_top`
 * (`SkinParam#getSvgLinkTarget()`'s own `getValue("svglinktarget",
 * "_top")` default) -- a `skinparam svgLinkTarget` override is NOT wired
 * (named remainder, `plans/g2-class-svg/ledger.md` N15).
 * @see ~/git/plantuml/.../klimt/drawing/svg/SvgGraphics.java:1105-1150
 * @see ~/git/plantuml/.../skin/SkinParam.java:1052-1053
 */
export function linkWrap(
  children: string,
  url: { readonly url: string; readonly tooltip: string },
  target = '_top',
): string {
  const href = escapeXml(url.url);
  const title = escapeXml(url.tooltip);
  const a = attrs([
    ['target', target],
    ['href', href],
    ['xlink:href', href],
    ['xlink:type', 'simple'],
    ['xlink:actuate', 'onRequest'],
    ['xlink:show', 'new'],
    ['title', title],
    ['xlink:title', title],
  ] as const);
  return `<a${a}>${children}</a>`;
}

/**
 * `<defs>` element.
 */
export function defs(children: string[]): string {
  return `<defs>${children.join('')}</defs>`;
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
export function foreignObject(
  x: number,
  y: number,
  w: number,
  h: number,
  content: string,
): string {
  return (
    `<foreignObject x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}">` +
    content +
    `</foreignObject>`
  );
}

// ---------------------------------------------------------------------------
// SVG root
// ---------------------------------------------------------------------------

/**
 * Builds the outer `<svg>` wrapper.
 *
 * Always embeds all arrow markers in a `<defs>` block so callers can
 * freely use `markerEnd`/`markerStart` referencing `arrowHeadRef(type)`
 * without worrying about whether the marker has been included.
 *
 * @param bgColor   - Background color used to fill hollow arrowheads (extension,
 *   implementation, aggregation) so the edge line is masked inside the shape.
 *   Defaults to white; pass `theme.colors.background` for theme correctness.
 * @param extraDefs - Optional extra `<marker>` (or other `<defs>`) strings to
 *   include in the single top-level `<defs>` block. Inserting markers here
 *   guarantees they are defined before any `url(#id)` reference in the body,
 *   which is required when the SVG is injected via `innerHTML`.
 */
// Matches one inline gradient def. Built from a string (not a regex literal) —
// the complexity checker miscounts `<`/`>` in literals. The id capture is the
// FNV/base36 content-hash `paintToSvg` emits (`g` + [0-9a-z]); `[\s\S]*?` is
// newline-safe and non-greedy so adjacent distinct defs don't merge.
const GRADIENT_DEF_RE = new RegExp(
  '<linearGradient id="(g[0-9a-z]+)"[\\s\\S]*?</linearGradient>',
  'g',
);

/**
 * Collapse repeated inline `<linearGradient>` defs (decision D3): shapes emit
 * their gradient def inline before themselves, so a gradient shared by N shapes
 * appears N times. Because the id is a content hash, repeats are byte-identical
 * — keep the first occurrence per id and drop the rest.
 */
function dedupeGradientDefs(svg: string): string {
  const seen = new Set<string>();
  return svg.replace(GRADIENT_DEF_RE, (match, id: string) => {
    if (seen.has(id)) return '';
    seen.add(id);
    return match;
  });
}

export function svgRoot(
  width: number,
  height: number,
  children: string[],
  bgColor = '#FFFFFF',
  extraDefs = '',
): string {
  const markers = ALL_ARROW_TYPES.map((t) => arrowHead(t, bgColor));
  const defsBlock = defs([...markers, extraDefs]);
  const isSolid = bgColor !== 'transparent' && bgColor !== PAINT_NONE;
  const bgRect = isSolid
    ? `<rect width="${fmt(width)}" height="${fmt(height)}" fill="${shortenColor(bgColor)}"/>`
    : '';
  const body = dedupeGradientDefs(defsBlock + bgRect + children.join(''));
  // Rule 3: `font-family`/`lengthAdjust` are hoisted here and inherited, so
  // no `<text>` below repeats them (see `svg-shapes.ts#text`).
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${fmt(width)}" height="${fmt(height)}" ` +
    `viewBox="0 0 ${fmt(width)} ${fmt(height)}" ` +
    `font-family="${ROOT_FONT_FAMILY}" lengthAdjust="${ROOT_LENGTH_ADJUST}">` +
    body +
    `</svg>`
  );
}
