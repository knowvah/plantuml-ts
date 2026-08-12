// Svek-faithful DOT emitter.
//
// Serializes a DotInputGraph into the DOT text PlantUML's Svek feeds graphviz,
// so our generated DOT can be compared (at DOT granularity) against the oracle's
// svek-*.dot dumps. This is for parity inspection/testing only — it is NOT on
// the layout path (the @knowvah/dot-engine adapter ignores the emitter-only fields).
//
// Faithful to Svek's shape (see ~/git/plantuml .../svek/{DotStringFactory,
// SvekNode,SvekEdge,ClusterDotString,SvekUtils}.java):
//   digraph unix { nodesep; ranksep; remincross=true; searchsize=500; [rankdir]
//     sh#### [shape=…,label="",width=…,height=…,color="#…"];
//     shA->shB[arrowtail=none,arrowhead=none,minlen=…,color="#…"{,label=<TABLE…>}];
//     subgraph cluster# { label=<TABLE…>; <member nodes> } }
// Synthetic sh-ids / colors come from one counter (Svek's ColorSequence); the
// parity gate normalizes them away, so only their presence/structure matters.

import type {
  DotInputCluster,
  DotInputEdge,
  DotInputGraph,
  DotInputNode,
} from './graph-layout.types.js';
import {
  assignSequence,
  buildClusterTree,
  type ClusterColors,
  type ClusterTree,
  type EdgeColors,
  type NodeRec,
  type SeqAssignment,
} from './svek-dot-sequence.js';
// B1/M1: the HTML label-table builders moved to a sibling module for the
// 500-line file cap (pure move -- see that file's header).
import {
  hex,
  labelTable,
  edgeLabelTable,
  portTable,
  rowPortTable,
  shieldTable,
} from './svek-dot-emit-labels.js';

const PX_PER_INCH = 72;
const MIN_NODESEP_PX = 35; // Svek getMinNodeSep() (non-activity)
const MIN_RANKSEP_PX = 60; // Svek getMinRankSep() (non-activity)
/** DotStringFactory.getMinRankSep():247-249 — `!pragma kermor on` floors
 *  ranksep at 40px instead of 60px. getMinNodeSep() never checks kermor, so
 *  nodesep's 35px floor is unaffected (see also getVerticalDzeta's ÷100
 *  divisor, applied upstream in description/link-edge-attrs.ts). */
const MIN_RANKSEP_PX_KERMOR = 40;

const inches = (px: number): string => (px / PX_PER_INCH).toFixed(6);
type EdgeAttrs = NonNullable<DotInputEdge['attributes']>;

/** Explicit skinparam overrides skip the minimum floor
 *  (DotStringFactory.java:117-133); computed defaults keep it. */
function resolveSep(
  value: number | undefined,
  explicit: boolean | undefined,
  floorPx: number,
): number {
  if (explicit) return value ?? floorPx;
  return Math.max(value ?? 0, floorPx);
}

function graphAttrLines(input: DotInputGraph): string[] {
  const lines: string[] = [];
  if (input.omitSepAttrs !== true) {
    const rankFloor = input.kermor === true ? MIN_RANKSEP_PX_KERMOR : MIN_RANKSEP_PX;
    const ns = resolveSep(input.nodeSep, input.nodeSepExplicit, MIN_NODESEP_PX);
    const rs = resolveSep(input.rankSep, input.rankSepExplicit, rankFloor);
    lines.push(`nodesep=${inches(ns)};`, `ranksep=${inches(rs)};`);
  }
  lines.push('remincross=true;', 'searchsize=500;');
  if (input.rankDir === 'LR') lines.push('rankdir=LR;');
  return lines;
}

function shapeAttr(node: DotInputNode): string {
  const shape = node.shape ?? 'rect';
  if (shape === 'rounded') return 'shape=rect,style=rounded';
  return `shape=${shape}`;
}

