/**
 * JSON diagram SVG renderer.
 *
 * Synchronous: JsonGeometry + Theme → SVG string.
 * No DOM, no async, no canvas.
 */

// Shapes are drawn through the PEN (`renderer-pen.ts`), not emitted directly:
// a handwritten diagram routes every one of them through the sketchy builders.
// `text` is the exception — upstream's handwritten decorator does not touch
// text, it falls through to `getUg().draw(shape)`.
import { text } from '../../core/svg.js';
import { resolveScaleFactor } from '../../core/scale-command.js';
import { scaleJsonGeometry, scaleNodeStyle } from './scale-geo.js';

import { buildCurvePath, veryFirstPoint, buildArrowHeadPath, buildCurveSegments, buildArrowHeadSegments } from './JsonCurve.js';
import { penFor } from './renderer-pen.js';
import type { JsonPen, PenInk } from './renderer-pen.js';
import { resolveNodeStyle, SVG_CORNER_DIVISOR, JSON_SKIN_BLACK } from './renderer-style.js';
import type { NodeStyleJson, TextStyleJson, HighlightClassStyle } from './renderer-style.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import type { JsonGeometry, JsonNodeGeo, JsonEdgeGeo, JsonRowGeo } from './layout.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * `TextBlockUtils.withMargin(result, 5, 2)` — every json cell's text block
 * (`TextBlockJson.java:348`). The horizontal half is the only one this module
 * needs; the vertical half is already folded into the row baselines the layout
 * hands over (`TextBlockJson.ts#cellMetrics`).
 *
 * Replaces an unsourced `H_PAD = 8`, which put every label 3px right of the
 * jar's.
 */
const CELL_MARGIN_X = 5;

/** `URectangle.build(trueWidth - 2, heightOfRow).rounded(4)` at
 *  `UTranslate(1.5, 0)` — the highlighted-row backing rect
 *  (`TextBlockJson.java:295-301`). */
const HIGHLIGHT_INSET_X = 1.5;
const HIGHLIGHT_WIDTH_REDUCTION = 2;
const HIGHLIGHT_ROUND = 4;

/** `JsonCurve#drawSpot` — `new UEllipse(6, 6)` drawn at `-3, -3`, stroked with
 *  `UStroke.simple()` (`JsonCurve.java:114-118`). */
const SPOT_RADIUS = 3;
const SPOT_STROKE_WIDTH = 1;

/** `TitledDiagram#getDefaultMargins()` — `same(10)`, the fallback when no
 *  theme sets one. Mirrors `layout.ts#CANVAS_PAD`. */
const DEFAULT_MARGIN = 10;

/** `UFontFactory.monospace(14)` — `JsonDiagram#drawU`'s hard-coded failure
 *  font (`JsonDiagram.java:116`), not the theme's. */
const PARSE_FAILURE_FONT_FAMILY = 'monospace';
const PARSE_FAILURE_FONT_SIZE = 14;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function valueColor(
  valueType: JsonRowGeo['valueType'],
  json: Theme['colors']['graph']['json'],
): string {
  // Upstream has NO per-type value styling: `TextBlockJson#getTextBlock` builds
  // every cell from one `getStyleToUse(false, highlighted)` style, whose
  // FontColor the skin sets to black for this family (`plantuml.skin:446`).
  // So all five arms resolve to the same color unless a THEME has set one —
  // which is exactly what the four fields exist for, and what all 20 built-in
  // themes use them for (each sets a single shared value color).
  switch (valueType) {
    case 'string': return json?.stringValue ?? JSON_SKIN_BLACK;
    case 'number': return json?.numberValue ?? JSON_SKIN_BLACK;
    case 'boolean': return json?.booleanValue ?? JSON_SKIN_BLACK;
    case 'null': return json?.nullValue ?? JSON_SKIN_BLACK;
    // 'nested' — the three-space cell (`TextBlockJson.java:194`).
    default: return json?.keyText ?? JSON_SKIN_BLACK;
  }
}


