/**
 * renderer-edge-label.ts — a relationship's plain text label, its magic-
 * arrow glyph, and the shared arrow-label font resolution. Split out of
 * `renderer-edge.ts` (cdd3-T33, 500-line hook cap) — a pure move,
 * re-exported from that file so no consumer's import path changed.
 */
import { spriteTintHref } from '../../core/klimt/sprite/sprite-tint.js';
import type { EdgeLabelRun } from './class-edge-label-sprite-runs.js';
import { text, attrs, image } from '../../core/svg.js';
import { formatDecimal, DEFAULT_SVG_DECIMALS } from '../../core/svg-format.js';
import { resolveArrowLabelFont } from '../../core/arrow-label-font.js';
import type { ScaledTheme } from './class-scale-geo.js';
import type { EdgeGeo } from './layout.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { hasTabulation, layoutTabbedText } from '../../core/klimt/creole/legacy/AtomText.js';

type LabelFontAttrs = ReturnType<typeof arrowLabelTextAttrs>;

/** One `<text>` of a label line: its own x, text and `textLength`. */
interface LabelTextRun {
  readonly text: string;
  readonly x: number;
  readonly width: number;
}

/**
 * unwind2-S3: a link-label line is ONE `AtomText` run, whose `drawU` draws
 * one `<text>` per non-tab token at its tab stop (`AtomText.java:210-231`).
 * The layout sized the line through the same walk (`tabStopMeasurer`), so
 * only the split is left for draw time. The fonts here are the SCALED ones
 * (`arrowLabelTextAttrs`), and the width table is linear in the size, so the
 * walk lands on the scaled stops. A tab-free line (or a renderer handed no
 * measurer) is the single run it always was.
 */
function labelTextRuns(
  line: LabelTextRun,
  font: LabelFontAttrs,
  measurer: StringMeasurer | undefined,
): readonly LabelTextRun[] {
  if (measurer === undefined || !hasTabulation(line.text)) return [line];
  const spec: FontSpec = {
    family: font.fontFamily,
    size: font.fontSize,
    ...(font.fontWeight === '700' ? { weight: 'bold' as const } : {}),
    ...(font.fontStyle === 'italic' ? { style: 'italic' as const } : {}),
  };
  const { tokens } = layoutTabbedText(line.text, spec.size, (s) => measurer.measure(s, spec).width);
  return tokens.map((t) => ({ text: t.text, x: line.x + t.x, width: t.width }));
}

export function arrowLabelTextAttrs(theme: ScaledTheme): {
  fontSize: number;
  fontFamily: string;
  fontWeight?: '700';
  fontStyle?: 'italic';
} {
  // cdd-B8FU: `resolveArrowLabelFont` (SHARED `core/arrow-label-font.ts`) stays unscaled regardless of `ScaledTheme` -- scaled here (class-only).
  const font = resolveArrowLabelFont(theme);
  return {
    fontSize: font.size * theme.scaleK,
    fontFamily: font.family,
    ...(font.weight === 'bold' ? { fontWeight: '700' as const } : {}),
    ...(font.style === 'italic' ? { fontStyle: 'italic' as const } : {}),
  };
}

/**
 * G2 item 44 / SI25 D1: the magic-arrow glyph `<polygon>` -- jar's
 * `TextBlockArrow2#drawU` (`klimt/shape/TextBlockArrow2.java:63-77`), the
 * ONE emitter for both the whole-label glyph (`geo.arrowGlyph`) and the
 * per-line glyphs (`geo.labelLines[i].glyph`). `fill`/`stroke` are BOTH
 * the label font's own colour (`FontConfiguration#getColor()`, default
 * `#000000` -- `TextBlockArrow2.java:66-67`'s `ug.apply(color)` +
 * `ug.apply(color.bg())`) -- NOT the edge's own `strokeColor`, unlike the
 * main arrowhead polygons -- jar-verified against `lojepe-37-liri985`'s
 * golden `<polygon>`. Drawn as separate presentation attributes (not one
 * `style="..."` string like jar's own klimt-pipeline output) --
 * semantically identical post-normalization (`tests/oracle/svg-
 * conformance/normalize.ts` expands `style` into individual attributes
 * before comparing). T7b: routed through `attrs()` so each coordinate is
 * formatted (ADR-1). Returns `undefined` for a malformed (non-3-point)
 * glyph.
 */
export function magicArrowPolygon(points: ReadonlyArray<{ x: number; y: number }>, color: string): string | undefined {
  const [p0, p1, p2] = points;
  if (p0 === undefined || p1 === undefined || p2 === undefined) return undefined;
  const fmt = (n: number): string => formatDecimal(n, DEFAULT_SVG_DECIMALS);
  const pts = [p0, p1, p2, p0].map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(',');
  return `<polygon${attrs([
    ['points', pts],
    ['fill', color],
    ['stroke', color],
    ['stroke-width', 1],
    ['stroke-linejoin', 'miter'],
    ['stroke-miterlimit', 10],
  ])}/>`;
}

