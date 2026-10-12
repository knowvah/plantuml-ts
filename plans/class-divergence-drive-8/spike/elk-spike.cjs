// T0c ELK spike gate (cdd8). Measurement spike, NOT production code.
//
// Question: does elkjs 0.12.0 reproduce the PlantUML jar's ELK node positions
// for cadutu-02-lazu601?
//
// Run: node plans/class-divergence-drive-8/spike/elk-spike.cjs
//
// Upstream paths quoted below are relative to
// ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/ unless noted.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '../../..');
const FIXTURE_DIR = path.join(REPO, 'test-results/dot-cache/class/cadutu-02-lazu601');
const JAR_SVG = fs.readFileSync(path.join(FIXTURE_DIR, 'in.svg'), 'utf8');
const TEXT_WIDTHS = JSON.parse(fs.readFileSync(path.join(__dirname, 'text-widths.json'), 'utf8'));

// tests/oracle/svg-conformance/compare.ts:27-28 `TOLERANCES = { deterministic: 0.01 }`,
// compared through exceedsTolerance (compare.ts:99-102) with an EPSILON slack.
const TOLERANCE = 0.01;
function exceedsTolerance(a, b) {
  const slack = Number.EPSILON * Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) - TOLERANCE > slack;
}

// ---------------------------------------------------------------------------
// 1. Module load (timed)
// ---------------------------------------------------------------------------
let peakHeap = process.memoryUsage().heapUsed;
const samplePeak = () => {
  const h = process.memoryUsage().heapUsed;
  if (h > peakHeap) peakHeap = h;
};
const heapBeforeLoad = process.memoryUsage().heapUsed;
const tLoad0 = process.hrtime.bigint();
const W = require('./vendor/package/lib/elk-worker.min.js');
const worker = new W.Worker();
let reply = null;
worker.onmessage = (e) => {
  reply = e.data;
};
// Dispatcher.dispatch (elk-worker.js:79546-79569) answers through
// worker.postMessage -> FakeWorker's onmessage in the same tick (:79584-79586).
// `dispatch` (not `saveDispatch`) lets a layout exception propagate.
worker.dispatcher.dispatch({ data: { id: 0, cmd: 'register', algorithms: ['layered'] } });
const tLoad1 = process.hrtime.bigint();
samplePeak();
if (!reply || reply.id !== 0) throw new Error('register reply did not arrive synchronously');
const loadMs = Number(tLoad1 - tLoad0) / 1e6;

// ---------------------------------------------------------------------------
// 2. Sizes, read from the jar's own SVG (isolates layout from sizing)
// ---------------------------------------------------------------------------
/** entity name -> {x,y,w,h} of the entity <rect> (EntityImageClass.java:185-188:
 *  the rect is URectangle.build(widthTotal, heightTotal) of calculateDimension,
 *  drawn at the node origin). */
function parseJarEntities(svg) {
  const re =
    /<g class="entity" data-qualified-name="([^"]+)"[^>]*><rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g;
  const out = new Map();
  for (const m of svg.matchAll(re)) {
    out.set(m[1], { x: +m[2], y: +m[3], w: +m[4], h: +m[5] });
  }
  return out;
}
/** Top-level edge <line>s (after the last entity group), chained into
 *  polylines by endpoint continuity: MyElkEdge.java:319-352 drawSections
 *  draws one ULine per segment start->bend...->end. */
function parseJarEdgePolylines(svg) {
  const tail = svg.slice(svg.lastIndexOf('</g>\n<line') >= 0 ? svg.lastIndexOf('</g>\n<line') : svg.lastIndexOf('</g><line'));
  const lines = [...tail.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/g)].map((m) => [
    +m[1],
    +m[2],
    +m[3],
    +m[4],
  ]);
  const polys = [];
  for (const [x1, y1, x2, y2] of lines) {
    const cur = polys[polys.length - 1];
    const last = cur && cur[cur.length - 1];
    if (last && last[0] === x1 && last[1] === y1) cur.push([x2, y2]);
    else polys.push([
      [x1, y1],
      [x2, y2],
    ]);
  }
  return polys;
}
/** <text> textLength by font size: 14 = class headers, 13 = arrow labels. */
function parseJarTextLengths(svg, fontSize) {
  const out = new Map();
  for (const m of svg.matchAll(/<text [^>]*font-size="(\d+)" textLength="([\d.]+)"[^>]*>([^<]*)<\/text>/g)) {
    if (+m[1] === fontSize) out.set(m[3], +m[2]);
  }
  return out;
}

const jarEntities = parseJarEntities(JAR_SVG);
const jarPolylines = parseJarEdgePolylines(JAR_SVG);
const jarHeaderLengths = parseJarTextLengths(JAR_SVG, 14);
const jarTextLengths = parseJarTextLengths(JAR_SVG, 13);

