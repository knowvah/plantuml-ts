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

import type { DotInputEdge, DotInputGraph, DotInputNode } from './graph-layout.types.js';
import { dotSplinesAttrs } from './dot-splines.js';
import {
  assignSequence,
  buildClusterTree,
  type ClusterTree,
  type EdgeColors,
  type NodeRec,
  type SeqAssignment,
} from './svek-dot-sequence.js';
// B1/M1: the HTML label-table builders moved to a sibling module for the
// 500-line file cap (pure move -- see that file's header).
import { hex, edgeLabelTable } from './svek-dot-emit-labels.js';
// G9/T1: the node lines and cluster blocks moved to a sibling module for the
// same file cap (see that file's header) — this file keeps the graph
// attributes, the edge lines and the top-level assembly.
import { clusterBlock, inches, nodeLine } from './svek-dot-emit-clusters.js';
// G9/T1: jar's `a`/`p0`/`i`/`p1` protection-wrapper conditions, shared with the
// LAYOUT builder, which has built this same nesting since G7 T7 — see that
// file's header for the upstream derivation and for why both consumers must
// read the SAME fields.
import { wrapperLevels, type WrapperLevels } from './svek-dot-wrappers.js';

// Re-exported so callers keep reaching these through the emitter's own module
// path: `inches` for the LAYOUT builder (`graph-layout-build.ts#addNodes`), and
// the wrapper conditions for the `wrapper-parity` fitness test, which checks
// the DOT-text path against the builder's.
export { inches, wrapperLevels, type WrapperLevels };

const MIN_NODESEP_PX = 35; // Svek getMinNodeSep() (non-activity)
const MIN_RANKSEP_PX = 60; // Svek getMinRankSep() (non-activity)
/** DotStringFactory.getMinRankSep():247-249 — `!pragma kermor on` floors
 *  ranksep at 40px instead of 60px. getMinNodeSep() never checks kermor, so
 *  nodesep's 35px floor is unaffected (see also getVerticalDzeta's ÷100
 *  divisor, applied upstream in description/link-edge-attrs.ts). */
const MIN_RANKSEP_PX_KERMOR = 40;

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
  // DotStringFactory.java:161-169 — two `sb.append`s before ONE `println`
  // for the ortho arm, so both pairs join into a single DOT line (D2).
  const splines = dotSplinesAttrs(input.linetype);
  if (splines.length > 0) {
    lines.push(splines.map(([k, v]) => `${k}=${v};`).join(''));
  }
  if (input.rankDir === 'LR') lines.push('rankdir=LR;');
  return lines;
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
  // Order is load-bearing for the byte-comparison against the oracle DOT:
  // `SvekEdge.java:470-479` emits style=invis, then constraint=false, then
  // sametail, in exactly this sequence.
  if (a.invis === true) parts.push('style=invis');
  if (a.constraint === false) parts.push('constraint=false');
  if (a.sametail !== undefined) parts.push(`sametail=${a.sametail}`);
  return `${fromSh}->${toSh}[${parts.join(',')}];`;
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

/**
 * `Bibliotekon#addLine`'s two global edge batches: `lines0` is every edge with
 * `first(line)` — jar's `link.getLength() == 1`, which reaches this port as
 * `minLen === 0` — and `lines1` is the rest
 * (`~/git/plantuml/.../svek/Bibliotekon.java:89-114`). `DotStringFactory
 * #createDotString` prints `lines0` BEFORE any node's shape line or cluster
 * subgraph and `lines1` after all cluster content (`:187-198`), which is what
 * makes a `lines0` endpoint the first node graphviz's parser creates — and so
 * the root of the cycle-breaking DFS that runs before ranking
 * (`graph-layout-build.ts#firstEncounterOrder` has the full derivation, and
 * mirrors this same split on the layout path).
 *
 * Deliberately not ported: `addLine`'s own tie-break inside `lines0`, which
 * moves a note-labelled edge ahead of the first same-connections unlabelled
 * one (`:90-99`). No cached fixture's `lines0` order differs from the input
 * edge order because of it — `temuxi-28-cega322`'s seven-edge batch matches
 * jar's exactly — so it is an unexercised residual, recorded rather than
 * guessed at.
 */
function edgeBatches(input: DotInputGraph): { lines0: number[]; lines1: number[] } {
  const lines0: number[] = [];
  const lines1: number[] = [];
  input.edges.forEach((e, i) => (e.attributes?.minLen === 0 ? lines0 : lines1).push(i));
  return { lines0, lines1 };
}

function emitBody(input: DotInputGraph, seqs: SeqAssignment, tree: ClusterTree): string[] {
  const { recs, nodeById, clusterColors, edgeColors } = seqs;
  const body = [...graphAttrLines(input)];
  const kermor = input.kermor === true;
  const unclustered = input.nodes.filter((n) => !tree.clusteredIds.has(n.id));
  const { lines0, lines1 } = edgeBatches(input);
  const emitEdges = (indices: readonly number[]): void => {
    for (const i of indices) {
      const e = input.edges[i]!;
      if (!recs.has(e.from) || !recs.has(e.to)) continue;
      const from = edgeRef(e.from, recs, nodeById, e.attributes?.tailport);
      const to = edgeRef(e.to, recs, nodeById, e.attributes?.headport);
      body.push(edgeLine(e, from, to, edgeColors[i]!));
    }
  };
  // Under kermor BOTH batches print first, before any content
  // (DotStringFactory.java:178-185); otherwise only `lines0` does, and
  // `lines1` closes the file (`:187-198`).
  emitEdges(kermor ? [...lines0, ...lines1] : lines0);
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
  if (!kermor) emitEdges(lines1);
  return body;
}

/** Serialize a DotInputGraph to Svek-shaped DOT text. */
export function toSvekDot(input: DotInputGraph): string {
  const tree = buildClusterTree(input.clusters ?? []);
  const body = emitBody(input, assignSequence(input, tree), tree);
  return `digraph unix {\n${body.join('\n')}\n}\n`;
}