function nodeLine(node: DotInputNode, rec: NodeRec): string {
  const shape = node.shape ?? 'rect';
  if (shape === 'point') {
    return `${rec.sh} [shape=point,width=.01,label=""];`;
  }
  // ClusterDotString.empty() port placeholder — a tiny `.01in` rect whose
  // label is the owning cluster's own title table (see graph-layout.types
  // DotInputNode.titleLabelWidth). Checked before the generic 'rect' branch
  // since it shares that default shape value.
  if (node.titleLabelWidth !== undefined && node.titleLabelHeight !== undefined) {
    // ClusterDotString.java:148-149 — the plain point anchor declaration is
    // ALWAYS emitted first when the group itself is also a real edge target
    // (thereALinkFromOrToGroup2), independently of hasPort(); graphviz lets
    // a node id be redeclared, and the comparator dedupes by first-seen
    // shape, so both lines matter (see graph-layout.types.ts).
    const pointDecl = node.groupAnchorAlsoPoint === true
      ? `${rec.sh} [shape=point,width=.01,label=""];`
      : '';
    return `${pointDecl}${rec.sh} [shape=rect,width=.01,height=.01,label=${
      labelTable(node.titleLabelWidth, node.titleLabelHeight, rec.color)
    }];`;
  }
  if (shape === 'plaintext') {
    // RECTANGLE_HTML_FOR_PORTS is checked FIRST: SvekNode#appendShape tests it
    // before RECTANGLE_PORT and before the shielded-RECTANGLE branch
    // (svek/SvekNode.java:132-143), and it emits no width/height at all.
    if (node.portRows !== undefined) {
      return `${rec.sh} [shape=plaintext,label=<${rowPortTable(node, node.portRows, rec.color)}>];`;
    }
    if (node.isPort === true) {
      return `${rec.sh} [shape=plaintext,label=<${portTable(node, rec.color)}>];`;
    }
    return `${rec.sh} [shape=plaintext,label=<${shieldTable(node, rec.color)}>];`;
  }
  return (
    `${rec.sh} [${shapeAttr(node)},label="",` +
    `width=${inches(node.width)},height=${inches(node.height)},color="${hex(rec.color)}"];`
  );
}

/** Bibliotekon.getNodeUid: every DOT reference to a shielded node's uid gets
 *  a ":h" port suffix (the shield table's colored center cell). "Shielded"
 *  is `SvekNode#isShielded()` (svek/SvekNode.java:383-396) -- a property of
 *  the NODE, independent of its shape/type; `DotInputNode.qualifierShielded`
 *  carries that signal (see its own doc comment for the upstream mechanism
 *  and this port's scope note).
 *
 *  B1/M1: a `RECTANGLE_HTML_FOR_PORTS` endpoint whose link named a member row
 *  takes THAT row's md5 port instead — `abel/Link.java:219-231` threads the
 *  port name onto the endpoint, and `Ports#encodePortNameToId` has already
 *  encoded it by the time it reaches `DotInputEdge`.
 *
 *  B1: a `portRows`-bearing node whose link named no row is NOT automatically
 *  shielded -- `RECTANGLE_HTML_FOR_PORTS` bypasses `isShielded` entirely in
 *  `appendShape` (svek/SvekNode.java:132-152, checked BEFORE the `RECTANGLE
 *  && isShielded` branch), so only an explicit `qualifierShielded` earns
 *  `:h` there. Every OTHER `shape=plaintext` node (no `portRows`) keeps the
 *  prior unconditional `:h` -- upstream's other plaintext producers
 *  (`EntityImageDescription`'s interface shield, `EntityImageClass`'s bare
 *  `RECTANGLE && isShielded` shield) only ever choose `plaintext` FOR a
 *  shield reason in the first place, so the blanket rule was already correct
 *  there and this port's node builders for those never populate `portRows`. */
