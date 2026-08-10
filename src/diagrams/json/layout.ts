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
import type { DotInputEdge, DotInputGraph } from '../../core/graph-layout.js';
import { measureNode, recordLabelFor } from './TextBlockJson.js';
import type { JsonRowGeo } from './TextBlockJson.js';

// A5/T6b: node sizing moved to `TextBlockJson.ts` (upstream's own class
// boundary). Re-exported so `renderer.ts` and every existing consumer keep
// importing `JsonRowGeo` from here.
export type { JsonRowGeo } from './TextBlockJson.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Margin added around the entire canvas so nodes don't touch the SVG edge. */
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
  spline: boolean;
}

export interface JsonGeometry {
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
  if (typeof root !== 'object' || root === null) return [root] as JsonContainer;
  const isEmpty = Array.isArray(root) ? root.length === 0 : Object.keys(root).length === 0;
  return (isEmpty ? [''] : root) as JsonContainer;
}

/**
 * Transpose the solved layout back into diagram space (mission A5 / T6).
 *
 * The graph was handed to the engine with every node's width and height
 * swapped and no `rankdir`, so it was solved top-to-bottom in a transposed
 * frame — upstream's `SmetanaForJson#createNode` does exactly this
 * (`SmetanaForJson.java:236-244`). Reading it back means undoing that.
 *
 * **Only the x/y SWITCH is applied here, not upstream's flip — and that is a
 * deliberate consequence of our seam, not a shortcut.** Upstream's
 * `getPosition` computes `sym(x - width/2, xMirror.inv(y + height/2))`, where
 * `Mirror#inv` turns graphviz's **y-up** coordinates into screen y-down ones.
 * This port asks the engine for `getLayout({ yAxis: 'down' })`
 * (`graph-layout.ts`), so that flip has ALREADY happened by the time these
 * coordinates arrive. Applying `inv` again mirrors the diagram horizontally:
 * measured against the jar on `bavize-88-jumu158`, it put the root node at
 * x=76.83 with its child at x=10, where the jar has the root at x=10 and the
 * child at x=132 — a fully reversed layout that the document-dimension metric
 * cannot see, because a mirrored diagram has identical dimensions.
 *
 * `Mirror.ts` is still the faithful port of `Mirror.java` and still what an
 * upstream-frame consumer should use; it is simply not needed on this path.
 *
 * So: a node's mirrored left edge is its transposed-frame TOP (`p.y` — its
 * distance down from the graph's top, which is exactly what upstream's
 * `max - topEdge` computes in the y-up frame), and its mirrored top is its
 * transposed-frame left edge (`p.x`).
 *
 * Edges are NOT touched here: `layoutJson` derives its edge points from final
 * node geometry rather than from the engine's splines, so they follow the
 * nodes automatically. Porting `JsonCurve` to consume the engine's own
 * splines is T8.
 */
function mirrorToDiagramSpace(
  placed: ReadonlyArray<{ id: string; x: number; y: number }>,
): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>();
  for (const p of placed) out.set(p.id, { x: p.y, y: p.x });
  return out;
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