// Cross-check: every full-precision width in text-widths.json equals the SVG
// textLength to 3 dp (proves the measurer and the jar agree before we use the
// two single-glyph widths the SVG does not print).
for (const [size, map] of [[13, jarTextLengths], [14, jarHeaderLengths]]) {
  for (const [text, len] of map) {
    const w = TEXT_WIDTHS[`${size}:${text}`].width;
    if (Math.abs(Math.round(w * 1000) / 1000 - len) > 1e-9) throw new Error(`width table disagrees with jar for ${size}:${text}: ${w} vs ${len}`);
  }
}

const SIZE_MODE = process.argv.includes('--exact') ? 'exact' : 'svg';
const LINE_HEIGHT_13 = 13; // StringBounderFromWidthTable.java:71 `height = size`; SVG line pitch 107.111->120.111->133.111

function textWidth13(text) {
  if (SIZE_MODE === 'svg' && jarTextLengths.has(text)) return jarTextLengths.get(text);
  // "1" and "*" carry no textLength in in.svg: full-precision table width
  // (text-widths.json, StringBounderFromWidthTable.java:67-80 + seam #4).
  return TEXT_WIDTHS[`13:${text}`].width;
}
function nodeSize(name) {
  const r = jarEntities.get(name);
  if (SIZE_MODE === 'svg') return { w: r.w, h: r.h };
  // exact: rect width - textLength is 32.000 for every class in in.svg, so the
  // unrounded width is the unrounded 14 pt header width + 32.
  const tl = TEXT_WIDTHS[`14:${name}`].width;
  return { w: tl + (r.w - jarHeaderLengths.get(name)), h: r.h };
}
/** Centre label of a link: CucaDiagramFileMakerElk.java:221 creole block
 *  (max line width x lines*13), :182 withMargin(1,1) in addVisibilityModifier,
 *  :233 withMargin(1,1) again (note == null, block not empty). */
function centerLabelSize(lines) {
  const w = Math.max(...lines.map(textWidth13));
  const h = lines.length * LINE_HEIGHT_13;
  return { w: w + 2 + 2, h: h + 2 + 2 };
}
/** Quantifier/role block: CucaDiagramFileMakerElk.java:250-263 / :265-278,
 *  Display.create with FontParam.ARROW, no margin. */
function endLabelSize(text) {
  return { w: textWidth13(text), h: LINE_HEIGHT_13 };
}

// ---------------------------------------------------------------------------
// 3. Graph, built in CucaDiagramFileMakerElk's creation order
// ---------------------------------------------------------------------------
// in.puml:
//   class foo1 / class foo2 / foo1 <--> foo2 : short label
//   foo "1" --> "*" bar : this label is very\nlong and has an impact\non the layout
//   foo "foo" --> "bar" bar2 : hello
// diagram.leafs() order = creation order foo1, foo2, foo, bar, bar2 (svg ids
// ent0001, 0002, 0004, 0005, 0007); getLinks() order = the three link lines.
const LEAVES = ['foo1', 'foo2', 'foo', 'bar', 'bar2'];
const LINKS = [
  { from: 'foo1', to: 'foo2', label: ['short label'], q1: null, q2: null },
  {
    from: 'foo',
    to: 'bar',
    label: ['this label is very', 'long and has an impact', 'on the layout'],
    q1: '1',
    q2: '*',
  },
  // "foo"/"bar" end labels: forLayout = q != null ? q : r (:433 / :447); same
  // TextBlock size either way.
  { from: 'foo', to: 'bar2', label: ['hello'], q1: 'foo', q2: 'bar' },
];

/** Variant of the node-label placement property; see report "unmappable". */
const NODE_LABEL_VARIANT = (process.argv.find((a) => a.startsWith('--nodelabel=')) || '--nodelabel=java-intent').split('=')[1];