function edgeRef(
  id: string,
  recs: Map<string, NodeRec>,
  nodeById: Map<string, DotInputNode>,
  rowPort: string | undefined,
): string {
  const rec = recs.get(id)!;
  const node = nodeById.get(id);
  // Link.getEntityPort: a port entity always gets the ":P" compass suffix,
  // regardless of which shape branch (HTML table vs plain small rect) its
  // OWN node line took.
  if (node?.isPort === true) return `${rec.sh}:P`;
  if (rowPort !== undefined && node?.portRows !== undefined) return `${rec.sh}:${rowPort}`;
  if ((node?.shape ?? 'rect') !== 'plaintext') return rec.sh;
  if (node?.portRows !== undefined) return node.qualifierShielded === true ? `${rec.sh}:h` : rec.sh;
  return `${rec.sh}:h`;
}

/** Optional edge label / taillabel / headlabel parts (Svek HTML tables).
 *
 *  Colors come from the edge's four RESERVED values (SvekEdge.java:275-278),
 *  not from a live counter: `label`/`xlabel` share `noteLabel` because they
 *  are alternatives (ortho routes the label through xlabel), `taillabel` takes
 *  `startTail` and `headlabel` takes `endHead`. Upstream reserves all four
 *  whether or not it draws them, so an absent label no longer shifts the
 *  numbering of anything downstream. */
function edgeLabelParts(a: EdgeAttrs, c: EdgeColors): string[] {
  const parts: string[] = [];
  if (a.label !== undefined && a.labelWidth !== undefined && a.labelHeight !== undefined) {
    parts.push(`label=${edgeLabelTable(a.labelWidth, a.labelHeight, c.noteLabel)}`);
  }
  // linetype ortho routes the label through xlabel (SvekEdge.java:434-441).
  if (a.xlabel !== undefined && a.xlabelWidth !== undefined && a.xlabelHeight !== undefined) {
    parts.push(`xlabel=${edgeLabelTable(a.xlabelWidth, a.xlabelHeight, c.noteLabel)}`);
  }
  if (a.tailLabelWidth !== undefined && a.tailLabelHeight !== undefined) {
    parts.push(`taillabel=${edgeLabelTable(a.tailLabelWidth, a.tailLabelHeight, c.startTail)}`);
  }
  if (a.headLabelWidth !== undefined && a.headLabelHeight !== undefined) {
    parts.push(`headlabel=${edgeLabelTable(a.headLabelWidth, a.headLabelHeight, c.endHead)}`);
  }
  // #lizard forgives — faithful port of SvekEdge's fixed label-attr order
  // (SvekEdge.java:391-483); each branch is one upstream attribute.
  return parts;
}

function edgeLine(edge: DotInputEdge, fromSh: string, toSh: string, c: EdgeColors): string {
  const a = edge.attributes ?? {};
  const parts = [
    'arrowtail=none',
    'arrowhead=none',
    `minlen=${a.minLen ?? 1}`,
    `color="${hex(c.line)}"`,
    ...edgeLabelParts(a, c),
  ];
  if (a.invis === true) parts.push('style=invis');
  return `${fromSh}->${toSh}[${parts.join(',')}];`;
}

/** ClusterDotString.printRanks' port rank-chain: one `A->B->C
 *  [arrowhead=none]` statement per rank present, then `C->anchor;`
 *  (bare, bracket-less — matching Svek's `empty()` link exactly). */
function portChainLines(cluster: DotInputCluster, recs: Map<string, NodeRec>): string[] {
  if (cluster.portRanks === undefined || cluster.portAnchorId === undefined) return [];
  const anchorRec = recs.get(cluster.portAnchorId);
  if (anchorRec === undefined) return [];
  const lines: string[] = [];
  for (const { nodeIds } of cluster.portRanks) {
    const shs = nodeIds.map((id) => recs.get(id)?.sh).filter((sh): sh is string => sh !== undefined);
    if (shs.length === 0) continue;
    lines.push(`${shs.join('->')} [arrowhead=none];`);
    lines.push(`${shs[shs.length - 1]!}->${anchorRec.sh};`);
  }
  return lines;
}