/**
 * `HorizontalAlignment#draw(ug, tb, 0, 0, width)` — the block (text plus its
 * `withMargin` on both sides) is placed at `0`, `width - dim`, or
 * `(width - dim) / 2`, and the text then sits one margin inside it. Reduced
 * here to the resulting text origin.
 *
 * Upstream emits an absolute `x` and never a `text-anchor`, which is why this
 * returns a coordinate rather than an anchor.
 */
function cellTextX(colLeft: number, colWidth: number, textWidth: number, align: TextStyleJson['align']): number {
  if (align === 'center') return colLeft + (colWidth - textWidth) / 2;
  if (align === 'right') return colLeft + colWidth - textWidth - CELL_MARGIN_X;
  return colLeft + CELL_MARGIN_X;
}

/** The named `#highlight` class this row carries, if any — `''` means
 *  "highlighted, but with no named class", i.e. the default highlight. */
function highlightClassOf(row: JsonRowGeo, box: NodeStyleJson['box']): HighlightClassStyle {
  if (row.highlight === false || row.highlight === '') return {};
  return box.highlightClasses?.[row.highlight] ?? {};
}

function highlightFontFlags(cls: HighlightClassStyle, ts: TextStyleJson) {
  return {
    fontBold: cls.fontBold ?? ts.hlFontBold,
    fontItalic: cls.fontItalic ?? ts.hlFontItalic,
  };
}

/** The per-row style overrides a named highlight class contributes. */
function highlightOverrides(row: JsonRowGeo, style: NodeStyleJson) {
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
function highlightRect(
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
      strokeWidth: style.box.sepThickness,
      rx: (HIGHLIGHT_ROUND * k) / SVG_CORNER_DIVISOR,
      ry: (HIGHLIGHT_ROUND * k) / SVG_CORNER_DIVISOR,
    },
  );
}

/** `stroke-dasharray` is a list of lengths, and `SvgGraphics#format` scales
 *  each one. Non-numeric tokens are passed through untouched. */
function scaleDasharray(dash: string, k: number): string {
  if (k === 1) return dash;
  return dash.replace(/[0-9]*\.?[0-9]+/g, (n) => String(Number(n) * k));
}

/**
 * One `TextBlockJson.Line`, in upstream's own draw order
 * (`TextBlockJson.java:291-317`): highlight backing rect, then the row's top
 * separator, then column A's text, then column B's text followed by the
 * column divider.
 *
 * Every coordinate is absolute. Upstream's `ugline` is the node's `UGraphic`
 * translated by `UTranslate.dy(y)`, and `SvgGraphics` resolves a translate
 * into the emitted coordinates rather than into a `<g transform>` — which is
 * why the jar's output is one flat run of elements per node and this function
 * emits no group of its own.
 */
function renderRow(node: JsonNodeGeo, row: JsonRowGeo, style: NodeStyleJson, pen: JsonPen): string {
  const { box } = style;
  const hl = highlightOverrides(row, style);
  const rowTop = node.y + row.y;
  const sepStyle = {
    stroke: box.sepColor,
    strokeWidth: box.sepThickness,
    ...(box.sepDash !== undefined ? { strokeDasharray: box.sepDash } : {}),
  };
  const dividerX = node.x + node.keyColWidth;

  return [
    hl.isHighlighted ? highlightRect(node, row, style, hl.background, pen) : '',
    // `if (y > 0) ugline.draw(ULine.hline(trueWidth))` — no line above row 0.
    row.y > 0 ? pen.line(node.x, rowTop, node.x + node.width, rowTop, sepStyle) : '',
    renderRowText(node, row, style, hl),
    // The divider lives INSIDE `if (line.b2 != null)`, so an array row -- whose
    // lines all have a null b2 -- gets none, and it spans only THIS row's
    // height rather than the node's.
    row.arrayEntry ? '' : pen.line(dividerX, rowTop, dividerX, rowTop + row.height, sepStyle),
  ].join('');
}