function buildGraph() {
  // :481 ElkGraphUtil.createGraph()
  const root = {
    id: 'root',
    layoutOptions: {
      // :482 root.setProperty(CoreOptions.DIRECTION, Direction.DOWN)
      'org.eclipse.elk.direction': 'DOWN',
      // :483 root.setProperty(CoreOptions.HIERARCHY_HANDLING, HierarchyHandling.INCLUDE_CHILDREN)
      'org.eclipse.elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      // No CoreOptions.ALGORITHM anywhere in elk/: both sides resolve the
      // default algorithm; the jar registers only LayeredMetaDataProvider
      // (META-INF/services/org.eclipse.elk.core.data.ILayoutMetaDataProvider)
      // and this script registers only 'layered'.
    },
    children: [],
    edges: [],
  };
  // :488 printAllSubgroups(root, rootGroup) -> no groups in cadutu (no package).
  // :489 printEntities(root, getUnpackagedEntities()) -> prinEntity per leaf:
  for (const name of LEAVES) {
    const { w, h } = nodeSize(name);
    // :384 ElkGraphUtil.createNode(parent); :385 setDimensions(w, h)
    const node = { id: name, width: w, height: h, labels: [] };
    // :389-390 createLabel(elkNode); setText("X")
    // :393-394 VERY_STRANGE_OFFSET = 10; label.setDimensions(w, h - 10)
    const label = { text: 'X', width: w, height: h - 10 };
    // :397-398 label.setProperty(NODE_LABELS_PLACEMENT,
    //   EnumSet.of(NodeLabelPlacement.INSIDE, H_CENTER, V_CENTER))
    if (NODE_LABEL_VARIANT === 'java-intent') {
      label.layoutOptions = { 'org.eclipse.elk.nodeLabels.placement': '[INSIDE, H_CENTER, V_CENTER]' };
    }
    // NODE_LABEL_VARIANT === 'unset': property omitted (see report).
    node.labels.push(label);
    root.children.push(node);
  }
  // :491 manageAllEdges -> :414-460 manageSingleEdge per link
  LINKS.forEach((link, i) => {
    // :418 ElkGraphUtil.createSimpleEdge(node1, node2) (containment = root;
    // elkjs JsonImporter also calls updateContainment, elk-worker.js:77018)
    const edge = { id: `e${i}`, sources: [link.from], targets: [link.to], labels: [], layoutOptions: {} };
    // :420 getLabel never returns null (EMPTY_TEXT_BLOCK when no label), so :421 always runs
    {
      const { w, h } = centerLabelSize(link.label);
      // :422-425 createLabel(edge); setText("X"); setDimensions(dim)
      edge.labels.push({ text: 'X', width: w, height: h });
      // :427 edge.setProperty(CoreOptions.EDGE_LABELS_INLINE, true)
      edge.layoutOptions['org.eclipse.elk.edgeLabels.inline'] = 'true';
    }
    if (link.q1 != null) {
      const { w, h } = endLabelSize(link.q1);
      // :434-438 createLabel(edge); setText("1"); setDimensions(dim)
      // :439 edgeLabel.setProperty(EDGE_LABELS_PLACEMENT, EdgeLabelPlacement.TAIL)
      edge.labels.push({ text: '1', width: w, height: h, layoutOptions: { 'org.eclipse.elk.edgeLabels.placement': 'TAIL' } });
      // :441 edge.setProperty(EDGE_LABELS_INLINE, true)
      edge.layoutOptions['org.eclipse.elk.edgeLabels.inline'] = 'true';
    }
    if (link.q2 != null) {
      const { w, h } = endLabelSize(link.q2);
      // :448-452 createLabel(edge); setText("2"); setDimensions(dim)
      // :453 edgeLabel.setProperty(EDGE_LABELS_PLACEMENT, EdgeLabelPlacement.HEAD)
      edge.labels.push({ text: '2', width: w, height: h, layoutOptions: { 'org.eclipse.elk.edgeLabels.placement': 'HEAD' } });
      // :455 edge.setProperty(EDGE_LABELS_INLINE, true)
      edge.layoutOptions['org.eclipse.elk.edgeLabels.inline'] = 'true';
    }
    root.edges.push(edge);
  });
  return root;
}

let nextId = 1;
function layoutSync(graph) {
  reply = null;
  const id = nextId++;
  // :493 new RecursiveGraphLayoutEngine().layout(root, new NullElkProgressMonitor())
  // elkjs layout_10 (elk-worker.js:79618-79647) runs the same
  // RecursiveGraphLayoutEngine with a BasicProgressMonitor. No global
  // layoutOptions: every property is set per element, as upstream does.
  worker.dispatcher.dispatch({ data: { id, cmd: 'layout', graph, layoutOptions: {}, options: {} } });
  if (!reply || reply.id !== id) throw new Error('layout reply did not arrive synchronously');
  if (reply.error) throw reply.error;
  return reply.data;
}

// ---------------------------------------------------------------------------
// 4. Layout + compare
// ---------------------------------------------------------------------------
const laid = layoutSync(buildGraph());
samplePeak();

// Translate: MyElkDrawing.java:133 corner = CucaDiagramFileMakerElk.getPosition(node)
// (:281-296: parent is root, root has no labels -> raw (x, y)); :138-139 image
// translated by UTranslate.point(corner). Document: TextBlockExporter.java:173
// ug.apply(new UTranslate(margin.getLeft(), margin.getTop())) with
// calculateMargin (:510-516): skin root/document carry no Margin
// (resources/skin/plantuml.skin:1-60) -> CucaDiagram.getDefaultMargins()
// (net/atmp/CucaDiagram.java:742-745) = top 0, right 5, bottom 5, left 0.
// MyElkDrawing never subtracts minMax (it is used only for
// calculateDimension, :341-346). So translate = (0, 0).
const TX = 0;
const TY = 0;

