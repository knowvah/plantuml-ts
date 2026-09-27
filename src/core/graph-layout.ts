// The single graph-layout chokepoint.
//
// All graph diagram types (class, component, state, usecase, dot, json — plus
// the transitive object→class and yaml/hcl→json paths) route their layout
// through `layoutGraph()`, the only seam consumer. This adapter wires that seam
// to the `@knowvah/dot-engine` package: it serializes a DotInputGraph into a @knowvah/dot-engine
// builder graph, runs the requested engine, reads back the geometry snapshot,
// and maps it to the DotLayoutResult shape the renderers already consume (burn
// decision D4 — renderers untouched). See plans/burn-graphviz-engines/.

import { createGraph, render, getLayout } from '@knowvah/dot-engine';
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
// T6 (edge-label-box-backlog): the ONE owner of the cardinality-font
// constant, re-exported at this chokepoint so `class-layout-edge-labels.ts`
// can import it from core instead of holding its own duplicate literal —
// see that module's own `CARDINALITY_FONT_SIZE` doc comment for why core
// itself cannot import the class-local copy (`core/` -> `diagrams/class/`
// is the wrong layering direction; the reverse, done here, is not).
export { CARDINALITY_FONT_SIZE } from './graph-layout-build.js';
import type { DotInputEdge, DotInputGraph, DotLayoutResult } from './graph-layout.types.js';

// Imported for its side effect: pins @knowvah/dot-engine's text measurer.
// A5/T7: this file used to install `new LutTextMeasurer()` itself. That was a
// LATENT BUG the moment a second install point existed -- `setTextMeasurer` sets
// a module-global, so whichever module loaded last won, and this one loading
// after `dot-engine-measurer.ts` silently replaced the `_dim_`-aware measurer
// records need with the plain lookup table. Measured symptom: json record nodes
// sized from the literal label text (231.5px wide against an expected 36).
// There is now exactly one install point.
import './dot-engine-measurer.js';
import { withSameContainerConstraints } from './graph-layout-build-constraint.js';
import { edgeLabelTables, svekCluster, svekEdge, svekFrame, type SvekFrame } from './graph-layout-svek-read.js';
import { cornerSize, portNodeSize, shieldCorner, svekCornerOf } from './graph-layout-node-corner.js';

/** Right/bottom canvas padding, matching the in-house engine's old extractResult. */
const CANVAS_MARGIN = 12;

type OutNodes = DotLayoutResult['nodes'];
type OutEdges = DotLayoutResult['edges'];
type OutClusters = NonNullable<DotLayoutResult['clusters']>;

// Instrumentation seam for the oracle DOT-parity workstream. When set, every
// layoutGraph() call hands its input here before layout — letting the parity
// tests capture the exact graph plantuml-ts feeds graphviz, for one fixture, to
// compare against the oracle's svek-*.dot. Undefined (no-op) by default and in
// every production path. See oracle/README.md and tests/oracle/.
// Code review: layoutInputObserver is a shared module-level global set via setLayoutInputObserver; concurrent render() calls from the same process that both install an observer will race. Revisit if oracle/parity tests are ever parallelized within a single worker.
let layoutInputObserver: ((input: DotInputGraph) => void) | undefined;

export function setLayoutInputObserver(fn: ((input: DotInputGraph) => void) | undefined): void {
  layoutInputObserver = fn;
}

/** graphviz reports node centre coords; renderers expect the top-left corner.
 *
 *  Dimensions come from `input`, NOT from the snapshot. The snapshot echoes
 *  our own numbers back through the 6-decimal inches STRING the engine was
 *  given (`graph-layout-build.ts#addNodes`), so a 49.938px node returns as
 *  49.937968 and renderers would DRAW that. The engine decides POSITION; it
 *  never decides a node's size THAT WAY, so echoing the size we asked for is
 *  the accurate value, not an approximation of one.
 *
 *  But it does sometimes decide a size outright: a `shape=plaintext` node
 *  carrying an HTML label is declared with no `width`/`height` at all
 *  (`graph-layout-build.ts#addRowPortNode`), and graphviz pads the label to
 *  produce the node — 49x18 of label becomes a 65x36 node. Echoing our
 *  declared value there would discard a real layout decision. `ROUND_TRIP_
 *  EPSILON` tells the two cases apart without re-deriving `addNodes`'
 *  per-shape branches: a returned size within it IS our own number coming
 *  back, and anything further out is the engine's own. */
const ROUND_TRIP_EPSILON = 1e-3;

