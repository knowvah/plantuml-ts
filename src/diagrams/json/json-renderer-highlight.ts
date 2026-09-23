/**
 * `#highlight`-class + row-separator dash-scaling helpers for the JSON
 * renderer — split out of renderer.ts (cdd-T30, 500-line file-size cap) to
 * make room for the widened `resolveScaleFactor` dpi-term call site. A pure
 * move: every function/constant below, doc comments included, is unchanged
 * from the pre-split renderer.ts.
 */

import { fmt } from '../../core/svg-format.js';
import { SVG_CORNER_DIVISOR } from './renderer-style.js';
import type { NodeStyleJson, TextStyleJson, HighlightClassStyle } from './renderer-style.js';
import type { JsonPen } from './renderer-pen.js';
import type { JsonNodeGeo, JsonRowGeo } from './layout.js';

/** `URectangle.build(trueWidth - 2, heightOfRow).rounded(4)` drawn at
 *  `UTranslate(1.5, 0)` from the row's own origin — the three pre-scale
 *  literal lengths below take the diagram's `scale` the same way every
 *  other emitted numeric does. */
const HIGHLIGHT_INSET_X = 1.5;
const HIGHLIGHT_WIDTH_REDUCTION = 2;
const HIGHLIGHT_ROUND = 4;

/** The named `#highlight` class this row carries, if any — `''` means
 *  "highlighted, but with no named class", i.e. the default highlight. */
export function highlightClassOf(row: JsonRowGeo, box: NodeStyleJson['box']): HighlightClassStyle {
  if (row.highlight === false || row.highlight === '') return {};
  return box.highlightClasses?.[row.highlight] ?? {};
}

export function highlightFontFlags(cls: HighlightClassStyle, ts: TextStyleJson) {
  return {
    fontBold: cls.fontBold ?? ts.hlFontBold,
    fontItalic: cls.fontItalic ?? ts.hlFontItalic,
    // A named `.h1` class declares FontStyle exactly when its two flags are
    // set (`style-map-json-diagram.ts:311-315`), same rule as the unnamed
    // `highlight` block. Either source declaring it replaces the enclosing
    // node's FontStyle outright -- see `TextStyleJson.hlFontStyleDeclared`.
    fontStyleDeclared: cls.fontBold !== undefined || ts.hlFontStyleDeclared,
  };
}

/** The per-row style overrides a named highlight class contributes. */
export function highlightOverrides(row: JsonRowGeo, style: NodeStyleJson) {
  const cls = highlightClassOf(row, style.box);
  return {
    isHighlighted: row.highlight !== false,
    background: cls.background ?? style.box.hlBg,
    fontColor: cls.fontColor ?? style.text.hlFontColor,
    ...highlightFontFlags(cls, style.text),
  };
}

/** `URectangle.build(trueWidth - 2, heightOfRow).rounded(4)` drawn at
 *  `UTranslate(1.5, 0)` from the row's own origin, with fill AND stroke set to
 *  the highlight color (`.apply(cellBackColor).apply(cellBackColor.bg())`). */
export function highlightRect(
  node: JsonNodeGeo,
  row: JsonRowGeo,
  style: NodeStyleJson,
  background: string,
  pen: JsonPen,
): string {
  // The three literals below are pre-scale lengths, so they take the diagram's
  // `scale` the same way every other emitted numeric does (`style.scale`, set
  // by `scale-geo.ts#scaleNodeStyle`; 1 when unscaled).
  const k = style.scale;
  return pen.rect(
    node.x + HIGHLIGHT_INSET_X * k,
    node.y + row.y,
    node.width - HIGHLIGHT_WIDTH_REDUCTION * k,
    row.height,
    {
      fill: background,
      stroke: background,
      // The highlight rect is drawn through `ugline`, which descends from
      // `ugSeparator = styleSeparator.applyStrokeAndLineColor(ug, …)`
      // (`TextBlockJson.java:287`, used at :296-300). So it inherits the
      // SEPARATOR's whole stroke -- thickness and dash alike -- not the node's
      // and not a plain one. Only the colors are overridden, by the
      // `.apply(cellBackColor).apply(cellBackColor.bg())` on the draw itself.
      strokeWidth: style.box.sepThickness,
      ...(style.box.sepDash === undefined ? {} : { strokeDasharray: style.box.sepDash }),
      rx: (HIGHLIGHT_ROUND * k) / SVG_CORNER_DIVISOR,
      ry: (HIGHLIGHT_ROUND * k) / SVG_CORNER_DIVISOR,
    },
  );
}

/**
 * `stroke-dasharray` is a list of lengths, and every one goes through
 * `SvgGraphics#format` — so each is both scaled AND rounded to the document's
 * decimal precision. `fmt` is that rounding; without it a scaled dash emits
 * JavaScript's full `1.5536997475237913` where the jar writes `1.556`.
 * Non-numeric tokens are passed through untouched.
 */
export function scaleDasharray(dash: string, k: number): string {
  if (k === 1) return dash;
  return dash.replace(/[0-9]*\.?[0-9]+/g, (n) => fmt(Number(n) * k));
}

/**
 * The key cell's weight. `header.node.highlight`: a highlight that DECLARED a
 * FontStyle replaces the skin's `node { header { FontStyle bold } }` outright;
 * one that did not leaves it standing.
 */
export function keyIsBold(hl: ReturnType<typeof highlightOverrides>, ts: TextStyleJson): boolean {
  return replacesFontStyle(hl) ? hl.fontBold : ts.headerBold;
}

/** Whether this row's highlight supplies the FontStyle for its cells. */
export function replacesFontStyle(hl: ReturnType<typeof highlightOverrides>): boolean {
  return hl.isHighlighted && hl.fontStyleDeclared;
}