/** ClusterDotString.printRanks: `{rank=source;shA;shB;}` groups emitted as the
 *  FIRST content inside a ports cluster (matching Svek's exact text — the
 *  in-cluster anonymous braces are part of the oracle's byte shape). */
function portRankGroups(cluster: DotInputCluster, recs: Map<string, NodeRec>): string {
  return (cluster.portRanks ?? [])
    .map(({ rank, nodeIds }) => {
      const shs = nodeIds
        .map((id) => recs.get(id)?.sh)
        .filter((sh): sh is string => sh !== undefined);
      return shs.length > 0 ? `{rank=${rank};${shs.join(';')};}` : '';
    })
    .join('');
}

/** ClusterDotString port branch: labeljust only (no label attr — the title
 *  table moves onto the ee-placeholder), rank groups first, port nodes +
 *  bare constraint chains in the outer cluster, then `clusterNee` wrapping
 *  the placeholder and normal members (hasPort() → subgraphClusterNoLabel
 *  ID_EE + the trailing `empty()` rect, ClusterDotString.java:134-184). */
function portClusterBlock(
  cluster: DotInputCluster,
  childrenOf: ClusterTree['childrenOf'],
  recs: Map<string, NodeRec>,
  nodeById: Map<string, DotInputNode>,
  colors: Map<string, ClusterColors>,
): string[] {
  const cc = colors.get(cluster.id)!;
  const labelOnEe = cluster.portRanksLabelOnEe === true;
  const attrs = cluster.labelWidth !== undefined ? 'labeljust="c";' : '';
  const out = [
    `subgraph ${cluster.id} {style=solid;color="${hex(cc.color)}";${attrs}` +
      portRankGroups(cluster, recs),
  ];
  const emitLine = (id: string): void => {
    const node = nodeById.get(id);
    const rec = recs.get(id);
    if (node !== undefined && rec !== undefined) out.push(nodeLine(node, rec));
  };
  const isPortId = (id: string): boolean => nodeById.get(id)?.isPort === true;
  for (const id of cluster.nodeIds) if (isPortId(id)) emitLine(id);
  // Entry/exit border points (state diagrams, mechanisms.md §2's WithLabel
  // branch) never chain to the anchor — only genuine PORTIN/PORTOUT
  // (NoLabel branch) do (ClusterDotString.java's hasPort() split).
  if (!labelOnEe) out.push(...portChainLines(cluster, recs));
  const eeLabel =
    labelOnEe && cluster.labelWidth !== undefined && cluster.labelHeight !== undefined
      ? `label=${labelTable(cluster.labelWidth, cluster.labelHeight, cc.title)};`
      : 'label="";';
  out.push(`subgraph ${cluster.id}ee {${eeLabel}`);
  for (const id of cluster.nodeIds) if (!isPortId(id)) emitLine(id);
  for (const child of childrenOf.get(cluster.id) ?? []) {
    // portClusterBlock is only ever reached on the non-kermor path
    // (clusterBlock dispatches to kermorClusterBlock first when kermor is
    // true, before this function can be reached) — `false` is not a stand-in
    // default, it is the only value this call site can ever mean.
    out.push(...clusterBlock(child, childrenOf, recs, nodeById, colors, false));
  }
  out.push('}');
  out.push('}');
  return out;
}

/** `!pragma kermor on`'s per-rank node emission: `{rank=X;shA;shB;}` then
 *  each node's own shape line (ClusterDotStringKermor.printRanks:231-245 —
 *  unlike `ClusterDotString.printRanks`, there is NO `hasPort()` chain-to-
 *  anchor branch here at all). */
