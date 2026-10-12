/**
 * LaTeX label parsing, sizing, and rendering utilities.
 *
 * Labels in PlantUML can embed LaTeX math expressions inside
 * `<latex>…</latex>` tags.  These helpers parse such labels into spans,
 * size expressions by JLaTeXMath's `TeXIcon` rule (`latex-metrics.ts`), and
 * render them to SVG `<foreignObject>` containing KaTeX MathML.
 */

import katex from 'katex';
import { attrs, foreignObject, text } from './svg.js';
import type { StringMeasurer, FontSpec } from './measurer.js';
import type { Theme } from './theme.js';
import { toBase64 } from './klimt/sprite/png-encoder.js';
import { measureTeXIcon } from './latex-metrics.js';
import { KATEX_MACROS } from './latex-metrics/katex-glyphs.js';

// ---------------------------------------------------------------------------
// measureNodeLabel / renderNodeLabel — shared helpers for all diagram types
// ---------------------------------------------------------------------------

/**
 * Measure the bounding box of a node label, routing to {@link measureLatex}
 * when the label contains a `<latex>` tag, and to the string measurer
 * otherwise.
 */
export function measureNodeLabel(
  label: string,
  measurer: StringMeasurer,
  fontSpec: FontSpec,
): { width: number; height: number } {
  if (label.includes('<latex>')) {
    return measureLatex(label);
  }
  return measurer.measure(label, fontSpec);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Convert `$...$` inline math delimiters inside a LaTeX expression to KaTeX
 * inline-mode format.
 *
 * JLaTeXMath (the Java renderer) accepts `$x^2$` inside display content.
 * KaTeX does not recognise `$` as a delimiter, so we split on unescaped `$`
 * pairs and wrap text segments with `\text{…}`.
 *
 * Example: `set $x = \sqrt{y}$ and $i = 1$`
 *       →  `\text{set }x = \sqrt{y}\text{ and }i = 1`
 */
function preprocessDollarDelimiters(expr: string): string {
  if (!expr.includes('$')) return expr;
  const segments = expr.split('$');
  const parts: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i] ?? '';
    if (i % 2 === 0) {
      if (seg.length > 0) parts.push(`\\text{${seg}}`);
    } else {
      parts.push(seg);
    }
  }
  return parts.join('');
}

/**
 * Plain-text span estimate for {@link measureMixedLabel}. `renderNodeLabel`
 * receives no `StringMeasurer`, so the text beside a `<latex>` span is
 * estimated rather than measured; this has no upstream counterpart (upstream
 * lays such a label out as creole, text atoms beside an `AtomMath`). The
 * `<latex>` spans themselves are sized by {@link measureLatex}.
 */
const TEXT_SPAN_PX_PER_CHAR = 8;
const TEXT_SPAN_MIN_WIDTH_PX = 20;
const TEXT_SPAN_HEIGHT_PX = 24;

/** Sum bounding boxes across a parsed label span array. */
function measureMixedLabel(spans: LabelSpan[]): { width: number; height: number } {
  let totalWidth = 0;
  let maxHeight = 0;
  for (const span of spans) {
    if (span.kind === 'latex') {
      const { width: w, height: h } = measureLatex(span.expr);
      totalWidth += w;
      maxHeight = Math.max(maxHeight, h);
    } else {
      totalWidth += Math.max(TEXT_SPAN_MIN_WIDTH_PX, span.content.length * TEXT_SPAN_PX_PER_CHAR);
      maxHeight = Math.max(maxHeight, TEXT_SPAN_HEIGHT_PX);
    }
  }
  return { width: totalWidth, height: maxHeight };
}

/**
 * Render a node label as an SVG element, routing to KaTeX `<foreignObject>`
 * when the label contains a `<latex>` tag, and to a plain `<text>` element
 * otherwise.
 *
 * Mixed labels (text interleaved with `<latex>` spans) are rendered as a
 * foreignObject `<div>` combining plain `<span>` elements and inline KaTeX.
 *
 * @param label  - Raw label string (may contain `<latex>…</latex>`).
 * @param cx     - Horizontal centre of the label.
 * @param cy     - Vertical centre of the label.
 * @param theme  - Theme for font and color values.
 * @param fontSize - Optional override for the PLAIN-text branch, for an
 *   engine that resolves a PER-ELEMENT size rather than the diagram-wide
 *   `theme.fontSize` (activity: `activityDiagram { activity { FontSize 12 }
 *   }`, `plantuml.skin:361`). Defaults to `theme.fontSize`, so every
 *   existing caller is unaffected. The `<latex>` branch below ignores it:
 *   KaTeX sizing is a separate, unported axis (see `DIVERGENCES.md`), and
 *   threading a size into it would imply a fidelity this port does not have.
 */