const nodeRows = [];
let firstNodeFail = null;
for (const child of laid.children) {
  const jar = jarEntities.get(child.id);
  const ex = child.x + TX;
  const ey = child.y + TY;
  const dx = ex - jar.x;
  const dy = ey - jar.y;
  const fail = exceedsTolerance(ex, jar.x) || exceedsTolerance(ey, jar.y);
  if (fail && !firstNodeFail) firstNodeFail = { node: child.id, coord: exceedsTolerance(ex, jar.x) ? 'x' : 'y', elk: [ex, ey], jar: [jar.x, jar.y] };
  nodeRows.push({ node: child.id, elk: [ex, ey], jar: [jar.x, jar.y], d: [dx, dy], fail });
}

// Edges: MyElkDrawing.java:183 translate = getPosition(edge.getContainingNode())
// = root -> (0, 0); MyElkEdge.java:153 ug.apply(translate). drawSections
// (MyElkEdge.java:319-352) applies MagneticBorder forces to start/end only;
// EntityImageClass has none here (MagneticBorderNone), so the jar polyline is
// start -> bendPoints -> end verbatim.
const edgeRows = [];
let firstEdgeFail = null;
laid.edges.forEach((e, i) => {
  const s = e.sections[0];
  const elkPts = [[s.startPoint.x, s.startPoint.y], ...(s.bendPoints || []).map((b) => [b.x, b.y]), [s.endPoint.x, s.endPoint.y]].map(
    ([x, y]) => [x + TX, y + TY],
  );
  const jarPts = jarPolylines[i];
  let ok = jarPts && jarPts.length === elkPts.length;
  if (ok) {
    for (let k = 0; k < elkPts.length; k++) {
      if (exceedsTolerance(elkPts[k][0], jarPts[k][0]) || exceedsTolerance(elkPts[k][1], jarPts[k][1])) ok = false;
    }
  }
  if (!ok && !firstEdgeFail) firstEdgeFail = { edge: e.id, elkPts, jarPts };
  const labels = (e.labels || []).map((l) => ({ text: l.text, x: l.x, y: l.y, w: l.width, h: l.height }));
  edgeRows.push({ edge: `${LINKS[i].from}->${LINKS[i].to}`, sections: e.sections.length, elkPts, jarPts, ok, labels });
});

// ---------------------------------------------------------------------------
// 5. Timings
// ---------------------------------------------------------------------------
const WARMUP = 5;
const RUNS = 20;
for (let i = 0; i < WARMUP; i++) layoutSync(buildGraph());
const samples = [];
for (let i = 0; i < RUNS; i++) {
  const g = buildGraph();
  const t0 = process.hrtime.bigint();
  layoutSync(g);
  const t1 = process.hrtime.bigint();
  samples.push(Number(t1 - t0) / 1e6);
  samplePeak();
}
samples.sort((a, b) => a - b);
const median = (samples[RUNS / 2 - 1] + samples[RUNS / 2]) / 2;

const fmt = (n) => (Math.round(n * 1000) / 1000).toString();
const out = {
  sizeMode: SIZE_MODE,
  nodeLabelVariant: NODE_LABEL_VARIANT,
  verdict: firstNodeFail ? 'FAIL' : 'PASS',
  firstNodeFail,
  nodes: nodeRows.map((r) => ({ node: r.node, elk: r.elk.map(fmt).join(','), jar: r.jar.join(','), delta: r.d.map((v) => v.toExponential(2)).join(','), fail: r.fail })),
  edgesAllMatch: !firstEdgeFail,
  firstEdgeFail,
  edges: edgeRows.map((r) => ({ ...r, elkPts: r.elkPts.map((p) => p.map(fmt).join(',')).join(' '), jarPts: r.jarPts && r.jarPts.map((p) => p.join(',')).join(' ') })),
  rootSize: { w: laid.width, h: laid.height },
  timings: {
    moduleLoadAndRegisterMs: fmt(loadMs),
    layoutMedianMs: fmt(median),
    layoutMinMs: fmt(samples[0]),
    layoutMaxMs: fmt(samples[RUNS - 1]),
    heapBeforeLoadMB: fmt(heapBeforeLoad / 2 ** 20),
    peakHeapUsedMB: fmt(peakHeap / 2 ** 20),
  },
};
console.log(JSON.stringify(out, null, 2));