/** One `labelLines` entry's `<text>`s -- one per tab-stop token
 *  ({@link labelTextRuns}). */
function renderLabelLine(
  line: NonNullable<EdgeGeo['labelLines']>[number],
  font: LabelFontAttrs,
  labelColor: string,
  measurer: StringMeasurer | undefined,
): string[] {
  return labelTextRuns(line, font, measurer).map((run) =>
    text(run.x, line.y, run.text, { fill: labelColor, ...font, lengthAdjust: 'spacing', textLength: run.width }),
  );
}

/** S-8 (cdd2-T7): a per-line `<b>`/`**` override wins over the shared
 *  arrow-font weight/style -- see `EdgeGeo.labelLines[].bold`/`.italic`'s
 *  own doc comments (class-geo-types.ts). */
function lineFontAttrs(base: LabelFontAttrs, line: { bold?: boolean; italic?: boolean }): LabelFontAttrs {
  return {
    ...base,
    ...(line.bold === true ? { fontWeight: '700' as const } : {}),
    ...(line.italic === true ? { fontStyle: 'italic' as const } : {}),
  };
}

/**
 * G2/N25 (tailLabel/headLabel) + G2/N62 (label): a relationship's plain
 * text label AND its tail/head multiplicity-role labels shared ONE
 * jar-verified byte-exact attribute set (`kipure-14-suli112`/`dokego-92-
 * zilu832` `in.svg` for tail/head; `siteza-47-lixe343` for a plain
 * label -- see `class-geo-builders.ts#attachEdgeLabel`'s doc comment) --
 * `font-size="13"`, `lengthAdjust="spacing"` + `textLength`,
 * `font-family="sans-serif"`, NO `text-anchor` (SVG default "start" --
 * see `renderer-classifier-box.ts#renderRowText`'s identical omission for
 * the same reason) -- true ONLY because both drew from `plantuml.skin`'s
 * SAME default `arrow { FontSize 13 }` block
 * (`GraphvizImageBuilder.java:235-238`). **D3/D4 (T5):** upstream resolves
 * the main label's font and the cardinality font SEPARATELY
 * (`GraphvizImageBuilder.java:124-126,234-241`), so a diagram overriding
 * ONLY `arrow { FontSize/FontStyle/FontName }` (not `arrow.cardinality`)
 * now diverges the two -- `geo.label`/`geo.labelLines` (the main label)
 * draw at `labelFontAttrs` (caller's {@link arrowLabelTextAttrs});
 * `geo.tailLabel`/`geo.headLabel` (cardinality/quantifier) keep the
 * untouched `CARDINALITY_FONT_SIZE` literal below. **T3 (D2/D3/D5/D6,
 * `plans/arrow-label-font-colour/decisions.md`, oracle experiment "a"):**
 * `fill` is no longer a shared `#000000` literal -- the main label/
 * per-line glyph fill is `labelColor`
 * (`resolveArrowLabelFont(theme).color`, D2/D3), the tail/head fill is
 * `cardinalityColor` (`resolveCardinalityFontColor(theme)`, D5 -- inherits
 * `labelColor` absent a `theme.cardinalityFontColor` override, D6). Absent
 * any override both still resolve to `#000000` (D3: NEVER
 * `theme.colors.text`), so every fixture with no arrow font override
 * renders byte-identical to before.
 *
 * G2 item 43: `geo.labelLines` (multi-line `label`) draws one `<text>`
 * per line -- mutually exclusive with `geo.label`
 * (`class-geo-builders.ts#attachEdgeLabel` sets exactly one of the two).
 * SI25 D1: a guide-line label's per-line glyph (`labelLines[i].glyph`,
 * `StringWithArrow#addSeveralMagicArrows`) draws BEFORE its line's
 * `<text>` -- `mergeLR(arrow, label, ...)` puts the arrow block first and
 * `TextBlockHorizontal#drawU` walks its blocks in order
 * (`klimt/shape/TextBlockHorizontal.java:79-91`); jar's `gobuco-16-
 * ruke239` SVG interleaves `<polygon>`, `<text>`, `<polygon>`, `<text>`...
 * per line. A bare-token line (`text === ''`, T2's `splitGuideLines`) is
 * the arrow block alone (`mergeLR`'s `b2 == EMPTY` arm, `TextBlockUtils
 * .java:112-119`), so no `<text>` is emitted for it.
 *
 * Hoisted out of `renderEdge` (T3, split further into this function plus
 * `renderEdgeCardinalityLabels`, `renderer-edge-extras.ts`) to keep both
 * under the lizard NLOC/CCN caps -- pure extraction, no behavior change
 * beyond the `fill` values above.
 */
