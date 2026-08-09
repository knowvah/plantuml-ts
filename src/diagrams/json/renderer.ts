/**
 * JSON diagram SVG renderer.
 *
 * Synchronous: JsonGeometry + Theme → SVG string.
 * No DOM, no async, no canvas.
 */

import { rect, line, text, path, ellipse } from '../../core/svg.js';

import { buildCurvePath, veryFirstPoint, buildArrowHeadPath } from './JsonCurve.js';
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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function valueColor(
  valueType: JsonRowGeo['valueType'],
  json: Theme['colors']['graph']['json'],
): string {
  switch (valueType) {
    case 'string': return json?.stringValue ?? '#3A6E96';
    case 'number': return json?.numberValue ?? '#A67F52';
    case 'boolean': return json?.booleanValue ?? '#BE5D47';
    case 'null': return json?.nullValue ?? '#767676';
    // 'nested' — the three-space cell (`TextBlockJson.java:194`). There is no
    // per-type color to apply here, so it takes this family's plain node
    // FontColor, which the skin sets to black (:446). Was `#181818`.
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
  box: NodeStyleJson['box'],
  background: string,
): string {
  return rect(
    node.x + HIGHLIGHT_INSET_X,
    node.y + row.y,
    node.width - HIGHLIGHT_WIDTH_REDUCTION,
    row.height,
    {
      fill: background,
      stroke: background,
      strokeWidth: box.sepThickness,
      rx: HIGHLIGHT_ROUND / SVG_CORNER_DIVISOR,
      ry: HIGHLIGHT_ROUND / SVG_CORNER_DIVISOR,
    },
  );
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
function renderRow(node: JsonNodeGeo, row: JsonRowGeo, style: NodeStyleJson): string {
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
    hl.isHighlighted ? highlightRect(node, row, box, hl.background) : '',
    // `if (y > 0) ugline.draw(ULine.hline(trueWidth))` — no line above row 0.
    row.y > 0 ? line(node.x, rowTop, node.x + node.width, rowTop, sepStyle) : '',
    renderRowText(node, row, style, hl),
    // The divider lives INSIDE `if (line.b2 != null)`, so an array row -- whose
    // lines all have a null b2 -- gets none, and it spans only THIS row's
    // height rather than the node's.
    row.arrayEntry ? '' : line(dividerX, rowTop, dividerX, rowTop + row.height, sepStyle),
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
    parts.push(
      text(cellTextX(node.x, node.keyColWidth, row.keyWidth, ts.align), node.y + row.keyBaselineY, row.key, {
        ...common,
        fill: keyColor,
        textLength: row.keyTextLength,
        ...((hl.isHighlighted ? hl.fontBold : false) || ts.headerBold ? { fontWeight: '700' as const } : {}),
        ...(hl.isHighlighted && hl.fontItalic ? { fontStyle: 'italic' } : {}),
      }),
    );
  }

  if (row.value === '') return parts.join('');

  const baseColor = ts.fontColor ?? valueColor(row.valueType, style.json);
  const vColor = hl.isHighlighted && hl.fontColor !== undefined ? hl.fontColor : baseColor;
  // An array row's single cell IS column A, so it spans the whole node.
  const colLeft = row.arrayEntry ? node.x : node.x + node.keyColWidth;
  const colWidth = node.width - (row.arrayEntry ? 0 : node.keyColWidth);
  const bold = hl.isHighlighted ? hl.fontBold : ts.bold;
  const italic = hl.isHighlighted ? hl.fontItalic : ts.italic;

  for (let li = 0; li < row.valueLines.length; li++) {
    const lineWidth = row.valueLineWidths[li] ?? 0;
    parts.push(
      text(cellTextX(colLeft, colWidth, lineWidth, ts.align), node.y + (row.valueBaselineYs[li] ?? 0), row.valueLines[li]!, {
        ...common,
        fill: vColor,
        textLength: row.valueTextLengths[li] ?? 0,
        ...(bold ? { fontWeight: '700' as const } : {}),
        ...(italic ? { fontStyle: 'italic' } : {}),
      }),
    );
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
function renderNode(node: JsonNodeGeo, style: NodeStyleJson): string {
  const { box } = style;
  const corners = { rx: box.rx, ry: box.rx };
  const parts: string[] = [
    rect(node.x, node.y, node.width, node.height, {
      fill: box.bg,
      stroke: box.bg,
      strokeWidth: box.borderWidth,
      ...(box.borderDash !== undefined ? { strokeDasharray: box.borderDash } : {}),
      ...corners,
    }),
  ];

  for (const row of node.rows) parts.push(renderRow(node, row, style));

  parts.push(
    rect(node.x, node.y, node.width, node.height, {
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
function renderEdge(edge: JsonEdgeGeo, theme: Theme): string {
  // A5/T8: the path and the spot both come from the ported `JsonCurve`, which
  // consumes the engine's spline. This used to build its own S-curve and place
  // the spot on a horizontal offset; upstream extrapolates along the spline's
  // OWN direction (`JsonCurve#getVeryFirst` -> `supp`).
  const d = buildCurvePath(edge.points);
  if (d === '') return '';

  const json = theme.colors.graph.json;
  const stroke = json?.arrowColor ?? theme.colors.arrow;
  const strokeWidth = json?.arrowThickness ?? 1;
  // `yamlDiagram,jsonDiagram { arrow { LineStyle 3-3 } }` (`skin/plantuml.skin`
  // :449-451), emitted comma-separated — see `style-map-json-diagram.ts`.
  const strokeDasharray = json?.arrowDasharray ?? '3,3';

  const linePart = path(d, { stroke, strokeWidth, strokeDasharray, fill: 'none' });

  // `Arrow#drawArrow` — filled, and deliberately unstroked: the jar emits
  // `fill="#000"` with no `style` attribute at all on this element.
  const headD = buildArrowHeadPath(edge.points);
  const headPart = headD === '' ? '' : path(headD, { fill: stroke });

  // `JsonCurve#drawSpot`: a filled circle of radius 3 at the same extrapolated
  // point the stub starts from (`JsonCurve.java:114-118`), stroked by the
  // `UStroke.simple()` that call applies.
  const spot = veryFirstPoint(edge.points);
  const dotPart = spot !== undefined
    // `ellipse` takes RAW SVG attribute names, not the camelCase `BoxStyle`
    // keys `rect`/`line` use — `strokeWidth` here would emit a literal
    // `strokeWidth=` attribute.
    ? ellipse(spot.x, spot.y, 3, 3, { fill: stroke, stroke, 'stroke-width': 1 })
    : '';

  return linePart + headPart + dotPart;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render a JSON diagram geometry into an SVG string.
 */
/** The fixed-size diagnostic box drawn in place of a diagram whose JSON body
 *  would not parse. Not an upstream shape — this port's own error surface. */
function renderErrorBox(message: string): RenderFragment {
  const PAD = 12;
  const FONT_SIZE = 14;
  const msgWidth = message.length * FONT_SIZE * 0.6 + PAD * 2;
  const msgHeight = FONT_SIZE + PAD * 2;
  const body =
    rect(PAD, PAD, msgWidth, msgHeight, { fill: '#FFFFFF', stroke: '#888888', rx: 4 }) +
    text(PAD * 2, PAD * 2 + FONT_SIZE, message, {
      fontFamily: 'Courier, monospace',
      fontSize: FONT_SIZE,
      fill: '#000000',
    });
  return { body, width: msgWidth + PAD * 2, height: msgHeight + PAD * 2 };
}

export function renderJson(geo: JsonGeometry, theme: Theme): RenderFragment {
  if (geo.error !== undefined) return renderErrorBox(geo.error);

  if (geo.nodes.length === 0) {
    return { body: '', width: 0, height: 0 };
  }

  const style = resolveNodeStyle(theme);
  const parts: string[] = [];

  // Title is no longer drawn here (mission G0b/T8) -- it flows through
  // ast.annotations.title and is drawn once, centrally, by applyChrome
  // (src/index.ts) around the RenderFragment this function returns.
  for (const node of geo.nodes) {
    parts.push(renderNode(node, style));
  }

  for (const edge of geo.edges) {
    parts.push(renderEdge(edge, theme));
  }

  // No `extraDefs`: the jar's json documents carry an EMPTY `<defs/>` (M3).
  return {
    body: parts.join(''),
    width: geo.width,
    height: geo.height,
    background: theme.colors.background,
  };
}
