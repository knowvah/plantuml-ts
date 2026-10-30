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
import type { TextStyle } from '../../core/svg.js';
import { resolveScaleFactor } from '../../core/scale-command.js';
import { withDeferredFormat } from '../../core/svg-format.js';
import { scaleAtEmit } from './scale-at-emit.js';
import type { DrawnJson } from './scale-at-emit.js';

import {
  buildCurvePath,
  veryFirstPoint,
  buildArrowHeadPath,
  buildCurveSegments,
  buildArrowHeadSegments,
} from './JsonCurve.js';
import { penFor } from './renderer-pen.js';
import type { JsonPen, PenInk } from './renderer-pen.js';
import { resolveNodeStyle, JSON_SKIN_BLACK } from './renderer-style.js';
import type { ArrowStyleJson, CellPaint, NodeStyleJson, TextStyleJson } from './renderer-style.js';
import { highlightRect } from './json-renderer-highlight.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import type { JsonGeometry, JsonNodeGeo, JsonEdgeGeo, JsonRowGeo } from './layout.js';
import { calculateMargin } from '../../core/document-margin.js';
import type { DocumentMargin } from '../../core/document-margin.js';
import { ENSURE_VISIBLE_BUMP } from './document-dimensions.js';

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

/** `UFontFace.bold()`'s CSS weight (`UFontFace.java:56`). */
const BOLD_CSS_WEIGHT = 700;

/** `JsonCurve#drawSpot` — `new UEllipse(6, 6)` drawn at `-3, -3`, stroked with
 *  `UStroke.simple()` (`JsonCurve.java:114-118`). */
const SPOT_RADIUS = 3;
const SPOT_STROKE_WIDTH = 1;

/** `TitledDiagram#getDefaultMargins()` — `same(10)`, the fallback when no
 *  theme sets one. Mirrors `layout.ts#CANVAS_PAD`. */
const DEFAULT_MARGIN = 10;

/** `ClockwiseTopRightBottomLeft.same(10)` -- {@link DEFAULT_MARGIN} on all four sides. */
const DEFAULT_DOCUMENT_MARGIN: DocumentMargin = {
  top: DEFAULT_MARGIN,
  right: DEFAULT_MARGIN,
  bottom: DEFAULT_MARGIN,
  left: DEFAULT_MARGIN,
};

/** `UFontFactory.monospace(14)` — `JsonDiagram#drawU`'s hard-coded failure
 *  font (`JsonDiagram.java:116`), not the theme's. */
const PARSE_FAILURE_FONT_FAMILY = 'monospace';
const PARSE_FAILURE_FONT_SIZE = 14;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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
  const rowTop = node.y + row.y;
  const sepStyle = {
    stroke: box.sepColor,
    strokeWidth: box.sepThickness,
    ...(box.sepDash !== undefined ? { strokeDasharray: box.sepDash } : {}),
  };
  const dividerX = node.x + node.keyColWidth;

  return [
    row.highlight === false ? '' : highlightRect(node, row, style, style.highlightFill(row.highlight), pen),
    // `if (y > 0) ugline.draw(ULine.hline(trueWidth))` — no line above row 0.
    row.y > 0 ? pen.line(node.x, rowTop, node.x + node.width, rowTop, sepStyle) : '',
    renderRowText(node, row, style),
    // The divider lives INSIDE `if (line.b2 != null)`, so an array row -- whose
    // lines all have a null b2 -- gets none, and it spans only THIS row's
    // height rather than the node's.
    row.arrayEntry ? '' : pen.line(dividerX, rowTop, dividerX, rowTop + row.height, sepStyle),
  ].join('');
}

/**
 * `<text>`'s weight from the cell style's CSS weight (`DriverTextSvg.java:
 * 106-108` writes `face.toCssWeightString()` for any weight but 400). The
 * emitter writes the string verbatim; its `TextStyle` type only names the
 * bold weight, so the other weights (`FontWeight 300`, ...) are narrowed
 * here, at the one place that knows they are real.
 */