function mapNodes(snap: LayoutSnapshot, input: DotInputGraph, frame: SvekFrame | undefined): OutNodes {
  const declared = new Map(input.nodes.map((n) => [n.id, n]));
  return snap.nodes.map((n) => {
    const d = declared.get(n.name);
    const echo = (ours: number | undefined, engine: number): number =>
      ours !== undefined && Math.abs(ours - engine) < ROUND_TRIP_EPSILON ? ours : engine;
    const width = portNodeSize(d, echo(d?.width, n.width), d?.width ?? n.width);
    const height = portNodeSize(d, echo(d?.height, n.height), d?.height ?? n.height);
    const [cornerW, cornerH] = cornerSize(d, width, height);
    if (frame !== undefined) {
      const [x, y] = svekCornerOf(frame, n, d, width, height);
      return { id: n.name, x, y, width, height };
    }
    const [shieldDx, shieldDy] = shieldCorner(d, width, height);
    if (d?.shieldMargins !== undefined) {
      return { id: n.name, x: n.x + shieldDx, y: n.y + shieldDy, width, height };
    }
    return { id: n.name, x: n.x - cornerW / 2, y: n.y - cornerH / 2, width, height };
  });
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

function toEdgeEntry(ge: LayoutSnapshot['edges'][number], id: string, inp: DotInputEdge | undefined): OutEdges[number] {
  const entry: OutEdges[number] = {
    id,
    points: ge.points.map((p) => ({ x: p.x, y: p.y })),
  };
  // Not routed through `assignLabelPos`: `ep` is an arrow attachment point,
  // not a label position, and that helper's contract is labels. Same
  // presence rule though — the engine omits `ep` unless the head end carries
  // an arrow (C `eflag`), which needs `attributes.arrowhead` on the input.
  if (ge.ep !== undefined) {
    entry.epX = ge.ep.x;
    entry.epY = ge.ep.y;
  }
  assignLabelPos(entry, ge.label, 'labelX', 'labelY');
  // G20b (docs/graphviz-issues/16, SI31 T1): `xlabel` maps onto the SAME
  // `labelX`/`labelY` fields as `label`, not a new field -- for an
  // ortho/polyline-routed edge the xlabel IS the transition's label
  // (`moveLabelToXlabel` deletes `label` when it sets `xlabel`), so the two
  // are mutually exclusive per edge and `assignLabelPos`'s early return on
  // `undefined` makes the order here safe either way.
  assignLabelPos(entry, ge.xlabel, 'labelX', 'labelY');
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

function mapEdges(snap: LayoutSnapshot, idx: EdgeIndex, frame: SvekFrame | undefined): OutEdges {
  const edges: OutEdges = [];
  for (const ge of snap.edges) {
    const q = idx.idQueues.get(edgeKey(ge.tail, ge.head));
    const id = q !== undefined && q.length > 0 ? q.shift() : undefined;
    if (id === undefined) continue;
    const inp = idx.inputEdgeById.get(id);
    edges.push(toEdgeEntry(frame === undefined ? ge : svekEdge(frame, ge, edgeLabelTables(inp)), id, inp));
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
 *  hands @knowvah/dot-engine is recorded in `idByName` before use).
 *
 *  T7: `c.label` (present only when the input cluster declared a title, per
 *  `ClusterGeometry.label`'s own doc comment — existence-gated, not
 *  `set`-gated) is copied VERBATIM here, still in the label-space CENTRE
 *  convention `getLayout()` returns it in. Converting centre -> corner or
 *  baseline is deliberately NOT this seam's job — `graph-layout-result
 *  .types.ts`'s own doc comment on `clusters[].label` says so explicitly.
 *  No consumer reads this yet: `class-geo-builders.ts#namespaceGeoFromBox`
 *  (the field's original motivating consumer) investigated it and its own
 *  doc comment records why it deliberately does not — the value published
 *  here is unaffected either way, this seam only republishes what
 *  `getLayout()` reports. */
function mapClusters(snap: LayoutSnapshot, idx: ClusterIndex): OutClusters | undefined {
  if (idx.idByName.size === 0) return undefined;
  const out: OutClusters = [];
  for (const c of snap.clusters) {
    const id = idx.idByName.get(c.name);
    if (id === undefined) continue;
    out.push({
      id,
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
      ...(c.label !== undefined ? { label: { ...c.label } } : {}),
    });
  }
  return out.length > 0 ? out : undefined;
}

/** Shift content so the leftmost/topmost rendered point sits at (0,0).
 *  G5 C2: `clusters` (optional) rides the SAME translation derived from
 *  nodes/edges alone — clusters never participate in DERIVING minX/minY, only
 *  in receiving the shift, so this is byte-identical for every pre-existing
 *  caller that doesn't read `DotLayoutResult.clusters`. */
/** The optional per-edge positions that RIDE `shiftToOrigin`'s translation
 *  without participating in DERIVING it (only `points` and the node boxes do
 *  that). `epX`/`epY` join the pre-existing label positions here for the
 *  reason given on `DotLayoutResult.edges[].epX`: the arrow attachment point
 *  sits on the head node's own boundary, inside the extent the nodes already
 *  establish, so folding it into the min could only move the origin — and
 *  would shift every existing fixture. */
const EDGE_SHIFTED_X = ['epX', 'labelX', 'tailLabelX', 'headLabelX'] as const;
const EDGE_SHIFTED_Y = ['epY', 'labelY', 'tailLabelY', 'headLabelY'] as const;

/** Split out of {@link shiftToOrigin} solely to keep that function under the
 *  repo's CCN cap; behaviour is the per-edge half of it, unchanged. */
function shiftEdge(e: OutEdges[number], minX: number, minY: number): void {
  for (const p of e.points) {
    p.x -= minX;
    p.y -= minY;
  }
  for (const k of EDGE_SHIFTED_X) {
    const v = e[k];
    if (v !== undefined) e[k] = v - minX;
  }
  for (const k of EDGE_SHIFTED_Y) {
    const v = e[k];
    if (v !== undefined) e[k] = v - minY;
  }
}

/** Translates every node/edge/cluster so the node+edge min lands on the
 *  origin, and returns the subtracted min (`DotLayoutResult.originShift`). */
function shiftToOrigin(nodes: OutNodes, edges: OutEdges, clusters?: OutClusters): { x: number; y: number } {
  let minX = Math.min(...nodes.map((n) => n.x));
  let minY = Math.min(...nodes.map((n) => n.y));
  for (const e of edges) {
    for (const p of e.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
    }
  }
  if (minX === 0 && minY === 0) return { x: 0, y: 0 };
  for (const n of nodes) {
    n.x -= minX;
    n.y -= minY;
  }
  for (const e of edges) shiftEdge(e, minX, minY);
  if (clusters !== undefined) {
    for (const c of clusters) {
      c.x -= minX;
      c.y -= minY;
      // T7: the label-space CENTRE rides the identical translation — it is
      // reported in the same pre-shift frame as the box, verified directly
      // against @knowvah/dot-engine (both move by the same graph-wide bb
      // origin normalisation).
      if (c.label !== undefined) {
        c.label.x -= minX;
        c.label.y -= minY;
      }
    }
  }
  return { x: minX, y: minY };
}

function canvasSize(nodes: OutNodes, edges: OutEdges): { width: number; height: number } {
  let width = 0;
  let height = 0;
  for (const n of nodes) {
    width = Math.max(width, n.x + n.width + CANVAS_MARGIN);
    height = Math.max(height, n.y + n.height + CANVAS_MARGIN);
  }
  for (const e of edges) {
    if (e.labelX !== undefined && e.labelWidth !== undefined) {
      width = Math.max(width, e.labelX + e.labelWidth / 2 + CANVAS_MARGIN);
    }
    for (const p of e.points) {
      width = Math.max(width, p.x + CANVAS_MARGIN);
      height = Math.max(height, p.y + CANVAS_MARGIN);
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
  opts?: { engine?: string; read?: 'svek' | 'exact' },
): DotLayoutResult {
  // BEFORE the observer, deliberately: the oracle DOT-parity harness captures
  // its comparison subject here, and it must see the same graph the engine
  // does. Marking after this point would emit a faithful DOT from a graph the
  // layout never saw -- the exact split `sametail` had before it was fixed.
  input = withSameContainerConstraints(input);
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
  // cdd3-T-D3: Svek parses graphviz's 2-dp SVG text (`graph-layout-svek-
  // read.ts`); `read: 'exact'` is for callers whose jar path is Smetana.
  const svek = (opts?.read ?? 'svek') === 'svek';
  const raw = getLayout(b.graph, { yAxis: svek ? 'up' : 'down' });
  const frame = svek ? svekFrame(raw.bounds.height) : undefined;
  const snap = frame === undefined ? raw : { ...raw, clusters: raw.clusters.map((c) => svekCluster(frame, c)) };

  const nodes = mapNodes(snap, input, frame);
  const edges = mapEdges(snap, idx, frame);
  const clusters = mapClusters(snap, clusterIdx);
  const originShift = shiftToOrigin(nodes, edges, clusters);
  const { width, height } = canvasSize(nodes, edges);

  return { nodes, edges, width, height, originShift, ...(clusters !== undefined ? { clusters } : {}) };
}

export type {
  DotInputNode,
  DotInputNodeShape,
  DotInputEdge,
  DotInputCluster,
  DotInputGraph,
  DotInputTogether,
  DotLayoutResult,
} from './graph-layout.types.js';