/** Column A's cell then column B's, both as absolute-positioned `<text>`. */
function renderRowText(
  node: JsonNodeGeo,
  row: JsonRowGeo,
  style: NodeStyleJson,
  hl: ReturnType<typeof highlightOverrides>,
): string {
  const ts = style.text;
  const parts: string[] = [];
  const common = { fontFamily: ts.fontFamily, fontSize: ts.fontSize };

  // A5/T6b: an ARRAY row has no key cell. Upstream puts the VALUE in `b1` and
  // never draws the index (it uses it only to resolve highlights).
  if (!row.arrayEntry) {
    const keyColor = hl.isHighlighted && hl.fontColor !== undefined ? hl.fontColor : ts.keyColor;
    const keyStyle = {
      ...common,
      fill: keyColor,
      ...((hl.isHighlighted ? hl.fontBold : false) || ts.headerBold ? { fontWeight: '700' as const } : {}),
      ...(hl.isHighlighted && hl.fontItalic ? { fontStyle: 'italic' as const } : {}),
    };
    // Column A splits into atoms under wrap for the same reason column B does
    // — `getTextBlock` builds both from the same style, wrapWidth included.
    const keyX = cellTextX(node.x, node.keyColWidth, row.keyWidth, ts.align);
    for (const atom of row.keyAtoms) {
      parts.push(text(keyX + atom.dx, node.y + row.keyBaselineY, atom.text, {
        ...keyStyle, textLength: atom.textLength,
      }));
    }
  }

  // No early return for an empty value: an empty cell still draws (a space,
  // per `TextBlockJson.ts#cellLines`). `valueLines` is always non-empty.

  const baseColor = ts.fontColor ?? valueColor(row.valueType, style.json);
  const vColor = hl.isHighlighted && hl.fontColor !== undefined ? hl.fontColor : baseColor;
  // An array row's single cell IS column A, so it spans the whole node.
  const colLeft = row.arrayEntry ? node.x : node.x + node.keyColWidth;
  const colWidth = node.width - (row.arrayEntry ? 0 : node.keyColWidth);
  const bold = hl.isHighlighted ? hl.fontBold : ts.bold;
  const italic = hl.isHighlighted ? hl.fontItalic : ts.italic;

  const runStyle = {
    ...common,
    fill: vColor,
    ...(bold ? { fontWeight: '700' as const } : {}),
    ...(italic ? { fontStyle: 'italic' as const } : {}),
  };
  for (let li = 0; li < row.valueLines.length; li++) {
    // The LINE is aligned as a whole, then its atoms lay out left-to-right
    // from that origin. Wrap off => exactly one atom, so this is the same
    // single `<text>` as before; wrap on => one per word and inter-word space
    // (`Fission.ts`), which is what the jar emits.
    const lineX = cellTextX(colLeft, colWidth, row.valueLineWidths[li] ?? 0, ts.align);
    const baseline = node.y + (row.valueBaselineYs[li] ?? 0);
    for (const atom of row.valueAtoms[li] ?? []) {
      parts.push(text(lineX + atom.dx, baseline, atom.text, { ...runStyle, textLength: atom.textLength }));
    }
  }
  return parts.join('');
}

/**
 * One json node, mirroring `TextBlockJson#drawU` (`TextBlockJson.java:260-320`)
 * element for element:
 *
 *   1. the filled rounded rect — `ugNode.apply(backColor.bg()).apply(backColor)`
 *      sets fill AND stroke to the background color;
 *   2. every row, in order (see {@link renderRow});
 *   3. the SAME rect again, this time stroke-only, so the border paints over
 *      the row fills at the rounded corners.
 *
 * Three things this port used to draw that upstream does not, all removed:
 * a per-node `<defs><clipPath>`, a key-column background rect (`drawU` paints
 * no such column — the `header` style contributes font, not fill), and a
 * single full-height column divider in place of upstream's per-row one.
 */
function renderNode(node: JsonNodeGeo, style: NodeStyleJson, pen: JsonPen): string {
  const { box } = style;
  const corners = { rx: box.rx, ry: box.rx };
  const parts: string[] = [
    pen.rect(node.x, node.y, node.width, node.height, {
      fill: box.bg,
      stroke: box.bg,
      strokeWidth: box.borderWidth,
      ...(box.borderDash !== undefined ? { strokeDasharray: box.borderDash } : {}),
      ...corners,
    }),
  ];

  for (const row of node.rows) parts.push(renderRow(node, row, style, pen));

  parts.push(
    pen.rect(node.x, node.y, node.width, node.height, {
      fill: 'none',
      stroke: box.border,
      strokeWidth: box.borderWidth,
      ...(box.borderDash !== undefined ? { strokeDasharray: box.borderDash } : {}),
      ...corners,
    }),
  );

  return parts.join('');
}