export function layoutJson(
  ast: JsonDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): JsonGeometry {
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

  // Read jsonDiagram.node theme overrides for layout purposes
  const jsonTheme = theme.colors.graph.json;
  const nodeFontSize = jsonTheme?.nodeFontSize ?? theme.fontSize;
  const nodeFontFamily = jsonTheme?.nodeFontFamily ?? theme.fontFamily;
  const nodeFontBold = jsonTheme?.nodeFontBold ?? false;
  const maximumWidth = jsonTheme?.maximumWidth;
  // Default true: matches plantuml.skin jsonDiagram.node.header { FontStyle bold }
  const headerFontBold = jsonTheme?.headerFontBold !== false;

  const measureOptions: BuildRowsOptions = {
    fontFamily: nodeFontFamily,
    ...(nodeFontBold ? { fontBold: true } : {}),
    ...(headerFontBold ? { headerFontBold: true } : {}),
    ...(maximumWidth !== undefined ? { maximumWidth } : {}),
    // `skinparam tabSize` -- reaches the cell fonts, where `tab-stops.ts`
    // uses it exactly as `AtomText#tabString` does.
    ...(theme.tabSize !== undefined ? { tabSize: theme.tabSize } : {}),
  };

  // Measure each node
  const measured = flatNodes.map((fn) =>
    measureNode(
      fn,
      highlightMap.get(fn.id) ?? EMPTY_MAP,
      measurer,
      nodeFontSize,
      measureOptions,
    ),
  );

  // Build dot input graph. A5/T6 (ADR-1): dimensions are SWAPPED on the way in
  // -- upstream hands graphviz each node's height as its width and vice versa
  // (`SmetanaForJson.java:236-244`) so the graph solves top-to-bottom in a
  // transposed frame, then transposes the answer back. See
  // `mirrorToDiagramSpace`.
  // A5/T7: real `shape=record` nodes with a `<Pn>` port per row, so each edge
  // leaves the ROW it belongs to. `recordLabelFor` builds the label upstream
  // builds (`SmetanaForJson#getDotLabelArray`/`#getDotLabelMap`).
  //
  // This spaces same-rank siblings further apart than the jar does -- graphviz
  // PADs every record field (`XPAD` = 4*GAP = 16, `macros.h:27-29`) and
  // upstream's `colAwidth - 8` offsets only the `YPAD` half, so a node grows by
  // 16 per row. **That is real graphviz's behaviour, not a defect here**:
  // verified against the installed `dot` 15.1.1 on an equivalent 3-port record,
  // which returns w=0.92708 h=0.69444 -- byte-identical to what this seam
  // produces. The jar shows no such inflation because Smetana does not
  // reproduce it, and per CLAUDE.md ("Smetana is NOT a porting target") that
  // delta is accepted and named rather than chased. See DIVERGENCES.md.
  const dotNodes = measured.map((m) => ({
    id: m.flatNode.id,
    width: m.totalHeight,
    height: m.totalWidth,
    shape: 'record' as const,
    recordLabel: recordLabelFor(m),
  }));

  const measuredById = new Map(measured.map((m) => [m.flatNode.id, m]));

  const dotEdges: DotInputEdge[] = flatNodes
    .filter((fn) => fn.parentId !== null)
    .map((fn) => {
      // `tailport="P<rowIndex>"` -- `SmetanaForJson#createEdge` (:224) names the
      // port by the child's index among the parent's rows.
      const parentM = measuredById.get(fn.parentId!);
      const rowIndex = parentM?.rows.findIndex((r) => r.key === (fn.parentKey ?? '')) ?? -1;
      const edge: DotInputEdge = {
        id: `${fn.parentId!}->${fn.id}`,
        from: fn.parentId!,
        to: fn.id,
      };
      if (rowIndex >= 0) edge.attributes = { tailport: `P${rowIndex}` };
      return edge;
    });

  // A5/T6 (ADR-1): no `rankDir` and no separations, matching upstream. Its
  // `agopen` never sets `rankdir`, `nodesep` or `ranksep`, so graphviz's own
  // defaults (36pt / 18pt) apply -- this port previously forced `LR` with
  // hand-picked 40/20. Measured over all 92 fixtures, the mirrored graph is
  // closer to the jar on document dimensions for 68 fixtures and worse for 2
  // (`plans/a5-json-family-conformance/adr1-gonogo.md`).
  const dotInput: DotInputGraph = {
    nodes: dotNodes,
    edges: dotEdges,
    omitSepAttrs: true,
  };

  const dotResult = dotLayout(dotInput);

  // Transpose the solved layout back into diagram space before anything reads
  // a coordinate off it.
  const mirrored = mirrorToDiagramSpace(dotResult.nodes);

  const nodes: JsonNodeGeo[] = [];
  for (const m of measured) {
    const dn = mirrored.get(m.flatNode.id);
    if (dn === undefined) continue;
    nodes.push({
      id: m.flatNode.id,
      x: dn.x,
      y: dn.y,
      width: m.totalWidth,
      height: m.totalHeight,
      keyColWidth: m.keyColWidth,
      valueColWidth: m.valueColWidth,
      rows: m.rows,
    });
  }

  // Apply CANVAS_PAD to node positions first so that edge anchor points
  // computed below are in final canvas coordinates. Title no longer
  // reserves layout space here (mission G0b/T8) -- it flows through
  // ast.annotations.title and is drawn by the shared applyChrome step in
  // src/index.ts, entirely outside this layout stage.
  for (const n of nodes) {
    n.x += margin.left;
    n.y += margin.top;
  }

  // Compute per-rank right boundary: the rightmost edge of any node at that rank.
  // Edges from narrow nodes would otherwise travel through the right portion of
  // wider siblings at the same rank. Routing via the rank boundary keeps all
  // edge paths in the clear gap between ranks.
  const rankMaxRight = new Map<number, number>();
  for (const n of nodes) {
    const cur = rankMaxRight.get(n.x) ?? 0;
    rankMaxRight.set(n.x, Math.max(cur, n.x + n.width));
  }

  // A5/T8: the edges are the ENGINE's own splines, transposed into diagram
  // space, not points re-derived from node geometry. Upstream does the same --
  // `SmetanaForJson#drawMe` hands each `ST_Agedge_s` to `JsonCurve`, which
  // reads `data.spl` (`JsonCurve.java:58-71`).
  //
  // This became worth doing at T7: with real `<Pn>` record ports the engine
  // routes each edge out of the row it belongs to, so its spline carries
  // information the old re-derivation could only approximate (a horizontal
  // stub plus a hand-built S-curve).
  //
  // Same transposition as the nodes, and for the same reason -- `yAxis: 'down'`
  // has already applied `Mirror#inv`, so only the x/y switch remains. See
  // `mirrorToDiagramSpace`.
  const edges: JsonEdgeGeo[] = dotResult.edges.map((e) => ({
    points: e.points.map((p) => ({ x: p.y + margin.left, y: p.x + margin.top })),
    spline: true,
  }));

  const { width, height, finalWidth, finalHeight } = documentDimensions(nodes, margin);
  const result: JsonGeometry = {
    nodes, edges, width, height,
    finalDimension: { width: finalWidth, height: finalHeight },
    // Type-carrying only: resolved to a factor at RENDER time against these
    // (unscaled) dims, mirroring `TextBlockExporter#computeScaleFactor(dim)`
    // reading `calculateFinalDimension()`'s own pre-scale result.
    ...(ast.scale === undefined ? {} : { scale: ast.scale }),
  };
  return result;
}