function fontWeightOf(cssWeight: number): NonNullable<TextStyle['fontWeight']> {
  return cssWeight === BOLD_CSS_WEIGHT ? '700' : (String(cssWeight) as NonNullable<TextStyle['fontWeight']>);
}

/** A cell's `<text>` presentation attributes, from the style it was measured with. */
function cellTextStyle(cell: CellPaint): TextStyle {
  return {
    fontFamily: cell.fontFamily,
    fontSize: cell.fontSize,
    fill: cell.fill,
    ...(cell.fontWeight === undefined ? {} : { fontWeight: fontWeightOf(cell.fontWeight) }),
    ...(cell.italic ? { fontStyle: 'italic' as const } : {}),
  };
}

/** Column A's cell then column B's, both as absolute-positioned `<text>`. */
function renderRowText(node: JsonNodeGeo, row: JsonRowGeo, style: NodeStyleJson): string {
  const ts = style.text;
  const parts: string[] = [];

  // A5/T6b: an ARRAY row has no key cell. Upstream puts the VALUE in `b1` and
  // never draws the index (it uses it only to resolve highlights).
  if (!row.arrayEntry) {
    // `getStyleToUse(true, highlighted)` (`TextBlockJson.java:123`).
    const keyStyle = cellTextStyle(style.cell(true, row.highlight));
    // Column A splits into atoms under wrap for the same reason column B does
    // — `getTextBlock` builds both from the same style, wrapWidth included.
    const keyX = cellTextX(node.x, node.keyColWidth, row.keyWidth, ts.align);
    for (const atom of row.keyAtoms) {
      parts.push(
        text(keyX + atom.dx, node.y + row.keyBaselineY, atom.text, {
          ...keyStyle,
          textLength: atom.textLength,
        }),
      );
    }
  }

  // No early return for an empty value: an empty cell still draws (a space,
  // per `TextBlockJson.ts#cellLines`). `valueLines` is always non-empty.

  // `getStyleToUse(false, highlighted)` (`TextBlockJson.java:124,130`): every
  // value cell, nested's three-space one included, takes this one style.
  const runStyle = cellTextStyle(style.cell(false, row.highlight));
  // An array row's single cell IS column A, so it spans the whole node.
  const colLeft = row.arrayEntry ? node.x : node.x + node.keyColWidth;
  const colWidth = node.width - (row.arrayEntry ? 0 : node.keyColWidth);

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
function renderEdge(edge: JsonEdgeGeo, arrow: ArrowStyleJson, pen: JsonPen): string {
  // A5/T8: the path and the spot both come from the ported `JsonCurve`, which
  // consumes the engine's spline. This used to build its own S-curve and place
  // the spot on a horizontal offset; upstream extrapolates along the spline's
  // OWN direction (`JsonCurve#getVeryFirst` -> `supp`).
  const d = buildCurvePath(edge.points);
  if (d === '') return '';

  // `getStyleArrow()`'s `LineColor`, `LineThickness` and `LineStyle`
  // (`SmetanaForJson.java:119-122,172,175-176`; skin `arrow { LineStyle 3-3 }`,
  // `plantuml.skin:449-451`). Drawn at 1x: the dash goes through `format` with
  // every other numeric at emit, so `3-3` at scale 2 comes out as `6,6`
  // (`scaleJsonBody`) -- jar-verified on `json/timafu-94-bixe774`.
  const stroke = arrow.color;
  const strokeWidth = arrow.thickness;

  const linePart = pen.path(buildCurveSegments(edge.points), d, {
    stroke,
    strokeWidth,
    ...(arrow.dash === undefined ? {} : { strokeDasharray: arrow.dash }),
    fill: 'none',
  });

  // `Arrow#drawArrow` — filled, and deliberately unstroked: the jar emits
  // `fill="#000"` with no `style` attribute at all on this element.
  const headD = buildArrowHeadPath(edge.points, edge.ep);
  const headPart = headD === '' ? '' : pen.path(buildArrowHeadSegments(edge.points, edge.ep), headD, { fill: stroke });

  // `JsonCurve#drawSpot`: a filled circle of radius 3 at the same extrapolated
  // point the stub starts from (`JsonCurve.java:114-118`), stroked by the
  // `UStroke.simple()` that call applies.
  const spot = veryFirstPoint(edge.points);
  const dotPart =
    spot !== undefined
      ? // `ellipse` takes RAW SVG attribute names, not the camelCase `BoxStyle`
        // keys `rect`/`line` use — `strokeWidth` here would emit a literal
        // `strokeWidth=` attribute.
        pen.ellipse(spot.x, spot.y, SPOT_RADIUS, SPOT_RADIUS, {
          fill: stroke,
          stroke,
          'stroke-width': SPOT_STROKE_WIDTH,
        })
      : '';

  return linePart + headPart + dotPart;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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
function renderParseFailure(geo: JsonGeometry): string {
  const at = geo.errorLayout;
  return at === undefined
    ? ''
    : text(at.x, at.y, geo.error ?? '', {
        fontFamily: PARSE_FAILURE_FONT_FAMILY,
        fontSize: PARSE_FAILURE_FONT_SIZE,
        fill: JSON_SKIN_BLACK,
        textLength: at.textLength,
      });
}

/**
 * The margin-less block `JsonDiagram` hands `DiagramChromeFactory`, and the
 * document margin `TextBlockExporter` wraps around the chromed result.
 *
 * Upstream composes `getTextBlock` -> `addChrome` -> exporter margin
 * (`UgDiagram.java:124,128`): `JsonDiagram#getTextBlock` returns `this`
 * (`JsonDiagram.java:140-142`) sized by `calculateDimension`'s ink only
 * (`JsonDiagram.java:130-137`), `addChrome` builds the title around THAT block
 * (`DiagramChromeFactory.java:363-376` -> `DecorateEntityImage.addTop`), and
 * only then does `TextBlockExporter` translate everything by the margin
 * (`TextBlockExporter.java:173`) and size it `dim + margins` plus
 * `ensureVisible`'s `+1` (`:199-203`). `canvasWidth`/`canvasHeight` are the
 * already-margined canvas this producer draws into, so the block is the canvas
 * minus both margins minus that `+1`; `applyExportedChrome`
 * (`core/annotations/chrome-export.ts`) removes the margin, chromes the block
 * and re-applies the margin. The margin is `TextBlockExporter.java:510-516`:
 * the style's `Margin`, else `TitledDiagram.java:275-277` `same(10)`.
 *
 * A fragment with no annotations never reaches that path
 * (`chrome-export.ts:44`), so declaring the block changes nothing for it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgDiagram.java:124-128
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/JsonDiagram.java:130-142
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:173,199-203,510-516
 */
function declaredBlock(
  canvasWidth: number,
  canvasHeight: number,
  theme: Theme,
): Pick<RenderFragment, 'width' | 'height' | 'preChromeWidth' | 'preChromeHeight' | 'documentMargin'> {
  const margin = calculateMargin(theme, DEFAULT_DOCUMENT_MARGIN);
  return {
    width: canvasWidth,
    height: canvasHeight,
    preChromeWidth: canvasWidth - (margin.left + margin.right) - ENSURE_VISIBLE_BUMP,
    preChromeHeight: canvasHeight - (margin.top + margin.bottom) - ENSURE_VISIBLE_BUMP,
    documentMargin: margin,
  };
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

/**
 * `skinparam lengthAdjust` carrier (D4: spread only when defined, never
 * `'spacing'`). EXTENSION, user ruling 2026-10-23 (decisions.md Amendment 1):
 * the jar ignores the skinparam for json/yaml/hcl (`StyleExtractor.java:
 * 88-96`), so `theme.lengthAdjust` is `undefined` in jar-compatible mode and
 * the output stays SPACING. Otherwise the jar's mechanism applies:
 * `TextBlockExporter.java:306-307`, `SvgGraphics.java:155-158,699-705`.
 */
function lengthAdjustOf(theme: Theme): Pick<RenderFragment, 'lengthAdjust'> {
  return theme.lengthAdjust === undefined ? {} : { lengthAdjust: theme.lengthAdjust };
}

/**
 * The page's elements and their canvas size, all at 1x -- the parse-failure
 * page when the body did not parse, otherwise every node then every edge.
 */
function drawJson(geo: JsonGeometry, theme: Theme): DrawnJson {
  if (geo.error !== undefined) {
    return { body: renderParseFailure(geo), width: geo.width, height: geo.height };
  }
  const style = resolveNodeStyle(geo.styles);
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
    parts.push(renderEdge(edge, style.arrow, pen));
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
  const dims = ink === undefined ? { width: geo.width, height: geo.height } : handwrittenDims(ink, theme);
  return { body: parts.join(''), ...dims, background: theme.colors.background };
}

/**
 * Render a JSON diagram geometry into an SVG fragment.
 */
export function renderJson(geo: JsonGeometry, theme: Theme): RenderFragment {
  // Nothing parsed and no error page to draw: no canvas either.
  if (geo.error === undefined && geo.nodes.length === 0) return { body: '', width: 0, height: 0 };

  // `scale …` (StyleExtractor.java:82-83 -> JsonDiagram.java:90-99). Resolved
  // against the unscaled dims, because that is the order upstream uses:
  // `computeScaleFactor(dim)` reads `calculateFinalDimension()`'s own pre-scale
  // result (`TextBlockExporter.java:205-209`).
  const dim = geo.finalDimension ?? { width: geo.width, height: geo.height };
  // cdd-T30: UNLIKE description/sequence/class, json/yaml/hcl's `dpi` term
  // is deliberately left at its 96 (no-op) default here, never
  // `theme.dpi` -- `JsonDiagram`'s own `SkinParam` is built from
  // `StyleExtractor`, a narrow extractor (`jsondiagram/StyleExtractor.java:
  // 82-89`) that recognises only `<style>`, `!assume`, `!pragma`, `hide`,
  // `scale`, `title` and `skin` among its leading directive lines --
  // `skinparam dpi N` falls into its generic `skinparam ` arm, which checks
  // ONLY for `handwritten`+`true` and a `{`-nested block, then DISCARDS the
  // line outright. `SkinParam#getDpi()` therefore always returns its 96
  // default for every json/yaml/hcl diagram, regardless of source content
  // -- confirmed against the jar-captured `json/kicati-76-guvi771/in.svg`
  // (`skinparam dpi 600` in the source, `font-size="14"` in the oracle,
  // i.e. UNSCALED). Mirrors `scale`'s own already-existing special-case
  // above (`json/parser.ts`'s dedicated `matchScaleCommand` capture,
  // itself modeled on `StyleExtractor`'s OWN `scale` arm) -- `dpi` has no
  // such arm, so this port reproduces that omission exactly by never
  // reading `theme.dpi` here.
  const k = resolveScaleFactor(geo.scale, dim.width, dim.height);
  const scaled = k !== 1;
  const drawn = withDeferredFormat(scaled, () => drawJson(geo, theme));
  const emitted = scaled ? scaleAtEmit(drawn, k) : drawn;
  return {
    body: emitted.body,
    ...declaredBlock(emitted.width, emitted.height, theme),
    ...(emitted.background === undefined ? {} : { background: emitted.background }),
    // `SvgGraphics.java:808-811`: the root `width`/`height` are `format(maxX)`.
    ...(scaled ? { scaledCanvas: true as const } : {}),
    ...lengthAdjustOf(theme),
  };
}