export function renderNodeLabel(label: string, cx: number, cy: number, theme: Theme, fontSize?: number): string {
  if (!label.includes('<latex>')) {
    return text(cx, cy, label, {
      textAnchor: 'middle',
      fontFamily: theme.fontFamily,
      fontSize: fontSize ?? theme.fontSize,
      fill: theme.colors.text,
    });
  }

  const spans = parseLatexLabel(label);
  const { width: w, height: h } = measureMixedLabel(spans);
  const x = cx - w / 2;
  const y = cy - h / 2;

  if (spans.length === 1 && spans[0]!.kind === 'latex') {
    // Pure LaTeX — use display-mode foreignObject.
    const onlySpan = spans[0] as { kind: 'latex'; expr: string };
    const processed = preprocessDollarDelimiters(onlySpan.expr);
    return renderLatexMathML(processed, x, y, w, h, theme.colors.text);
  }

  // Mixed text + LaTeX — inline flexbox div with KaTeX in inline mode.
  const htmlParts = spans.map((span) => {
    if (span.kind === 'text') {
      return `<span>${escapeHtml(span.content)}</span>`;
    }
    const processed = preprocessDollarDelimiters(span.expr);
    return katex.renderToString(processed, {
      output: 'mathml',
      throwOnError: false,
      displayMode: false,
      macros: KATEX_MACROS,
    });
  });

  // `style` is built as a VALUE and emitted through `attrs()` so the theme
  // strings inside it (font name, text colour) are escaped once: a font name
  // carrying `"` used to terminate the attribute mid-value (PR #59 review;
  // decisions.md D5 addendum).
  const style =
    'display:flex;align-items:center;justify-content:center;width:100%;height:100%;' +
    `color:${theme.colors.text};font-family:${theme.fontFamily};font-size:${theme.fontSize}px`;
  const divAttrs = attrs([
    ['xmlns', 'http://www.w3.org/1999/xhtml'],
    ['style', style],
  ] as const);
  const inner = '<div' + divAttrs + '>' + htmlParts.join('') + '</div>';

  return foreignObject(x, y, w, h, inner);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LabelSpan = { kind: 'text'; content: string } | { kind: 'latex'; expr: string };

// ---------------------------------------------------------------------------
// parseLatexLabel
// ---------------------------------------------------------------------------

/**
 * Split a raw label string into an array of {@link LabelSpan} values.
 *
 * `<latex>…</latex>` regions become `{ kind: 'latex', expr }` spans.
 * Surrounding text becomes `{ kind: 'text', content }` spans.
 * Empty text spans are omitted from the result.
 *
 * Examples:
 *   "<latex>\\frac{a}{b}</latex>"
 *     → [{ kind:'latex', expr:'\\frac{a}{b}' }]
 *
 *   "prefix <latex>x^2</latex> suffix"
 *     → [{ kind:'text', content:'prefix ' }, { kind:'latex', expr:'x^2' },
 *        { kind:'text', content:' suffix' }]
 *
 *   "plain text"
 *     → [{ kind:'text', content:'plain text' }]
 */
export function parseLatexLabel(raw: string): LabelSpan[] {
  const spans: LabelSpan[] = [];
  // Case-insensitive to be tolerant of <LATEX>…</LATEX> variants.
  const re = /<latex>([\s\S]*?)<\/latex>/gi;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(raw)) !== null) {
    const before = raw.slice(last, match.index);
    if (before.length > 0) {
      spans.push({ kind: 'text', content: before });
    }
    spans.push({ kind: 'latex', expr: match[1] ?? '' });
    last = match.index + match[0].length;
  }

  const tail = raw.slice(last);
  if (tail.length > 0) {
    spans.push({ kind: 'text', content: tail });
  }

  // Guarantee at least one span — if input had no latex tags we still
  // return a text span (even for empty input: one empty text span).
  if (spans.length === 0) {
    spans.push({ kind: 'text', content: raw });
  }

  return spans;
}