/**
 * `LimitFinder#drawRectangle` records a rectangle's ink as
 * `addPoint(x - 1, y - 1)` … `addPoint(x + w - 1, y + h - 1)`
 * (`LimitFinder.java:184-188`). The leftmost/topmost node sits at the graph
 * origin, so the ink box's MIN corner is `(-1, -1)` — and `MinMax#getDimension`
 * is `maxX - minX` (`MinMax.java:151-153`), so that corner adds exactly 1 to
 * each axis. Oracle-verified on five fixtures spanning 46px to 1356px wide:
 * the instrumented jar reports `getMinMax = (-1.0,-1.0)->(…)` every time.
 */
const INK_MIN_CORNER = -1;

/**
 * `SvgGraphics#ensureVisible` stores `maxX = (int)(x + 1)`
 * (`SvgGraphics.java:129-134`), and `maxX`/`maxY` ARE the emitted
 * `width`/`height`/`viewBox` (`:799-811`). The truncation is applied by
 * `klimt/document-shell.ts#assembleDocumentShell`, which already `Math.trunc`s
 * these values; only the `+1` belongs here.
 */
const ENSURE_VISIBLE_BUMP = 1;

/**
 * The document's own width/height.
 *
 * The jar does NOT size a json document from its drawn extent — it ink-walks
 * the diagram, adds the margins, and truncates. Reproduced here in that order,
 * because a flat "+2 versus the node extent" is what this looks like from the
 * outside and it encodes nothing:
 *
 *   `JsonDiagram#calculateDimension` (`JsonDiagram.java:130-137`)
 *     → `TextBlockUtils.getMinMax(this, sb, true)` → {@link INK_MIN_CORNER}
 *   `TextBlockExporter#calculateFinalDimension` (`:199-203`)
 *     → `+ margin.left + margin.right`, `TitledDiagram#getDefaultMargins()`
 *       = `same(10)` (`TitledDiagram.java:275-277`)
 *   `SvgGraphics#ensureVisible` → {@link ENSURE_VISIBLE_BUMP}
 *
 * Node `x`/`y` already carry the left/top {@link CANVAS_PAD}, so the raw ink
 * extent is recovered by subtracting it back off before the margins are added
 * — the same quantity the jar's ink walk measures.
 *
 * Only the node extents are folded in, matching the previous behaviour: on
 * every measured fixture the rightmost/bottommost ink IS a node edge, because
 * json edges run BETWEEN nodes. An edge or spot that overhung the outermost
 * node would need adding here, and none does today.
 */
function documentDimensions(
  nodes: readonly JsonNodeGeo[],
  margin: { left: number; top: number; x: number; y: number },
): { width: number; height: number; finalWidth: number; finalHeight: number } {
  let inkMaxX = 0;
  let inkMaxY = 0;
  for (const n of nodes) {
    const r = n.x + n.width - margin.left;
    const b = n.y + n.height - margin.top;
    if (r > inkMaxX) inkMaxX = r;
    if (b > inkMaxY) inkMaxY = b;
  }
  // `TextBlockExporter#calculateFinalDimension` -- the ink extent plus both
  // margins, and NOTHING else. This is the dimension `computeScaleFactor(dim)`
  // divides by (`TextBlockExporter.java:165,199-202`).
  const finalWidth = inkMaxX - INK_MIN_CORNER + margin.x;
  const finalHeight = inkMaxY - INK_MIN_CORNER + margin.y;
  return {
    // The emitted width/height/viewBox are `maxX`/`maxY`, which SvgGraphics
    // seeds with `ensureVisible(minDim)` -- i.e. the SAME final dimension, run
    // through `(int)(x + 1)`. Two distinct notions upstream, and conflating
    // them made `scale max W*H` divide by a number one larger than the jar's.
    width: finalWidth + ENSURE_VISIBLE_BUMP,
    height: finalHeight + ENSURE_VISIBLE_BUMP,
    finalWidth,
    finalHeight,
  };
}
