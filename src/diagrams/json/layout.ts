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
import { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';
import { Mirror } from './Mirror.js';
import { measureNode } from './TextBlockJson.js';
import type { MeasuredNode, JsonRowGeo } from './TextBlockJson.js';

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
  /** When the JSON body could not be parsed, contains the error message to display. */
  error?: string;
}

// ---------------------------------------------------------------------------
// Value display helpers
// ---------------------------------------------------------------------------


import { walkTree, EMPTY_MAP, buildHighlightMap } from './json-layout-prep.js';
import type { JsonContainer, FlatNode, BuildRowsOptions } from './json-layout-prep.js';

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
 * (`SmetanaForJson.java:236-244`). Reading it back means applying
 * `Mirror#invAndXYSwitch` (`x = max - y`, `y = x`).
 *
 * Node TOP-LEFTs, not points, so the flip has to account for the node's own
 * extent along the flipped axis. In the transposed frame a node spans
 * `gy … gy + trueWidth` vertically, so its mirrored left edge is
 * `max - gy - trueWidth`, and its mirrored top is simply `gx`.
 *
 * `max` is the transposed frame's own height — the largest `gy + trueWidth`
 * — so the leftmost node lands at x = 0 and nothing goes negative.
 *
 * Edges are NOT touched here: `layoutJson` derives its edge points from final
 * node geometry rather than from the engine's splines, so they follow the
 * nodes automatically. Porting `JsonCurve` to consume the engine's own
 * splines is T8.
 */
function mirrorToDiagramSpace(
  placed: ReadonlyArray<{ id: string; x: number; y: number }>,
  measured: ReadonlyArray<MeasuredNode>,
): Map<string, { x: number; y: number }> {
  const trueDims = new Map(
    measured.map((m) => [m.flatNode.id, { width: m.totalWidth, height: m.totalHeight }]),
  );
  let max = 0;
  for (const p of placed) {
    const d = trueDims.get(p.id);
    if (d === undefined) continue;
    max = Math.max(max, p.y + d.width);
  }
  const mirror = new Mirror(max);
  const out = new Map<string, { x: number; y: number }>();
  for (const p of placed) {
    const d = trueDims.get(p.id);
    if (d === undefined) continue;
    // invAndXYSwitch on the node's far corner along the flipped axis gives the
    // mirrored top-left in one step.
    const corner = mirror.invAndXYSwitch(new XPoint2D(p.x, p.y + d.width));
    out.set(p.id, { x: corner.getX(), y: corner.getY() });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Public layout function
// ---------------------------------------------------------------------------

export function layoutJson(
  ast: JsonDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): JsonGeometry {
  // Handle parse failure: return an error geometry that the renderer will
  // display as PlantUML's canonical "Your data does not sound like JSON data".
  if (ast.parseError) {
    return {
      nodes: [],
      edges: [],
      width: 0,
      height: 0,
      error: 'Your data does not sound like JSON data',
    };
  }

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
  const dotNodes = measured.map((m) => ({
    id: m.flatNode.id,
    width: m.totalHeight,
    height: m.totalWidth,
  }));

  // Build lookup for parent geometry to compute tailportY
  const measuredById = new Map(measured.map((m) => [m.flatNode.id, m]));

  const dotEdges: DotInputEdge[] = flatNodes
    .filter((fn) => fn.parentId !== null)
    .map((fn) => {
      const parentM = measuredById.get(fn.parentId!);
      let tailportY: number | undefined;
      if (parentM !== undefined && parentM.totalHeight > 0) {
        const row = parentM.rows.find((r) => r.key === (fn.parentKey ?? ''));
        if (row !== undefined) {
          const rowCenterFromTop = row.y + row.height / 2;
          tailportY = (rowCenterFromTop - parentM.totalHeight / 2) / parentM.totalHeight;
        }
      }
      const edge: DotInputEdge = {
        id: `${fn.parentId!}->${fn.id}`,
        from: fn.parentId!,
        to: fn.id,
      };
      if (tailportY !== undefined) edge.attributes = { tailportY };
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
  const mirrored = mirrorToDiagramSpace(dotResult.nodes, measured);

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
    n.x += CANVAS_PAD;
    n.y += CANVAS_PAD;
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

  // Build edges anchored to parent rows, not to node centers.
  // Java: createEdge sets tailport="P{rowIndex}" so graphviz routes from the
  // specific row's port on the right side of the parent node. We replicate this
  // by computing the start point directly from the parent row's geometry.
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edges: JsonEdgeGeo[] = [];
  for (const fn of flatNodes) {
    if (fn.parentId === null) continue;
    const parent = nodeById.get(fn.parentId);
    const child = nodeById.get(fn.id);
    if (parent === undefined || child === undefined) continue;

    // Find the row in the parent whose key matches this child's entry.
    const parentRow = parent.rows.find((r) => r.key === (fn.parentKey ?? ''));
    const startX = parent.x + parent.width;
    const startY =
      parentRow !== undefined
        ? parent.y + parentRow.y + parentRow.height / 2
        : parent.y + parent.height / 2;
    const endX = child.x;
    const endY = child.y + child.height / 2;

    // If a wider sibling exists at the same rank, add a horizontal waypoint at
    // the rank boundary so the edge travels through the inter-rank gap rather
    // than cutting through that sibling's bounding box.
    const rankRight = rankMaxRight.get(parent.x) ?? startX;
    const points: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    if (rankRight > startX) points.push({ x: rankRight, y: startY });
    points.push({ x: endX, y: endY });

    edges.push({ points, spline: false });
  }

  // Canvas size: rightmost/bottommost extent of all positioned nodes plus a
  // right/bottom margin equal to CANVAS_PAD. Nodes already include the left/top
  // CANVAS_PAD in their x/y, so we just need to ensure the right/bottom padding.
  let width = 0;
  let height = 0;
  for (const n of nodes) {
    const r = n.x + n.width + CANVAS_PAD;
    const b = n.y + n.height + CANVAS_PAD;
    if (r > width) width = r;
    if (b > height) height = b;
  }

  const result: JsonGeometry = { nodes, edges, width, height };
  return result;
}