function kermorRankGroupLines(
  ranks: { rank: 'source' | 'sink'; nodeIds: string[] }[],
  recs: Map<string, NodeRec>,
  nodeById: Map<string, DotInputNode>,
): string[] {
  const out: string[] = [];
  for (const { rank, nodeIds } of ranks) {
    const shs = nodeIds.map((id) => recs.get(id)?.sh).filter((sh): sh is string => sh !== undefined);
    if (shs.length === 0) continue;
    out.push(`{rank=${rank};${shs.join(';')};}`);
    for (const id of nodeIds) {
      const node = nodeById.get(id);
      const rec = recs.get(id);
      if (node !== undefined && rec !== undefined) out.push(nodeLine(node, rec));
    }
  }
  return out;
}

/** `!pragma kermor on`'s cluster body — `ClusterDotStringKermor.printInternal`
 *  + `Cluster.printCluster3_forKermor` (svek/ClusterDotStringKermor.java,
 *  Cluster.java:595-609). Deliberately narrower than the full Java: the
 *  `alpha`/`beta` note-label wrapper subgraphs are omitted (a group-attached
 *  note becomes `Entity#addNote` data under kermor, never a DOT node/edge —
 *  see description/parse-state.ts's `attachNoteToEntity` — so there is no
 *  label content to wrap, and the comparator's `parseClusters` never matches
 *  ANY kermor subgraph name against `/^cluster\d+$/` regardless of alpha/
 *  beta nesting depth, so the omission is invisible to DOT-parity). What IS
 *  ported: the rank-source group (before gamma opens), the `${id}empty`
 *  point placeholder when direct non-port members are empty, and the
 *  rank-sink group (inside gamma, no anchor/chain — contrast
 *  `portClusterBlock`'s `hasPort()` chain, which kermor's own `printRanks`
 *  never has). See description-dot-100 decision-journal.md I2. */
function kermorClusterBlock(
  cluster: DotInputCluster,
  childrenOf: ClusterTree['childrenOf'],
  recs: Map<string, NodeRec>,
  nodeById: Map<string, DotInputNode>,
  colors: Map<string, ClusterColors>,
): string[] {
  const cc = colors.get(cluster.id)!;
  const portIds = new Set((cluster.portRanks ?? []).flatMap((r) => r.nodeIds));
  const sourceRanks = (cluster.portRanks ?? []).filter((r) => r.rank === 'source');
  const sinkRanks = (cluster.portRanks ?? []).filter((r) => r.rank === 'sink');
  const normalIds = cluster.nodeIds.filter((id) => !portIds.has(id));

  const out: string[] = [...kermorRankGroupLines(sourceRanks, recs, nodeById)];

  const label =
    cluster.labelWidth !== undefined && cluster.labelHeight !== undefined
      ? `labeljust="c";label=${labelTable(cluster.labelWidth, cluster.labelHeight, cc.title)};`
      : 'label="";';
  out.push(`subgraph ${cluster.id}gamma {style=solid;color="${hex(cc.color)}";${label}`);

  if (normalIds.length === 0) {
    out.push(`${cluster.id}empty [shape=point,label=""];`);
  } else {
    for (const id of normalIds) {
      const node = nodeById.get(id);
      const rec = recs.get(id);
      if (node !== undefined && rec !== undefined) out.push(nodeLine(node, rec));
    }
  }
  for (const child of childrenOf.get(cluster.id) ?? []) {
    out.push(...kermorClusterBlock(child, childrenOf, recs, nodeById, colors));
  }
  out.push(...kermorRankGroupLines(sinkRanks, recs, nodeById));
  out.push('}');
  return out;
}

