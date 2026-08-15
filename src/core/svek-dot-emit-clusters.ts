/**
 * Node lines and cluster blocks for the Svek DOT emitter — split out of
 * ./svek-dot-emit.ts for the 500-line file cap (G9/T1; pure move apart from the
 * wrapper emission that motivated the split, see below). That file still owns
 * the graph attributes, the edge lines and the top-level assembly; everything
 * that serializes ONE node's shape line or ONE `subgraph cluster*` block lives
 * here, together with the px→inches conversion those lines are written in.
 *
 * G9/T1 additionally emits jar's `a`/`p0`/`i`/`p1` protection wrappers around
 * every cluster that has them (`./svek-dot-wrappers.ts`), which the DOT text
 * lacked while the LAYOUT builder had built them since G7 T7.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekNode.java
 */

import type { DotInputCluster, DotInputNode } from './graph-layout.types.js';
import type { ClusterColors, ClusterTree, NodeRec } from './svek-dot-sequence.js';
import { hex, labelTable, portTable, rowPortTable, shieldTable } from './svek-dot-emit-labels.js';
import {
  closeCount,
  innerWrapperLines,
  outerWrapperLines,
  wrapperLevels,
} from './svek-dot-wrappers.js';

import { PX_PER_INCH } from './graph-layout-build.js';

/** Pixels -> the inches string graphviz is given, at jar's own 6-decimal
 *  precision. Exported (and re-exported from ./svek-dot-emit.ts, the import
 *  path callers already use) because the LAYOUT builder must hand the engine
 *  the numerically identical graph this emitter writes: jar's graphviz reads
 *  this text, so 6dp is what upstream's layout actually sees. Passing full
 *  float precision instead is not "more accurate" -- it is a different
 *  graph (a 400px node becomes 400.000032px at 6dp, and that difference
 *  changes spline routing). See `graph-layout-build.ts#addNodes`. */
export const inches = (px: number): string => (px / PX_PER_INCH).toFixed(6);


function shapeAttr(node: DotInputNode): string {
  const shape = node.shape ?? 'rect';
  if (shape === 'rounded') return 'shape=rect,style=rounded';
  return `shape=${shape}`;
}

