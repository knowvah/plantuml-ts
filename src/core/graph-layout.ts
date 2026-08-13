// The single graph-layout chokepoint.
//
// All graph diagram types (class, component, state, usecase, dot, json — plus
// the transitive object→class and yaml/hcl→json paths) route their layout
// through `layoutGraph()`, the only seam consumer. This adapter wires that seam
// to the `@knowvah/dot-engine` package: it serializes a DotInputGraph into a @knowvah/dot-engine
// builder graph, runs the requested engine, reads back the geometry snapshot,
// and maps it to the DotLayoutResult shape the renderers already consume (burn
// decision D4 — renderers untouched). See plans/burn-graphviz-engines/.

import {
  createGraph,
  render,
  getLayout,
} from '@knowvah/dot-engine';
import type { LayoutSnapshot } from '@knowvah/dot-engine';
import {
  applyGraphAttrs,
  addNodes,
  addClusters,
  addEdges,
  edgeKey,
  type EdgeIndex,
  type ClusterIndex,
} from './graph-layout-build.js';
import type {
  DotInputEdge,
  DotInputGraph,
  DotLayoutResult,
} from './graph-layout.types.js';

// Imported for its side effect: pins @knowvah/dot-engine's text measurer.
// A5/T7: this file used to install `new LutTextMeasurer()` itself. That was a
// LATENT BUG the moment a second install point existed -- `setTextMeasurer` sets
// a module-global, so whichever module loaded last won, and this one loading
// after `dot-engine-measurer.ts` silently replaced the `_dim_`-aware measurer
// records need with the plain lookup table. Measured symptom: json record nodes
// sized from the literal label text (231.5px wide against an expected 36).
// There is now exactly one install point.
import './dot-engine-measurer.js';

/** Right/bottom canvas padding, matching the in-house engine's old extractResult. */
const MARGIN = 12;

type OutNodes = DotLayoutResult['nodes'];
type OutEdges = DotLayoutResult['edges'];
type OutClusters = NonNullable<DotLayoutResult['clusters']>;


// Instrumentation seam for the oracle DOT-parity workstream. When set, every
// layoutGraph() call hands its input here before layout — letting the parity
// tests capture the exact graph plantuml-ts feeds graphviz, for one fixture, to
// compare against the oracle's svek-*.dot. Undefined (no-op) by default and in
// every production path. See oracle/README.md and tests/oracle/.
let layoutInputObserver: ((input: DotInputGraph) => void) | undefined;

export function setLayoutInputObserver(
  fn: ((input: DotInputGraph) => void) | undefined,
): void {
  layoutInputObserver = fn;
}

/** graphviz reports node centre coords; renderers expect the top-left corner. */
function mapNodes(snap: LayoutSnapshot): OutNodes {
  return snap.nodes.map((n) => ({
    id: n.name,
    x: n.x - n.width / 2,
    y: n.y - n.height / 2,
    width: n.width,
    height: n.height,
  }));
}

/**
 * Copies one snapshot label position onto the output entry. The three
 * positions differ only in field name: the CENTRE label (`ED_label`), and the
 * `taillabel`/`headlabel` placements graphviz computes in `gvPostprocess` ->
 * `addXLabels`.
 *
 * All three are read straight off `getLayout()` as of dot-engine 1.3.0. Before
 * that, only the centre one was published, and this seam recovered the other
 * two by regex-scanning `render()`'s SVG and deriving a translation between
 * two coordinate frames -- roughly 190 lines whose only job was to work around
 * the missing fields. See `docs/graphviz-issues/13-edge-tail-head-label-
 * positions-not-in-getlayout.md` for what that cost and how it was retired.
 */
function assignLabelPos(
  entry: OutEdges[number],
  pos: { x: number; y: number } | undefined,
  xKey: 'labelX' | 'tailLabelX' | 'headLabelX',
  yKey: 'labelY' | 'tailLabelY' | 'headLabelY',
): void {
  if (pos === undefined) return;
  entry[xKey] = pos.x;
  entry[yKey] = pos.y;
}

function toEdgeEntry(
  ge: LayoutSnapshot['edges'][number],
  id: string,
  inp: DotInputEdge | undefined,
): OutEdges[number] {
  const entry: OutEdges[number] = {
    id,
    points: ge.points.map((p) => ({ x: p.x, y: p.y })),
  };
  assignLabelPos(entry, ge.label, 'labelX', 'labelY');
  assignLabelPos(entry, ge.tailLabel, 'tailLabelX', 'tailLabelY');
  assignLabelPos(entry, ge.headLabel, 'headLabelX', 'headLabelY');
  // @knowvah/dot-engine returns only the label position; echo back the caller's
  // measured label box so renderers size the label as before.
  if (inp?.attributes?.labelWidth !== undefined) {
    entry.labelWidth = inp.attributes.labelWidth;
  }
  if (inp?.attributes?.labelHeight !== undefined) {
    entry.labelHeight = inp.attributes.labelHeight;
  }
  if (ge.points.length > 2) entry.spline = true;
  return entry;
}

function mapEdges(snap: LayoutSnapshot, idx: EdgeIndex): OutEdges {
  const edges: OutEdges = [];
  for (const ge of snap.edges) {
    const q = idx.idQueues.get(edgeKey(ge.tail, ge.head));
    const id = q !== undefined && q.length > 0 ? q.shift() : undefined;
    if (id === undefined) continue;
    edges.push(toEdgeEntry(ge, id, idx.inputEdgeById.get(id)));
  }
  return edges;
}