/** Emit a cluster subgraph (clean form): title table, member nodes, nested children. */
function clusterBlock(
  cluster: DotInputCluster,
  childrenOf: ClusterTree['childrenOf'],
  recs: Map<string, NodeRec>,
  nodeById: Map<string, DotInputNode>,
  colors: Map<string, ClusterColors>,
  kermor: boolean,
): string[] {
  if (kermor) return kermorClusterBlock(cluster, childrenOf, recs, nodeById, colors);
  if (cluster.portRanks !== undefined && cluster.portRanks.length > 0) {
    return portClusterBlock(cluster, childrenOf, recs, nodeById, colors);
  }
  const cc = colors.get(cluster.id)!;
  const label =
    cluster.labelWidth !== undefined && cluster.labelHeight !== undefined
      ? `labeljust="c";label=${labelTable(cluster.labelWidth, cluster.labelHeight, cc.title)};`
      : 'label="";';
  const out = [`subgraph ${cluster.id} {style=solid;color="${hex(cc.color)}";${label}`];
  for (const id of cluster.nodeIds) {
    const node = nodeById.get(id);
    const rec = recs.get(id);
    if (node !== undefined && rec !== undefined) out.push(nodeLine(node, rec));
  }
  out.push(...portChainLines(cluster, recs));
  for (const child of childrenOf.get(cluster.id) ?? []) {
    out.push(...clusterBlock(child, childrenOf, recs, nodeById, colors, kermor));
  }
  out.push('}');
  // #lizard forgives — faithful port of Cluster/ClusterDotString's nested
  // subgraph emission; the branch count mirrors upstream's cases.
  return out;
}

function rankLines(input: DotInputGraph, recs: Map<string, NodeRec>): string[] {
  // Port nodes' ranks are emitted inside their cluster (portRankGroups) —
  // ClusterDotString.printRanks, not a top-level rank group.
  const portIds = new Set(
    (input.clusters ?? []).flatMap((c) => (c.portRanks ?? []).flatMap((r) => r.nodeIds)),
  );
  const groups = new Map<string, string[]>();
  for (const n of input.nodes) {
    const r = n.attributes?.rank;
    if (r === undefined || portIds.has(n.id)) continue;
    const arr = groups.get(r) ?? [];
    arr.push(recs.get(n.id)!.sh);
    groups.set(r, arr);
  }
  return [...groups].map(([rank, shs]) => `{rank=${rank}; ${shs.join('; ')}}`);
}

function emitBody(input: DotInputGraph, seqs: SeqAssignment, tree: ClusterTree): string[] {
  const { recs, nodeById, clusterColors, edgeColors } = seqs;
  const body = [...graphAttrLines(input)];
  const kermor = input.kermor === true;
  const unclustered = input.nodes.filter((n) => !tree.clusteredIds.has(n.id));
  // DotStringFactory.java:184: `root.printCluster3_forKermor(...)` runs
  // BEFORE recursing into children — root's own direct (non-clustered)
  // "normal" members are empty in every one of these fixtures (all content
  // lives inside a container), so root gets the SAME `${id}empty` point
  // placeholder every named cluster gets (Cluster.java:595-609). "root" has
  // no DotInputCluster id in this port's model, so the placeholder uses a
  // fixed literal id — the comparator ignores exact ids (only shapes/counts
  // are compared).
  if (kermor && unclustered.length === 0) {
    body.push('rootEmpty [shape=point,label=""];');
  } else {
    for (const n of unclustered) body.push(nodeLine(n, recs.get(n.id)!));
  }
  for (const top of tree.childrenOf.get(undefined) ?? []) {
    body.push(...clusterBlock(top, tree.childrenOf, recs, nodeById, clusterColors, kermor));
  }
  body.push(...rankLines(input, recs));
  input.edges.forEach((e, i) => {
    if (!recs.has(e.from) || !recs.has(e.to)) return;
    const from = edgeRef(e.from, recs, nodeById, e.attributes?.tailport);
    body.push(
      edgeLine(e, from, edgeRef(e.to, recs, nodeById, e.attributes?.headport), edgeColors[i]!),
    );
  });
  return body;
}

/** Serialize a DotInputGraph to Svek-shaped DOT text. */
export function toSvekDot(input: DotInputGraph): string {
  const tree = buildClusterTree(input.clusters ?? []);
  const body = emitBody(input, assignSequence(input, tree), tree);
  return `digraph unix {\n${body.join('\n')}\n}\n`;
}