// ---------------------------------------------------------------------------
// measureLatex
// ---------------------------------------------------------------------------

/**
 * The size of the image upstream draws for a LaTeX expression: JLaTeXMath's
 * `TeXIcon` dimensions for display style at size 20 with unit insets
 * (`math/TeXIconBuilder.java:52-73`), which `AtomMath#calculateDimensionSlow`
 * (`klimt/creole/atom/AtomMath.java:64-71`) reports at scale 1. The box is
 * typeset by JLaTeXMath's rules over KaTeX's parse tree and glyph metrics
 * (`latex-metrics.ts`). A `<latex>…</latex>` wrapper is stripped first.
 */
export function measureLatex(raw: string): { width: number; height: number } {
  const expr = raw.replace(/^<latex>([\s\S]*?)<\/latex>$/i, '$1').trim();
  const { width, height } = measureTeXIcon(expr);
  return { width, height };
}

// ---------------------------------------------------------------------------
// renderLatexMathML
// ---------------------------------------------------------------------------

/**
 * Render a LaTeX expression to an SVG `<foreignObject>` containing KaTeX
 * MathML output.
 *
 * @param expr   - LaTeX expression string.  `<latex>` / `</latex>` wrapper
 *                 tags are stripped automatically if present.
 * @param x      - Top-left x coordinate of the foreignObject.
 * @param y      - Top-left y coordinate of the foreignObject.
 * @param w      - Width of the foreignObject.
 * @param h      - Height of the foreignObject.
 * @param color  - Text fill color (applied as CSS `color` on the wrapper div).
 * @returns SVG string containing `<foreignObject …>…</foreignObject>`.
 */
export function renderLatexMathML(expr: string, x: number, y: number, w: number, h: number, color: string): string {
  // Strip <latex>…</latex> wrapper if present.
  const stripped = expr.replace(/^<latex>([\s\S]*?)<\/latex>$/i, '$1').trim();

  const mathml = katex.renderToString(stripped, {
    output: 'mathml',
    throwOnError: false,
    displayMode: true,
    macros: KATEX_MACROS,
  });

  // The foreignObject must contain an XHTML namespace wrapper for MathML to
  // render correctly in browsers.
  const divAttrs = attrs([
    ['xmlns', 'http://www.w3.org/1999/xhtml'],
    ['style', `display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:${color}`],
  ] as const);
  const inner = '<div' + divAttrs + '>' + mathml + '</div>';

  return foreignObject(x, y, w, h, inner);
}

/**
 * Render a single `<latex>…</latex>` expression to a standalone, self-
 * contained `data:image/svg+xml;base64,...` image -- the drawable form
 * E2r/L2's creole `<latex>` atom needs (mirrors how `<img>`/`<$sprite>`
 * atoms already resolve to `{href, width, height}`, `creole-atoms.ts
 * #AtomImageResolver`; the jar's own `CommandCreoleLatex` similarly
 * rasterizes/vectorizes each expression to an embedded image rather than
 * emitting live `<text>` -- see `plans/e2r-creole/ledger.md`'s `<latex>`
 * entry for why this can never be BYTE-conformant against the jar's own
 * JLaTeXMath-rendered image bytes, only structurally present). Wraps
 * `renderLatexMathML`'s `<foreignObject>` (positioned at the origin, since
 * this builds its OWN standalone SVG document) in a plain `<svg>` root,
 * then base64-encodes the UTF-8 bytes via the same RFC 4648 encoder
 * `sprite-raster.ts` already uses for PNG data URIs (browser-safe, no
 * `Buffer`/`btoa`).
 */
export function renderLatexAsImage(expr: string, color: string): { href: string; width: number; height: number } {
  const { width, height } = measureLatex(expr);
  const body = renderLatexMathML(expr, 0, 0, width, height, color);
  const svgDoc = `<svg${attrs([
    ['xmlns', 'http://www.w3.org/2000/svg'],
    ['width', String(width)],
    ['height', String(height)],
  ])}>${body}</svg>`;
  const bytes = new TextEncoder().encode(svgDoc);
  return { href: `data:image/svg+xml;base64,${toBase64(bytes)}`, width, height };
}