export function nodeLine(node: DotInputNode, rec: NodeRec): string {
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

/** One `printRanks` call (`ClusterDotString.java:254-287`): the `{rank=X;…;}`
 *  group, then EACH ENTRY'S OWN SHAPE LINE, then — on the `hasPort()` branch
 *  only — that rank's constraint chain. G9/T4: the shapes belong to this
 *  block, in the OUTER cluster and interleaved per rank; emitting all the
 *  groups first and the shapes inside `ee` put four of `cinoni-00-sere847`'s
 *  border points in the wrong place and in `nodeIds` order rather than jar's
 *  source-then-sink order. */
function rankBlockLines(
  rank: 'source' | 'sink',
  nodeIds: readonly string[],
  cluster: DotInputCluster,
  recs: Map<string, NodeRec>,
  nodeById: Map<string, DotInputNode>,
): string[] {
  const shs = nodeIds.map((id) => recs.get(id)?.sh).filter((sh): sh is string => sh !== undefined);
  if (shs.length === 0) return [];
  const out = [`{rank=${rank};${shs.join(';')};}`];
  for (const id of nodeIds) {
    const node = nodeById.get(id);
    const rec = recs.get(id);
    if (node !== undefined && rec !== undefined) out.push(nodeLine(node, rec));
  }
  // Entry/exit border points (the WithLabel branch, `portRanksLabelOnEe`)
  // never chain to the anchor — only genuine PORTIN/PORTOUT ports do
  // (ClusterDotString.java:267's `hasPort()` split).
  const anchorSh = cluster.portRanksLabelOnEe === true ? undefined : recs.get(cluster.portAnchorId ?? '')?.sh;
  if (anchorSh !== undefined) {
    out.push(`${shs.join('->')} [arrowhead=none];`, `${shs[shs.length - 1]!}->${anchorSh};`);
  }
  return out;
}

/** Every id a `portRanks` group names — the members `printRanks` declares in
 *  the OUTER cluster, and so the ones `ee` must not repeat. */
function rankedIds(cluster: DotInputCluster): Set<string> {
  return new Set((cluster.portRanks ?? []).flatMap((r) => r.nodeIds));
}

/** A port that no rank group names still gets its shape line in the outer
 *  cluster. `printRanks` is upstream's only writer of those lines, but this
 *  port builds `portRanks` per diagram type and a caller may leave a port out
 *  of both groups; without this they would silently vanish from the DOT. */
function unrankedPortLines(
  cluster: DotInputCluster,
  recs: Map<string, NodeRec>,
  nodeById: Map<string, DotInputNode>,
): string[] {
  const ranked = rankedIds(cluster);
  const out: string[] = [];
  for (const id of cluster.nodeIds) {
    const node = nodeById.get(id);
    const rec = recs.get(id);
    if (ranked.has(id) || node?.isPort !== true || rec === undefined) continue;
    out.push(nodeLine(node, rec));
  }
  return out;
}

/** `ee`'s own label attribute: the cluster's title table on the border-point
 *  (`subgraphClusterWithLabel`) branch, none on the genuine-port
 *  (`subgraphClusterNoLabel`) one — `ClusterDotString.java:138-141`. */
function eeLabelAttr(cluster: DotInputCluster, cc: ClusterColors): string {
  return cluster.portRanksLabelOnEe === true &&
    cluster.labelWidth !== undefined &&
    cluster.labelHeight !== undefined
    ? `label=${labelTable(cluster.labelWidth, cluster.labelHeight, cc.title)};`
    : 'label="";';
}

/** The `clusterNee` block of a port/border-point cluster: the title table (or
 *  no label, on the `hasPort()` branch), then jar's `i` wrapper, then every
 *  non-port member and nested child cluster, then its own closes.
 *
 *  G9/T1: `i` opens INSIDE `ee` (`ClusterDotString.java:138-152` — the `ee`
 *  subgraph is opened at `:139/141`, the `i` wrapper at `:152`), which is what
 *  `graph-layout-build-borderpoint.ts` already builds on the layout side.
 *  Split out of `portClusterBlock` for the 30-NLOC function cap; takes the
 *  same five arguments rather than pre-computed derivatives so the parameter
 *  cap is not traded for the length one. */
function portClusterEeBlock(
  cluster: DotInputCluster,
  childrenOf: ClusterTree['childrenOf'],
  recs: Map<string, NodeRec>,
  nodeById: Map<string, DotInputNode>,
  colors: Map<string, ClusterColors>,
): string[] {
  const w = wrapperLevels(cluster);
  const out = [
    `subgraph ${cluster.id}ee {${eeLabelAttr(cluster, colors.get(cluster.id)!)}`,
    ...innerWrapperLines(cluster.id, w),
  ];
  // Ranked members are declared by `printRanks` in the OUTER cluster, so `ee`
  // carries only what is left: the anchor/placeholder and any real member.
  const outer = rankedIds(cluster);
  for (const id of cluster.nodeIds) {
    const node = nodeById.get(id);
    const rec = recs.get(id);
    if (outer.has(id) || node?.isPort === true || node === undefined || rec === undefined) continue;
    out.push(nodeLine(node, rec));
  }
  for (const child of childrenOf.get(cluster.id) ?? []) {
    // portClusterBlock is only ever reached on the non-kermor path
    // (clusterBlock dispatches to kermorClusterBlock first when kermor is
    // true, before this function can be reached) — `false` is not a stand-in
    // default, it is the only value this call site can ever mean.
    out.push(...clusterBlock(child, childrenOf, recs, nodeById, colors, false));
  }
  if (w.i) out.push('}');
  out.push('}');
  return out;
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
  const attrs = cluster.labelWidth !== undefined ? 'labeljust="c";' : '';
  // G9/T1: this family gets the "a"/"i" pair only — a border point forces
  // `protection0`/`protection1` off (`ClusterDotString.java:109-112`), so `w.p0`
  // and `w.p1` are false here by construction. "a" wraps the base cluster from
  // OUTSIDE; "i" opens inside `ee` (below), matching jar's `:151-152`.
  const w = wrapperLevels(cluster);
  const out = [
    ...outerWrapperLines(cluster.id, w),
    `subgraph ${cluster.id} {style=solid;color="${hex(cc.color)}";${attrs}`,
  ];
  // `:136-137` — RANK_SOURCE first, then RANK_SINK, each a complete
  // group-plus-shapes-plus-chain block.
  for (const { rank, nodeIds } of cluster.portRanks ?? []) {
    out.push(...rankBlockLines(rank, nodeIds, cluster, recs, nodeById));
  }
  out.push(...unrankedPortLines(cluster, recs, nodeById));
  out.push(...portClusterEeBlock(cluster, childrenOf, recs, nodeById, colors));
  out.push('}');
  if (w.a) out.push('}');
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
  // #lizard forgives — faithful port of `ClusterDotStringKermor.printInternal`
  // + `Cluster.printCluster3_forKermor`; each branch is one upstream case
  // (rank-source group, title-table label, the `${id}empty` placeholder, child
  // recursion, rank-sink group). Moved here verbatim from ./svek-dot-emit.ts
  // by G9/T1's file split — unchanged, and not this task's to restructure.
  return out;
}

/** Emit a cluster subgraph (clean form): title table, member nodes, nested children. */
export function clusterBlock(
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
  const w = wrapperLevels(cluster);
  const out = [
    ...outerWrapperLines(cluster.id, w),
    `subgraph ${cluster.id} {style=solid;color="${hex(cc.color)}";${label}`,
  ];
  const emit = (id: string): void => {
    const node = nodeById.get(id);
    const rec = recs.get(id);
    if (node !== undefined && rec !== undefined) out.push(nodeLine(node, rec));
  };
  // `ClusterDotString.java:148-149` — the group's `za<uid>` anchor point is
  // declared in the BASE cluster, BEFORE the "i"/"p1" wrappers open, so it is
  // a sibling of those wrappers rather than a descendant. `unwrappedNodeId`
  // carries exactly that node, and is (per its own doc comment) ignored when
  // no wrapper exists to be outside of — the same two-line split the layout
  // builder makes at `graph-layout-build.ts:489-495`.
  const unwrapped = cluster.innerMarginLevels === undefined ? undefined : cluster.unwrappedNodeId;
  if (unwrapped !== undefined) emit(unwrapped);
  out.push(...innerWrapperLines(cluster.id, w));
  for (const id of cluster.nodeIds) if (id !== unwrapped) emit(id);
  out.push(...portChainLines(cluster, recs));
  for (const child of childrenOf.get(cluster.id) ?? []) {
    out.push(...clusterBlock(child, childrenOf, recs, nodeById, colors, kermor));
  }
  for (let i = 0; i < closeCount(w); i++) out.push('}');
  // #lizard forgives — faithful port of Cluster/ClusterDotString's nested
  // subgraph emission; the branch count mirrors upstream's cases.
  return out;
}
