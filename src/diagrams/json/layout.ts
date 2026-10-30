/**
 * JSON diagram layout engine.
 *
 * Synchronous: JsonDiagramAST + Theme + StringMeasurer → JsonGeometry
 * via the dot layout engine (rankDir: LR).
 *
 * No DOM, no SVG. All I/O is plain data.
 */

import type { JsonDiagramAST } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { layoutGraph as dotLayout } from '../../core/graph-layout.js';
import type { DotInputEdge, DotInputGraph, DotInputNode, DotLayoutResult } from '../../core/graph-layout.js';
import { measureNode } from './TextBlockJson.js';
import { recordLabelFor } from './record-label.js';
import type { JsonObject } from './JsonObject.js';
import { JsonNumber } from './JsonNumber.js';
import type { JsonRowGeo, MeasuredNode } from './TextBlockJson.js';
import { jsonNodePositions, type JsonNodePosition } from './json-node-position.js';
import type { Mirror } from './Mirror.js';
import { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';

// A5/T6b: node sizing moved to `TextBlockJson.ts` (upstream's own class
// boundary). Re-exported so `renderer.ts` and every existing consumer keep
// importing `JsonRowGeo` from here.
export type { JsonRowGeo } from './TextBlockJson.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * A5/T6b: the diagram's own margin, from `TitledDiagram#getDefaultMargins()`
 * -- `ClockwiseTopRightBottomLeft.same(10)` (`TitledDiagram.java:275-277`).
 * `JsonDiagram` does not override it. This port previously used an unsourced 8.
 */
const CANVAS_PAD = 10;

/**
 * The diagram's outer margin for THIS render — a theme's own `Margin` when it
 * declares one, else {@link CANVAS_PAD}.
 *
 * `TextBlockExporter#calculateMargin` (`:510-516`) reads the merged style for
 * `root.document` and only falls back to `TitledDiagram#getDefaultMargins()`
 * when that style has no `Margin`. 7 built-in themes set 5, so a themed
 * diagram's whole canvas shifts — `json/vogeku-38-soxe333` under
 * `!theme plain` places its first node at `(5, 14)` in the jar against this
 * port's former `(10, 19)`.
 *
 * Reduced to left/top and the two axis totals: this family's layout offsets by
 * the leading margin and sizes by both. The four sides are kept on the theme
 * because upstream's value has four; only the uniform form occurs today.
 */
function marginsOf(theme: Theme): { left: number; top: number; x: number; y: number } {
  const m = theme.diagramMargin;
  if (m === undefined) return { left: CANVAS_PAD, top: CANVAS_PAD, x: CANVAS_PAD * 2, y: CANVAS_PAD * 2 };
  return { left: m.left, top: m.top, x: m.left + m.right, y: m.top + m.bottom };
}

/** `TextBlockUtils.withMargin(result, 5, 2)` — the same per-cell margins
 *  `TextBlockJson.ts` uses, applied to the parse-failure message too
 *  (`JsonDiagram.java:120`). */
const CELL_MARGIN_X = 5;
const CELL_MARGIN_Y = 2;

// ---------------------------------------------------------------------------
// Public output types
// ---------------------------------------------------------------------------

/** A positioned JSON node (one object or array) */
export interface JsonNodeGeo {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Width of left (key) column */
  keyColWidth: number;
  /** Width of right (value) column */
  valueColWidth: number;
  rows: JsonRowGeo[];
}

/** A routed edge from a parent node row to a child node */
export interface JsonEdgeGeo {
  points: ReadonlyArray<{ x: number; y: number }>;
  /** The arrow's attachment point (graphviz `bezier.ep`), already transposed
   *  into diagram space alongside `points`. Absent when the engine placed no
   *  arrow on this end — upstream nulls it on the same condition and then
   *  draws no arrowhead at all (`JsonCurve.java:72-82`, `#drawCurve`). */
  ep?: { x: number; y: number };
  spline: boolean;
}

export interface JsonGeometry {
  /**
   * The family's styles at the jar's signatures, resolved once from `ast.skinParam`
   * (`TextBlockJson.java:112-152`, `SmetanaForJson.java:112-125`): what measurement and paint read
   * instead of `Theme.colors.graph.json` (decisions D2/D3).
   */
  styles: JsonStyleSet;
  nodes: JsonNodeGeo[];
  edges: JsonEdgeGeo[];
  width: number;
  height: number;
  /**
   * The `scale …` directive, carried from the AST unresolved. Resolved to a
   * numeric factor by `renderJson` against `width`/`height` above, which are
   * the UNSCALED document dims — the same order upstream uses
   * (`TextBlockExporter#computeScaleFactor`).
   */
  scale?: ScaleSpec;
  /**
   * `TextBlockExporter#calculateFinalDimension()` — ink extent plus margins,
   * WITHOUT the `ensureVisible` `+1` that `width`/`height` above carry. This
   * is what {@link scale} is resolved against, because that is the value
   * upstream passes to `computeScaleFactor`.
   *
   * Optional so hand-authored geometry literals in tests compile unchanged;
   * `renderJson` falls back to `width`/`height` when absent.
   */
  finalDimension?: { width: number; height: number };
  /** When the body could not be parsed, the message to display. */
  error?: string;
  /**
   * Where that message is drawn, and how wide it measures. Computed at layout
   * time because only this stage holds a `StringMeasurer`.
   */
  errorLayout?: { x: number; y: number; textLength: number };
}

// ---------------------------------------------------------------------------
// Value display helpers
// ---------------------------------------------------------------------------

import { walkTree, EMPTY_MAP, buildHighlightMap } from './json-layout-prep.js';
import type { JsonContainer, FlatNode, BuildRowsOptions } from './json-layout-prep.js';
import type { ScaleSpec } from '../../core/scale-command.js';
import { documentDimensions, ENSURE_VISIBLE_BUMP } from './document-dimensions.js';
import { resolveJsonStyles, type JsonStyleSet } from './json-style-resolve.js';

/**
 * @see ~/git/plantuml/.../jsondiagram/JsonDiagram.java:78-88 (the constructor)
 *
 * Upstream normalises the root before anything measures it, and the two cases
 * are not what this port assumed (A5 / T6b — both found by reading the Java
 * after the measured residual refused to explain itself):
 *
 *  - A **primitive** root (string / boolean / number / null) becomes a
 *    `JsonArray` holding that value. This port used to wrap it in a synthetic
 *    single-entry OBJECT keyed by the empty string, which puts the value in
 *    the wrong column: upstream's array rows carry their value in `b1`, and
 *    `getWidthColB` returns 0 for them (`TextBlockJson.java:127-134`).
 *
 *  - An **empty** object or array becomes a `JsonArray` holding one empty
 *    STRING. This is why the jar draws `{}` as a 10x18 box: one array row
 *    whose only cell is `""`, so `0 + 2*CELL_MARGIN_X` wide and
 *    `textHeight + 2*CELL_MARGIN_Y` tall. It is NOT `MIN_WIDTH`/`MIN_HEIGHT`,
 *    which this port previously assumed — those stay as upstream's defensive
 *    fallback for a genuinely line-less block, which this substitution makes
 *    unreachable from the diagram root.
 */
function normalizeRoot(root: unknown): JsonContainer {
  if (typeof root !== 'object' || root === null || root instanceof JsonNumber) return [root] as JsonContainer;
  const isEmpty = Array.isArray(root) ? root.length === 0 : (root as JsonObject).size === 0;
  return (isEmpty ? [''] : root) as JsonContainer;
}

// ---------------------------------------------------------------------------
// Public layout function
// ---------------------------------------------------------------------------

/**
 * `FontConfiguration.blackBlueTrue(UFontFactory.monospace(14))` — the fixed
 * font `JsonDiagram#drawU` builds the failure message with
 * (`JsonDiagram.java:114-121`). Deliberately NOT the theme's font or size:
 * upstream hard-codes both on this path.
 */
const PARSE_FAILURE_FONT = { family: 'monospace', size: 14 };

/**
 * The page upstream draws when the body will not parse — `drawU`'s
 * `root == null` branch (`JsonDiagram.java:113-121`):
 *
 *     Display.getWithNewlines(pragma, "Your data does not sound like " + type + " data")
 *     …create(monospace 14, HorizontalAlignment.LEFT, skinParam)
 *     TextBlockUtils.withMargin(result, 5, 2)
 *     result.drawU(ug)
 *
 * ONE text and nothing else — no box, no border. This port drew its own
 * 640x80 red box here, the same bespoke shape the class engine used before
 * refusals were routed through the jar's own error page.
 *
 * Document size follows the family's normal chain (see `documentDimensions`),
 * with one difference that matters: a TEXT's ink is its box exactly
 * (`LimitFinder.java:217-225`), with none of the `-1` corner a rectangle
 * contributes, and `TextBlockMarged` draws a `UEmpty` of the full margined
 * size so the ink is `text + 2·5` wide by `text + 2·2` tall. Jar-verified on
 * `json/nixaxa-46-muge983`: `trunc(230.388 + 10 + 20 + 1) = 261` by
 * `trunc(14 + 4 + 20 + 1) = 39`, against its golden's `viewBox="0 0 261 39"`.
 */
function layoutParseFailure(
  ast: JsonDiagramAST,
  measurer: StringMeasurer,
  margin: ReturnType<typeof marginsOf>,
): JsonGeometry {
  const message = `Your data does not sound like ${ast.diagramLabel ?? 'JSON'} data`;
  const { width: textWidth, height: textHeight } = measurer.measure(message, PARSE_FAILURE_FONT);
  const inkWidth = textWidth + 2 * CELL_MARGIN_X;
  const inkHeight = textHeight + 2 * CELL_MARGIN_Y;
  return {
    styles: resolveJsonStyles(ast.skinParam),
    nodes: [],
    edges: [],
    width: inkWidth + margin.x + ENSURE_VISIBLE_BUMP,
    height: inkHeight + margin.y + ENSURE_VISIBLE_BUMP,
    error: message,
    errorLayout: {
      x: margin.left + CELL_MARGIN_X,
      y: margin.top + CELL_MARGIN_Y + textHeight - measurer.getDescent(PARSE_FAILURE_FONT, message),
      // Upstream measures for `textLength` BEFORE `SvgGraphics#text` swaps
      // spaces for NBSP under a monospace family, so this is the raw width.
      textLength: textWidth,
    },
    ...(ast.scale === undefined ? {} : { scale: ast.scale }),
  };
}

/**
 * The one measuring input that is not a style: `skinparam tabSize`, which
 * upstream hangs off the `FontConfiguration` (`FontConfiguration#getTabSize`)
 * and `tab-stops.ts` reads. Font family, size, weight, italic and the wrap
 * width come from each cell's jar style (`TextBlockJson.ts`, `getTextBlock`
 * `:340-349`), no longer from `Theme.colors.graph.json`.
 */
function measureOptionsOf(theme: Theme): BuildRowsOptions {
  return theme.tabSize === undefined ? {} : { tabSize: theme.tabSize };
}

/**
 * Build the dot-engine's node inputs, one `shape=record` per measured JSON
 * node. A5/T6 (ADR-1): dimensions are SWAPPED on the way in -- upstream
 * hands graphviz each node's height as its width and vice versa
 * (`SmetanaForJson.java:236-244`) so the graph solves top-to-bottom in a
 * transposed frame, then transposes the answer back. See
 * `json-node-position.ts`.
 * A5/T7: real `shape=record` nodes with a `<Pn>` port per row, so each edge
 * leaves the ROW it belongs to. `recordLabelFor` builds the label upstream
 * builds (`SmetanaForJson#getDotLabelArray`/`#getDotLabelMap`).
 *
 * This spaces same-rank siblings further apart than the jar does -- graphviz
 * PADs every record field (`XPAD` = 4*GAP = 16, `macros.h:27-29`) and
 * upstream's `colAwidth - 8` offsets only the `YPAD` half, so a node grows by
 * 16 per row. **That is real graphviz's behaviour, not a defect here**:
 * verified against the installed `dot` 15.1.1 on an equivalent 3-port record,
 * which returns w=0.92708 h=0.69444 -- byte-identical to what this seam
 * produces. The jar shows no such inflation because Smetana does not
 * reproduce it, and per CLAUDE.md ("Smetana is NOT a porting target") that
 * delta is accepted and named rather than chased. See DIVERGENCES.md.
 */
function buildJsonDotNodes(measured: MeasuredNode[]): DotInputNode[] {
  return measured.map((m) => ({
    id: m.flatNode.id,
    width: m.totalHeight,
    height: m.totalWidth,
    shape: 'record' as const,
    recordLabel: recordLabelFor(m),
  }));
}

/** One parent->child edge. @see ~/git/plantuml/.../jsondiagram/SmetanaForJson.java#createEdge (:217-231) */
function createEdge(parent: FlatNode, child: FlatNode, measuredById: Map<string, MeasuredNode>): DotInputEdge {
  // `tailport="P<rowIndex>"` -- `SmetanaForJson#createEdge` (:224) names the
  // port by the child's index among the parent's rows.
  const parentM = measuredById.get(parent.id);
  const rowIndex = parentM?.rows.findIndex((r) => r.key === (child.parentKey ?? '')) ?? -1;
  // `SmetanaForJson#createEdge` (:221-223) sets all three arrow attrs on
  // EVERY edge, unconditionally and in this order, right before the
  // `tailport` below. They make graphviz shorten the spline for the arrow
  // and record its attachment point as `bezier.ep` — read back below as
  // `epX`/`epY` and drawn by `JsonCurve.ts`.
  const edge: DotInputEdge = {
    id: `${parent.id}->${child.id}`,
    from: parent.id,
    to: child.id,
    attributes: { arrowsize: '.75', arrowtail: 'none', arrowhead: 'normal' },
  };
  if (rowIndex >= 0) edge.attributes!.tailport = `P${rowIndex}`;
  return edge;
}

/**
 * The dot-engine's edge inputs, one per parent->child link, in upstream's
 * POST-order. @see ~/git/plantuml/.../jsondiagram/SmetanaForJson.java#manageOneNode (:128-145)
 *
 * The recursive `manageOneNode(child)` (`:139`) returns BEFORE that child's
 * edge is created (`:140`) and appended (`:141`); that list is both the
 * `agedge` creation order and `drawMe`'s draw order (`:172-176`). Nodes stay
 * pre-order (`nodes.add`, `:133`, precedes the loop), as `flatNodes` is; its
 * sibling order is key order, and scalars never become a `FlatNode` (the
 * `tmp != null` skip, `:138`). Was `walkTree`'s pre-order, which put an edge
 * at a different `<path>` index from the jar's (ddc T1a, `diagnosis/edge-order.md`).
 */
function buildJsonDotEdges(flatNodes: FlatNode[], measured: MeasuredNode[]): DotInputEdge[] {
  const measuredById = new Map(measured.map((m) => [m.flatNode.id, m]));
  const childrenOf = new Map<string, FlatNode[]>();
  for (const fn of flatNodes) {
    if (fn.parentId === null) continue;
    const siblings = childrenOf.get(fn.parentId) ?? [];
    siblings.push(fn);
    childrenOf.set(fn.parentId, siblings);
  }
  const edges: DotInputEdge[] = [];
  const manageOneNode = (current: FlatNode): void => {
    for (const child of childrenOf.get(current.id) ?? []) {
      manageOneNode(child);
      edges.push(createEdge(current, child, measuredById));
    }
  };
  // `walkTree` returns the root first; `initGraph` starts there (`:187`).
  manageOneNode(flatNodes[0]!);
  return edges;
}

/**
 * Place measured nodes at the jar's origin (`json-node-position.ts`, the port
 * of `SmetanaForJson#getPosition`), offset by the document margin. The size
 * drawn is the measured block's — upstream draws `node.block` at that
 * translation (`SmetanaForJson.java:166-168`), never the engine box.
 */
function placeJsonNodes(
  measured: MeasuredNode[],
  positions: ReadonlyMap<string, JsonNodePosition>,
  margin: { left: number; top: number },
): JsonNodeGeo[] {
  const nodes: JsonNodeGeo[] = [];
  for (const m of measured) {
    const dn = positions.get(m.flatNode.id);
    if (dn === undefined) continue;
    nodes.push({
      id: m.flatNode.id,
      x: dn.x + margin.left,
      y: dn.y + margin.top,
      width: m.totalWidth,
      height: m.totalHeight,
      keyColWidth: m.keyColWidth,
      valueColWidth: m.valueColWidth,
      rows: m.rows,
    });
  }
  return nodes;
}

/** `Mirror#invAndXYSwitch` (`Mirror.java:55-59`), then the document margin. */
function mirrorPoint(
  xMirror: Mirror,
  x: number,
  y: number,
  margin: { left: number; top: number },
): { x: number; y: number } {
  const p = xMirror.invAndXYSwitch(new XPoint2D(x, y));
  return { x: p.getX() + margin.left, y: p.getY() + margin.top };
}

/**
 * The engine's own splines, read off its raw y-up frame through the SAME
 * `Mirror` as the nodes, offset by the document margin. A5/T8: the edges are
 * the ENGINE's splines, not points re-derived from node geometry. Upstream:
 *
 *     final JsonCurve curve = getCurve(edge, 13);          // SmetanaForJson.java:173
 *     return new JsonCurve(data, xMirror, veryFirstLine);  // :212-215
 *     path.lineTo(xMirror.invAndXYSwitch(points.get(0)));  // JsonCurve.java:96-103
 *     final XPoint2D trueEp = xMirror.invAndXYSwitch(ep);  // :106-109
 *
 * `ep` takes the identical mirror as the points. Absent when the engine placed
 * no arrow, which `JsonCurve.ts` handles the way upstream does (draw nothing).
 * `Mirror#inv` reports but never clamps a point beyond `max` (`Mirror.java:48-53`).
 */
function buildJsonEdgeGeometries(
  engineEdges: NonNullable<DotLayoutResult['engineEdges']>,
  xMirror: Mirror,
  margin: { left: number; top: number },
): JsonEdgeGeo[] {
  return engineEdges.map((e) => ({
    points: e.points.map((p) => mirrorPoint(xMirror, p.x, p.y, margin)),
    ...(e.epX !== undefined && e.epY !== undefined ? { ep: mirrorPoint(xMirror, e.epX, e.epY, margin) } : {}),
    spline: true,
  }));
}

/** The raw engine frame `read: 'exact'` guarantees for a non-empty graph (D1). */
function engineFrameOf(r: DotLayoutResult): Required<Pick<DotLayoutResult, 'engineNodes' | 'engineEdges'>> {
  if (r.engineNodes === undefined || r.engineEdges === undefined) {
    throw new Error("layoutJson: layoutGraph(read: 'exact') returned no engineNodes/engineEdges");
  }
  return { engineNodes: r.engineNodes, engineEdges: r.engineEdges };
}

export function layoutJson(ast: JsonDiagramAST, theme: Theme, measurer: StringMeasurer): JsonGeometry {
  // Handle parse failure: return an error geometry that the renderer will
  // display as PlantUML's canonical "Your data does not sound like JSON data".
  const margin = marginsOf(theme);
  if (ast.parseError) return layoutParseFailure(ast, measurer, margin);

  const flatNodes: FlatNode[] = walkTree(normalizeRoot(ast.root));

  // Build per-node highlight map: nodeId → Map<key, styleClass>.
  // Each #highlight path navigates from the root node through child nodes
  // following all but the last segment, then marks the last segment as
  // highlighted in that destination node.
  const highlightMap = buildHighlightMap(flatNodes, ast.highlights);

  // The styles every cell is measured with, and which the renderer paints with
  // (`JsonGeometry.styles`): resolved once per diagram.
  const styles = resolveJsonStyles(ast.skinParam);
  const measureOptions = measureOptionsOf(theme);

  // Measure each node
  const measured = flatNodes.map((fn) =>
    measureNode(fn, highlightMap.get(fn.id) ?? EMPTY_MAP, measurer, styles, measureOptions),
  );

  // Build dot input graph (nodes + edges) -- see buildJsonDotNodes/
  // buildJsonDotEdges doc comments for the ADR-1 transposition rationale.
  //
  // A5/T6 (ADR-1): no `rankDir` and no separations, matching upstream. Its
  // `agopen` never sets `rankdir`, `nodesep` or `ranksep`, so graphviz's own
  // defaults (36pt / 18pt) apply -- this port previously forced `LR` with
  // hand-picked 40/20. Measured over all 92 fixtures, the mirrored graph is
  // closer to the jar on document dimensions for 68 fixtures and worse for 2
  // (`plans/a5-json-family-conformance/adr1-gonogo.md`).
  const dotInput: DotInputGraph = {
    nodes: buildJsonDotNodes(measured),
    edges: buildJsonDotEdges(flatNodes, measured),
    omitSepAttrs: true,
  };

  const { engineNodes, engineEdges } = engineFrameOf(dotLayout(dotInput, { read: 'exact' }));

  // `drawMe`'s `max` + `getPosition` over the raw engine frame
  // (`SmetanaForJson.java:160-168,203-209`). Title no longer reserves layout
  // space here (mission G0b/T8) -- it is drawn by the shared applyChrome step.
  const { positions, xMirror } = jsonNodePositions(engineNodes);
  const nodes = placeJsonNodes(measured, positions, margin);

  const edges = buildJsonEdgeGeometries(engineEdges, xMirror, margin);

  const { width, height, finalWidth, finalHeight } = documentDimensions(nodes, edges, margin);
  const result: JsonGeometry = {
    styles,
    nodes,
    edges,
    width,
    height,
    finalDimension: { width: finalWidth, height: finalHeight },
    // Type-carrying only: resolved to a factor at RENDER time against these
    // (unscaled) dims, mirroring `TextBlockExporter#computeScaleFactor(dim)`
    // reading `calculateFinalDimension()`'s own pre-scale result.
    ...(ast.scale === undefined ? {} : { scale: ast.scale }),
  };
  return result;
}