export function renderEdgeMainLabel(
  geo: EdgeGeo,
  labelFontAttrs: LabelFontAttrs,
  labelColor: string,
  measurer?: StringMeasurer,
): string[] {
  const parts: string[] = [];
  for (const line of geo.labelLines ?? []) {
    if (line.glyph !== undefined) {
      const glyph = magicArrowPolygon(line.glyph.points, labelColor);
      if (glyph !== undefined) parts.push(glyph);
      if (line.text === '') continue;
    }
    parts.push(...renderLabelLine(line, lineFontAttrs(labelFontAttrs, line), labelColor, measurer));
  }
  if (geo.label !== undefined) parts.push(...renderEdgeSingleLabel(geo.label, labelFontAttrs, labelColor, measurer));
  // T2d (kexaba-26-kobu577): mutually exclusive with `geo.label` --
  // `attachEdgeLabel` sets at most one (`EdgeGeo.labelImage`'s own doc
  // comment).
  if (geo.labelImage !== undefined) parts.push(renderEdgeLabelImage(geo.labelImage));
  return parts;
}

/** {@link EdgeGeo.labelImage} -- a lone-sprite label's resolved PNG, drawn
 *  the SAME 5-attribute shape `core/svg.ts#image` already produces for a
 *  member row's inline `<$name>` (`renderer-note.ts#renderNoteLineAtoms`'s
 *  identical call shape). */
function renderEdgeLabelImage(img: NonNullable<EdgeGeo['labelImage']>): string {
  return image(img.x, img.y, img.width, img.height, img.href);
}

/** {@link renderEdgeMainLabel}'s single-line `geo.label` arm, split out
 *  purely to keep that function's NLOC under the project's per-function
 *  cap (cdd-T25) -- `fontSize` overrides the base arrow font's SIZE for a
 *  magic-arrow label's own resolved `<size:N>` tag
 *  (`class-edge-label-attach.ts#attachMagicArrow`'s doc comment has the
 *  jar-verified derivation, `xamule-03-jeda376`); `undefined` for every
 *  other label, which keeps drawing at `labelFontAttrs.fontSize`
 *  unchanged. */
export function renderEdgeSingleLabel(
  label: NonNullable<EdgeGeo['label']>,
  labelFontAttrs: LabelFontAttrs,
  labelColor: string,
  measurer?: StringMeasurer,
): string[] {
  const font: LabelFontAttrs =
    label.fontSize !== undefined ? { ...labelFontAttrs, fontSize: label.fontSize } : labelFontAttrs;
  if (label.runs !== undefined) return renderSpriteLabelRuns(label, label.runs, font, labelColor);
  return labelTextRuns(label, font, measurer).map((run) =>
    text(run.x, label.y, run.text, {
      fill: labelColor,
      ...font,
      // T2d (rimeca-17-gice904): `EdgeGeo.label.underline`'s own doc comment.
      ...(label.underline === true ? { textDecoration: 'underline' } : {}),
      lengthAdjust: 'spacing',
      textLength: run.width,
    }),
  );
}

/** A sprite's tint end is `forcedColor ?? fontColor` (`SpriteMonochrome
 *  .java:216-217`) -- the label's own colour unless the markup forced one. */
function runHref(run: Extract<EdgeLabelRun, { kind: 'image' }>, labelColor: string): string {
  return run.tint === undefined
    ? run.href
    : spriteTintHref({ ...run.tint, color: run.tint.color ?? labelColor }, undefined);
}

/** unwind2-S11: a text+`<$sprite>` label (`class-edge-label-sprite-runs.ts`)
 *  -- each text atom its own `<text>` on the shared baseline, each sprite
 *  its `<image>` at `dy` from it, drawn at the raster's rounded size as a
 *  class row image is (`renderer-classifier-rows.ts`). No `Back` is applied
 *  before an edge label, so a monochrome sprite tints over white
 *  (`SpriteMonochrome.java:181-182`). */
function renderSpriteLabelRuns(
  label: { readonly x: number; readonly y: number },
  runs: readonly EdgeLabelRun[],
  font: LabelFontAttrs,
  labelColor: string,
): string[] {
  const parts: string[] = [];
  let x = label.x;
  for (const run of runs) {
    if (run.kind === 'image') {
      parts.push(image(x, label.y + run.dy, Math.round(run.width), Math.round(run.height), runHref(run, labelColor)));
    } else if (run.text.trim() !== '') {
      parts.push(
        text(x, label.y, run.text, { fill: labelColor, ...font, lengthAdjust: 'spacing', textLength: run.width }),
      );
    }
    x += run.width;
  }
  return parts;
}
