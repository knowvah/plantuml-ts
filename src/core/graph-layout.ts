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
  DotInputNode,
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
import { withSameContainerConstraints } from './graph-layout-build-constraint.js';

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

/**
 * G9/T9: a PORT node occupies its own symbol, not the box graphviz laid out.
 *
 * `SvekNode#appendLabelHtmlSpecialForPort` emits an entry/exit point as a
 * `shape=plaintext` HTML table whenever its label is wider than 40px, so
 * graphviz sizes the NODE from that table and its `PAD`ded minimum — 54x36 for
 * `jucori-40-cevo136`'s `Aentry1`, against the 12x12 symbol drawn there. That
 * bigger box is CORRECT for layout (it is what spaces the ranks), and jar
 * keeps it: `dot -Tplain` puts that fixture's two pin centres 145px apart,
 * exactly the frame height jar draws.
 *
 * Jar reconciles the two when it reads the layout back. `DotStringFactory
 * #solve:382-389` takes a `RECTANGLE_PORT`/`RECTANGLE_HTML_FOR_PORTS` node's
 * position from the `points="…"` polygon beside its `<title>` in graphviz's
 * own SVG — which is the PORT CELL's polygon, not the outer table's — and
 * graphviz centres that cell in the padded table. So the reported box is the
 * caller's declared symbol size, on the engine's own centre.
 *
 * This is the seam `solve` occupies, so every consumer sees the corrected box:
 * before it moved here the state engine drew a 12x12 pin from a 12x12 layout
 * node (right drawing, ranks 12px too close) and the description engine drew a
 * 54x36 rect where jar draws 12x12.
 *
 * The `RECTANGLE_HTML_FOR_PORTS` half of that same `solve` branch — a class or
 * object leaf whose members carry link ports, `portRows` here — needs the very
 * same correction for the very same reason. `addRowPortNode` hands graphviz an
 * HTML row table with no `width`/`height`/`fixedsize`, exactly as
 * `SvekNode#appendLabelHtmlSpecialForLink` does, and `poly_init` pads it by
 * `PAD` (`4*GAP` wide, `2*GAP` tall — graphviz `common/shapes.c:1993-2009`,
 * `common/const.h:251`). That padding is what spaces the ranks, and jar wants
 * it; jar simply never reads it back as the classifier's box.
 *
 * Measured on `kidugi-68-noje040`: `BigLibrary`'s declared 251.6625x76 came
 * back as the padded 267x84 — +15.3375 and +8.0, i.e. `PAD` to the pixel — so
 * the class drew 16px too wide with an empty methods compartment twice its
 * height, and its whole interior sat 4px high on jar's (same centre, taller
 * box). Its two neighbours were 8px off in x for the same reason.
 */
function portNodeSize(d: DotInputNode | undefined, engine: number, declared: number): number {
  if (d === undefined) return engine;
  const htmlSized = (d.isPort === true && d.shape === 'plaintext') || d.portRows !== undefined;
  return htmlSized ? declared : engine;
}

/**
 * The box HALVED to derive a node's CORNER from graphviz's centre — separate
 * from `width`/`height` (what gets DRAWN) because the two diverge for
 * exactly one shape: a `portRows` row-table classifier's declared cell
 * `WIDTH=`/`HEIGHT=` values carry sub-point fractions (this port's own text
 * measurement), and real graphviz's HTML-table layout floors each to a
 * whole point before it ever fixes a centre — `addRowPortNode` (`graph-
 * layout-build.ts`) hands it those fractional `FIXEDSIZE` cells verbatim,
 * with no `fixedsize`/`width`/`height` on the outer node for graphviz to
 * echo back untouched. Jar reads that FLOORED box's own left edge off
 * graphviz's rendered SVG (`DotStringFactory#solve`) and draws its own
 * (fractional) width FROM that edge; it does not re-centre. So the corner
 * this port computes must floor too, or it draws centred on the fraction
 * graphviz never kept.
 *
 * Verified directly against real graphviz 15.1.1 `-Tsvg` (not dot-engine)
 * on two cached oracle DOTs, disambiguating floor from round-to-nearest:
 * `garizu-98-nixo496`'s `sh0006` (`WIDTH="220.51250000000005"`, fraction
 * .5125 — ROUNDS to 221, but the rendered polygon is exactly 220 wide,
 * `Math.floor`) and `kidugi-68-noje040`'s `sh0006` (`WIDTH=
 * "251.66250000000008"`, HEIGHT sums to 76) — polygon `8,-4` to `259,-80`,
 * i.e. 251x76 exactly, `Math.floor` on both axes and NO extra padding (the
 * `portNodeSize` doc comment's own +15.3375/+8.0 pad measurement above this
 * function was against `@knowvah/dot-engine`, not real graphviz, for this
 * SAME fixture — that divergence is real but orthogonal: it explains why
 * `portNodeSize` must override the engine's raw width for DRAWING, not
 * where the CENTRE the pad is applied around sits, which real graphviz's
 * own floored-not-padded box confirms is unaffected either way).
 *
 * Scoped to `portRows` only, matching the measured evidence
 * (`.agent-notes/class-html-node-corner-vs-quantized-width.md`: "both are
 * member-port diagrams… the other nine have no ports and take the engine
 * width"). The `isPort`-plaintext port SYMBOL (G9/T9, one function up) keeps
 * centring on its own small declared size inside graphviz's larger box —
 * jar reads THAT case from the port CELL's own polygon, a different
 * mechanism this fix does not touch.
 *
 * @see ~/git/graphviz/lib/common/htmllex.c, lib/common/htmltable.c (HTML
 *      table cell sizing — the floor happens inside graphviz's own table
 *      layout, before `poly_init` ever sees a size)
 */
function cornerSize(
  d: DotInputNode | undefined,
  width: number,
  height: number,
): [number, number] {
  if (d?.portRows === undefined) return [width, height];
  return [Math.floor(width), Math.floor(height)];
}

function mapNodes(snap: LayoutSnapshot, input: DotInputGraph): OutNodes {
  const declared = new Map(input.nodes.map((n) => [n.id, n]));
  return snap.nodes.map((n) => {
    const d = declared.get(n.name);
    const echo = (ours: number | undefined, engine: number): number =>
      ours !== undefined && Math.abs(ours - engine) < ROUND_TRIP_EPSILON ? ours : engine;
    const width = portNodeSize(d, echo(d?.width, n.width), d?.width ?? n.width);
    const height = portNodeSize(d, echo(d?.height, n.height), d?.height ?? n.height);
    const [cornerW, cornerH] = cornerSize(d, width, height);
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
  const snap = getLayout(b.graph, { yAxis: 'down' });

  const nodes = mapNodes(snap, input);
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