/** G5 C2: re-keys `getLayout()`'s `clusters` snapshot entries from
 *  @knowvah/dot-engine's own `cluster<N>` naming back to the caller's
 *  `DotInputCluster.id`, via the `ClusterIndex` `addClusters` built while
 *  constructing the builder graph. `undefined` when the input graph carried
 *  no clusters (empty `idByName` — mirrors `DotInputGraph.clusters` being
 *  optional). A snapshot entry with no matching id is defensively skipped
 *  (cannot occur given `addClusters`'s own naming contract: every name it
 *  hands @knowvah/dot-engine is recorded in `idByName` before use). */
function mapClusters(snap: LayoutSnapshot, idx: ClusterIndex): OutClusters | undefined {
  if (idx.idByName.size === 0) return undefined;
  const out: OutClusters = [];
  for (const c of snap.clusters) {
    const id = idx.idByName.get(c.name);
    if (id === undefined) continue;
    out.push({ id, x: c.x, y: c.y, width: c.width, height: c.height });
  }
  return out.length > 0 ? out : undefined;
}

/** Shift content so the leftmost/topmost rendered point sits at (0,0).
 *  G5 C2: `clusters` (optional) rides the SAME translation derived from
 *  nodes/edges alone — clusters never participate in DERIVING minX/minY, only
 *  in receiving the shift, so this is byte-identical for every pre-existing
 *  caller that doesn't read `DotLayoutResult.clusters`. */
function shiftToOrigin(nodes: OutNodes, edges: OutEdges, clusters?: OutClusters): void {
  let minX = Math.min(...nodes.map((n) => n.x));
  let minY = Math.min(...nodes.map((n) => n.y));
  for (const e of edges) {
    for (const p of e.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
    }
  }
  if (minX === 0 && minY === 0) return;
  for (const n of nodes) {
    n.x -= minX;
    n.y -= minY;
  }
  for (const e of edges) {
    for (const p of e.points) {
      p.x -= minX;
      p.y -= minY;
    }
    if (e.labelX !== undefined) e.labelX -= minX;
    if (e.labelY !== undefined) e.labelY -= minY;
    if (e.tailLabelX !== undefined) e.tailLabelX -= minX;
    if (e.tailLabelY !== undefined) e.tailLabelY -= minY;
    if (e.headLabelX !== undefined) e.headLabelX -= minX;
    if (e.headLabelY !== undefined) e.headLabelY -= minY;
  }
  if (clusters !== undefined) {
    for (const c of clusters) {
      c.x -= minX;
      c.y -= minY;
    }
  }
}

function canvasSize(nodes: OutNodes, edges: OutEdges): { width: number; height: number } {
  let width = 0;
  let height = 0;
  for (const n of nodes) {
    width = Math.max(width, n.x + n.width + MARGIN);
    height = Math.max(height, n.y + n.height + MARGIN);
  }
  for (const e of edges) {
    if (e.labelX !== undefined && e.labelWidth !== undefined) {
      width = Math.max(width, e.labelX + e.labelWidth / 2 + MARGIN);
    }
    for (const p of e.points) {
      width = Math.max(width, p.x + MARGIN);
      height = Math.max(height, p.y + MARGIN);
    }
  }
  return { width, height };
}

/**
 * Lay out a graph via @knowvah/dot-engine. The single seam between the graph diagram
 * types and the layout engine.
 *
 * @param input - the graph to lay out (node/edge geometry + rank hints).
 * @param opts  - layout options; `engine` selects a graphviz layout engine
 *                (dot/neato/fdp/sfdp/twopi/circo/osage). Defaults to `dot` —
 *                every current consumer is a hierarchical layout. The old
 *                BFS-depth engine-selection heuristic was intentionally dropped
 *                (burn decision D2).
 */
export function layoutGraph(
  input: DotInputGraph,
  opts?: { engine?: string },
): DotLayoutResult {
  layoutInputObserver?.(input);
  if (input.nodes.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }
  const engine = opts?.engine ?? 'dot';

  const b = createGraph({ directed: true });
  applyGraphAttrs(b, input);
  addNodes(b, input);
  const clusterIdx = addClusters(b, input);
  const idx = addEdges(b, input);

  // `render` triggers layout and its return value is discarded: `getLayout`
  // alone returns zeroed coords, but every geometry this seam needs now comes
  // from the snapshot. Until dot-engine 1.3.0 the SVG string was also scraped
  // here for tail/head label positions, the one thing the snapshot could not
  // report (G2/N25); `EdgeGeometry.tailLabel`/`.headLabel` publish them
  // directly now, so that whole read-the-output-as-text path is gone --
  // filed as docs/graphviz-issues/13, landed in 1.3.0.
  render(b.graph, 'svg', { engine });
  const snap = getLayout(b.graph, { yAxis: 'down' });

  const nodes = mapNodes(snap);
  const edges = mapEdges(snap, idx);
  const clusters = mapClusters(snap, clusterIdx);
  shiftToOrigin(nodes, edges, clusters);
  const { width, height } = canvasSize(nodes, edges);

  return { nodes, edges, width, height, ...(clusters !== undefined ? { clusters } : {}) };
}

export type {
  DotInputNode,
  DotInputNodeShape,
  DotInputEdge,
  DotInputCluster,
  DotInputGraph,
  DotLayoutResult,
} from './graph-layout.types.js';