/**
 * One json edge, in `SmetanaForJson#drawMe`'s own order (:173-175): the curve
 * and its arrowhead (both inside `JsonCurve#drawCurve`), then the spot.
 *
 * A5 ledger **M3**: the arrowhead is an INLINE filled `<path>`, not an SVG
 * `<marker>`. Upstream has no markers anywhere — `drawCurve` ends by
 * constructing an `Arrow` and drawing it — so the marker this port used to
 * emit also left a child in the document's `<defs>`, which the jar leaves
 * empty. Same mechanism mission G4 landed for state diagrams.
 *
 * This port previously drew the spot FIRST, reversing upstream's order.
 */
function renderEdge(edge: JsonEdgeGeo, theme: Theme, pen: JsonPen, k: number): string {
  // A5/T8: the path and the spot both come from the ported `JsonCurve`, which
  // consumes the engine's spline. This used to build its own S-curve and place
  // the spot on a horizontal offset; upstream extrapolates along the spline's
  // OWN direction (`JsonCurve#getVeryFirst` -> `supp`).
  const d = buildCurvePath(edge.points);
  if (d === '') return '';

  const json = theme.colors.graph.json;
  const stroke = json?.arrowColor ?? theme.colors.arrow;
  const strokeWidth = (json?.arrowThickness ?? 1) * k;
  // `yamlDiagram,jsonDiagram { arrow { LineStyle 3-3 } }` (`skin/plantuml.skin`
  // :449-451), emitted comma-separated — see `style-map-json-diagram.ts`.
  // Dashes go through `format` like every other numeric, so `3-3` at scale 2
  // is emitted as `6,6` -- jar-verified on `json/timafu-94-bixe774`.
  const strokeDasharray = scaleDasharray(json?.arrowDasharray ?? '3,3', k);

  const linePart = pen.path(buildCurveSegments(edge.points), d, {
    stroke, strokeWidth, strokeDasharray, fill: 'none',
  });

  // `Arrow#drawArrow` — filled, and deliberately unstroked: the jar emits
  // `fill="#000"` with no `style` attribute at all on this element.
  const headD = buildArrowHeadPath(edge.points);
  const headPart = headD === '' ? '' : pen.path(buildArrowHeadSegments(edge.points), headD, { fill: stroke });

  // `JsonCurve#drawSpot`: a filled circle of radius 3 at the same extrapolated
  // point the stub starts from (`JsonCurve.java:114-118`), stroked by the
  // `UStroke.simple()` that call applies.
  const spot = veryFirstPoint(edge.points);
  const dotPart = spot !== undefined
    // `ellipse` takes RAW SVG attribute names, not the camelCase `BoxStyle`
    // keys `rect`/`line` use — `strokeWidth` here would emit a literal
    // `strokeWidth=` attribute.
    // Radius and stroke are pre-scale lengths, so both take `k` like every
    // other numeric `SvgGraphics#format` writes.
    ? pen.ellipse(spot.x, spot.y, SPOT_RADIUS * k, SPOT_RADIUS * k, {
        fill: stroke, stroke, 'stroke-width': SPOT_STROKE_WIDTH * k,
      })
    : '';

  return linePart + headPart + dotPart;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render a JSON diagram geometry into an SVG string.
 */
/**
 * The page upstream draws when the body will not parse — `JsonDiagram#drawU`'s
 * `root == null` branch. ONE monospace text and nothing else: no box, no
 * border. `layout.ts#layoutParseFailure` computed its position and width,
 * because only the layout stage holds a measurer.
 *
 * The spaces reach the SVG as NBSP without anything here asking: the family is
 * `monospace`, and `core/svg-shapes.ts` carries upstream's
 * `SvgGraphics.java:727-728` rule. `textLength` is deliberately the RAW width,
 * as upstream measures before that swap.
 *
 * Replaced a bespoke 640x80 red box — the same shape the class engine used
 * before its refusals were routed through the jar's own error page.
 */
function renderParseFailure(geo: JsonGeometry): RenderFragment {
  const at = geo.errorLayout;
  const body = at === undefined ? '' : text(at.x, at.y, geo.error ?? '', {
    fontFamily: PARSE_FAILURE_FONT_FAMILY,
    fontSize: PARSE_FAILURE_FONT_SIZE,
    fill: JSON_SKIN_BLACK,
    textLength: at.textLength,
  });
  return { body, width: geo.width, height: geo.height };
}

/**
 * The document size for a handwritten diagram: the drawn SPAN plus the
 * diagram margins plus `ensureVisible`'s truncating `+1`.
 *
 * The span is translation-invariant, so the already-applied margin on the
 * shapes does not need removing first. There is no `-1` ink corner here —
 * that belongs to `LimitFinder#drawRectangle`, and a handwritten diagram
 * draws no rectangles.
 *
 * Verified against `yaml/litife-43-novo083`: its polygons span x 9.778..182.057
 * and y 9.287..73.247, which with the x-only polygon padding gives
 * `trunc(192.279 + 20 + 1) = 213` by `trunc(63.960 + 20 + 1) = 84` — the
 * golden's exact `viewBox`.
 */
function handwrittenDims(ink: PenInk, theme: Theme): { width: number; height: number } {
  const m = theme.diagramMargin;
  const marginX = m === undefined ? DEFAULT_MARGIN * 2 : m.left + m.right;
  const marginY = m === undefined ? DEFAULT_MARGIN * 2 : m.top + m.bottom;
  return {
    width: ink.maxX - ink.minX + marginX + 1,
    height: ink.maxY - ink.minY + marginY + 1,
  };
}

export function renderJson(rawGeo: JsonGeometry, rawTheme: Theme): RenderFragment {
  // `scale …` (StyleExtractor.java:82-83 -> JsonDiagram.java:90-99). Resolved
  // HERE, against the unscaled dims, because that is the order upstream uses:
  // `computeScaleFactor(dim)` reads `calculateFinalDimension()`'s own pre-scale
  // result, then every numeric is multiplied on the way out by
  // `SvgGraphics#format`. See `scale-geo.ts` for why this port multiplies the
  // inputs instead of the outputs, and why that is the same arithmetic.
  const k = resolveScaleFactor(rawGeo.scale, rawGeo.width, rawGeo.height);
  const geo = scaleJsonGeometry(rawGeo, k);
  const theme = rawTheme;

  if (geo.error !== undefined) return renderParseFailure(geo);

  if (geo.nodes.length === 0) {
    return { body: '', width: 0, height: 0 };
  }

  // Scaled AFTER resolution so a skin DEFAULT scales identically to a theme
  // override -- see `scale-geo.ts#scaleNodeStyle`.
  const style = scaleNodeStyle(resolveNodeStyle(theme), k);
  // ONE pen per diagram: the handwritten one carries the shared random stream.
  const pen = penFor(theme.handwritten);
  const parts: string[] = [];

  // Title is no longer drawn here (mission G0b/T8) -- it flows through
  // ast.annotations.title and is drawn once, centrally, by applyChrome
  // (src/index.ts) around the RenderFragment this function returns.
  for (const node of geo.nodes) {
    parts.push(renderNode(node, style, pen));
  }

  for (const edge of geo.edges) {
    parts.push(renderEdge(edge, theme, pen, k));
  }

  // No `extraDefs`: the jar's json documents carry an EMPTY `<defs/>` (M3).
  //
  // A handwritten diagram re-derives its own size from what was actually
  // drawn. `JsonDiagram#calculateDimension` measures by DRAWING into a
  // `LimitFinder`, and `drawU` wraps that finder in `UGraphicHandwritten`
  // too — so the measured shapes are the jiggled ones, and every rectangle
  // has become a polygon. `layout.ts` cannot know that extent without
  // repeating the jiggle, and the pen already has it.
  const ink = pen.ink();
  const dims = ink === undefined
    ? { width: geo.width, height: geo.height }
    : handwrittenDims(ink, theme);
  return {
    body: parts.join(''),
    ...dims,
    background: theme.colors.background,
  };
}
