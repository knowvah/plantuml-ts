/**
 * Oracle DOT-parity helpers (DOT-level, normalized).
 *
 * Both sides are reduced to one model by the SAME parser: the oracle's
 * `svek-*.dot` is parsed directly; our `DotInputGraph` is first run through the
 * Svek emitter (`toSvekDot`) and then parsed — so the comparison exercises the
 * emitter and is genuinely apples-to-apples. Synthetic ids/colors are ignored;
 * we compare graph attrs, node count + shape multiset, edge topology + minlen +
 * label presence + ENDPOINT PORTS, and cluster membership. `width`/`height` are
 * tolerant metrics (Java vs plantuml-ts text measurement) — reported, not
 * asserted.
 *
 * ## Why endpoint ports are compared (object-close, 2026-08-11)
 *
 * `parseEdges` used to discard the `:port` on both endpoints with a
 * NON-capturing `(?::\w+)?`. That made an edge anchored to a member ROW
 * compare equal to one anchored to the whole node — and those are not the same
 * graph. Upstream emits map/json/port-bearing classifiers through
 * `SvekNode#appendLabelHtmlSpecialForLink`
 * (`svek/SvekNode.java:269-311`): `shape=plaintext` wrapping an HTML table with
 * one `<TR PORT="p<md5>">` per member row, and edges anchored to those specific
 * rows. This port emits a 3×3 shield table with a single `PORT="h"` and every
 * edge as `shNNNN:h`. The old comparison scored that EQUAL.
 *
 * Measured when the blindness was found: **20 object and 22 class fixtures**
 * were being reported structurally EQUAL while emitting a materially different
 * graph. `state` and the description family are unaffected — no description
 * golden uses a row port at all.
 *
 * Comparing the port id verbatim is the correct bar, not an over-specification:
 * upstream builds it as `"p" + SignatureUtils.getMD5Hex(portName)`
 * (`svek/Ports.java:53-55`), a pure function of the member text, so a faithful
 * port reproduces the same hash. `-` stands for an endpoint with no port at
 * all, which is itself a meaningful difference from `h`.
 *
 * Svek DOT is graphviz-emitter-regular, so focused regexes suffice rather than a
 * full DOT grammar. Clusters use a brace-stack scan that normalizes Svek's
 * protection nesting (clusterNp0/clusterN/clusterNp1) to the logical `clusterN`.
 */
import type { DotInputGraph } from '../../src/core/graph-layout.js';
import { toSvekDot } from '../../src/core/svek-dot-emit.js';

export interface StructuralNode {
  id: string;
  shape: string;
  width: number; // inches
  height: number;
}
export interface StructuralEdge {
  from: string;
  to: string;
  /** Tail endpoint port (`shNNNN:<port>`), or undefined when the edge anchors
   *  to the whole node. See this module's doc comment for why it is compared. */
  fromPort: string | undefined;
  /** Head endpoint port; same contract as {@link StructuralEdge.fromPort}. */
  toPort: string | undefined;
  minlen: number;
  hasLabel: boolean;
  hasTailLabel: boolean;
  hasHeadLabel: boolean;
  hasXLabel: boolean;
  /** `sametail=<entNNNN>` — graphviz groups every edge sharing this value
   *  onto ONE tail point, so an edge that carries it is a different graph
   *  from one that does not. Compared as a sorted multiset of VALUES (not a
   *  count): the value is the tail entity's uid, so two groups collapsing
   *  onto the wrong tails would compare equal by count alone. Was invisible
   *  to this comparator until 2026-08-13 — see
   *  `.agent-notes/si17-sametail-gate-blindness.md`. */
  sametail: string | undefined;
  /** `constraint=false` — the edge is drawn but takes no part in rank
   *  assignment, so its presence changes the whole rank structure (measured:
   *  omitting it on `class/kupetu-36-kive480` adds an entire rank). Detected
   *  by PRESENCE, deliberately not via `attr` above: that helper accepts only
   *  numeric values and would return undefined for `constraint=false` on BOTH
   *  sides — the exact vacuous comparison that hid `sametail`. */
  constraint: boolean;
  /** `style=invis` — an invisible edge is still laid out and still constrains
   *  ranks, so its presence is structural, not cosmetic. Present on 166
   *  corpus fixtures and compared by nothing until 2026-08-13; closing it was
   *  blocked on a real divergence (we conflated `-[hidden]-` with `invis`,
   *  which upstream keeps as separate fields), fixed in
   *  `description/link-edge-attrs.ts`. */
  invis: boolean;
}
export interface StructuralCluster {
  memberCount: number;
  labelW: number | undefined;
  labelH: number | undefined;
}
export interface StructuralGraph {
  nodes: StructuralNode[];
  edges: StructuralEdge[];
  clusters: StructuralCluster[];
  nodesep: number | undefined;
  ranksep: number | undefined;
  remincross: boolean;
  searchsize: number | undefined;
  rankdir: string | undefined;
}

const attr = (attrs: string, name: string): string | undefined =>
  new RegExp(`\\b${name}=([0-9.]+)`).exec(attrs)?.[1];

/** `attr` above only accepts a NUMERIC value, so it silently returns
 *  undefined for `sametail=ent0001` — on BOTH sides, which made an early
 *  version of the sametail check compare [] against [] and pass no matter
 *  what. Identifier-valued attrs need their own extractor. */
const identAttr = (attrs: string, name: string): string | undefined =>
  new RegExp(`\\b${name}=([A-Za-z_][A-Za-z0-9_]*)`).exec(attrs)?.[1];

const numAttr = (dot: string, name: string): number | undefined => {
  const v = new RegExp(`(?:^|\\n|\\s)${name}=([0-9.]+)`).exec(dot)?.[1];
  return v === undefined ? undefined : Number(v);
};

/** Node shape, normalizing `shape=rect,style=rounded` to `rounded`. */
function nodeShape(attrs: string): string {
  const shape = /\bshape=(\w+)/.exec(attrs)?.[1] ?? 'rect';
  return shape === 'rect' && /\bstyle=rounded\b/.test(attrs) ? 'rounded' : shape;
}

function parseEdges(dot: string): StructuralEdge[] {
  const edges: StructuralEdge[] = [];
  // Both ports are CAPTURED, not discarded — see this module's doc comment.
  const edgeRe = /(\w+)(?::(\w+))?\s*->\s*(\w+)(?::(\w+))?\s*\[([^\]]*)\]/g;
  for (let m = edgeRe.exec(dot); m !== null; m = edgeRe.exec(dot)) {
    const a = m[5]!;
    edges.push({
      from: m[1]!,
      to: m[3]!,
      fromPort: m[2],
      toPort: m[4],
      minlen: Number(attr(a, 'minlen') ?? '1'),
      hasLabel: /(?:^|,)label=</.test(a),
      hasTailLabel: /taillabel=</.test(a),
      hasHeadLabel: /headlabel=</.test(a),
      hasXLabel: /(?:^|,)xlabel=</.test(a),
      sametail: identAttr(a, 'sametail'),
      constraint: /\bconstraint=false\b/.test(a),
      invis: /\bstyle=invis\b/.test(a),
    });
  }
  return edges;
}

function parseNodes(dot: string): StructuralNode[] {
  // Drop edge spans first so an edge's `[...]` is never reparsed as a node.
  const withoutEdges = dot.replace(/(\w+)(?::\w+)?\s*->\s*(\w+)(?::\w+)?\s*\[[^\]]*\]/g, '');
  const nodes: StructuralNode[] = [];
  // Dedupe by node id, keeping the first-seen declaration: the oracle's
  // -DPLANTUML_DUMP_DOT output legitimately re-declares a node once per link
  // group it participates in (e.g. xamule-03-jeda376's sh0021/sh0022) — our
  // candidate never duplicates, so counting every declaration line
  // double-counts the oracle side only.
  const seen = new Set<string>();
  const nodeRe = /(\w+)\s*\[(shape=[^\]]*)\]/g;
  for (let m = nodeRe.exec(withoutEdges); m !== null; m = nodeRe.exec(withoutEdges)) {
    const id = m[1]!;
    if (seen.has(id)) continue;
    seen.add(id);
    const a = m[2]!;
    nodes.push({
      id,
      shape: nodeShape(a),
      width: Number(attr(a, 'width') ?? '0'),
      height: Number(attr(a, 'height') ?? '0'),
    });
  }
  return nodes;
}

interface ClusterFrame {
  name: string;
  members: Set<string>;
  labelW: number | undefined;
  labelH: number | undefined;
}

/** Brace-stack scan: logical clusters are subgraphs named exactly `clusterN`
 *  (Svek's protection wrappers clusterNp0/p1/a/i are skipped); a cluster's
 *  members are all leaf node ids in its subtree; its label is its title TABLE. */
function parseClusters(dot: string): StructuralCluster[] {
  const tokenRe =
    /subgraph\s+(\w+)\s*\{|(\})|label=<<TABLE[^>]*?WIDTH="(\d+)"\s+HEIGHT="(\d+)"|(\w+)\s*\[shape=/g;
  const stack: ClusterFrame[] = [];
  const out: StructuralCluster[] = [];
  for (let m = tokenRe.exec(dot); m !== null; m = tokenRe.exec(dot)) {
    const top = stack[stack.length - 1];
    if (m[1] !== undefined) {
      stack.push({ name: m[1], members: new Set(), labelW: undefined, labelH: undefined });
    } else if (m[2] !== undefined) {
      const f = stack.pop();
      if (f === undefined) continue;
      const parent = stack[stack.length - 1];
      if (parent !== undefined) for (const id of f.members) parent.members.add(id);
      if (/^cluster\d+$/.test(f.name)) {
        out.push({ memberCount: f.members.size, labelW: f.labelW, labelH: f.labelH });
      }
    } else if (m[3] !== undefined) {
      if (top !== undefined && top.labelW === undefined) {
        top.labelW = Number(m[3]);
        top.labelH = Number(m[4]);
      }
    } else if (m[5] !== undefined && top !== undefined) {
      top.members.add(m[5]);
    }
  }
  return out;
}

/** Parse Svek DOT (oracle or our own emission) into the structural model. */
export function parseSvekDot(dot: string): StructuralGraph {
  return {
    nodes: parseNodes(dot),
    edges: parseEdges(dot),
    clusters: parseClusters(dot),
    nodesep: numAttr(dot, 'nodesep'),
    ranksep: numAttr(dot, 'ranksep'),
    remincross: /remincross=true/.test(dot),
    searchsize: numAttr(dot, 'searchsize'),
    rankdir: /rankdir=(\w+)/.exec(dot)?.[1],
  };
}

/** Project plantuml-ts's layout input through the emitter, then parse — so the
 *  candidate model is exactly what our Svek DOT says (and the emitter is tested). */
export function dotInputToStructural(input: DotInputGraph): StructuralGraph {
  return parseSvekDot(toSvekDot(input));
}

/** Sorted undirected degree multiset — an id-agnostic topology signature. */
export function degreeSequence(g: StructuralGraph): number[] {
  const deg = new Map<string, number>();
  for (const n of g.nodes) deg.set(n.id, 0);
  for (const e of g.edges) {
    deg.set(e.from, (deg.get(e.from) ?? 0) + 1);
    deg.set(e.to, (deg.get(e.to) ?? 0) + 1);
  }
  return [...deg.values()].sort((a, b) => a - b);
}

/**
 * Sorted `in:out` degree multiset — the DIRECTED analogue of {@link
 * degreeSequence}, and the only orientation-sensitive check in this
 * comparator.
 *
 * B31/M37 (approved 2026-08-11): every other member of `structurallyEqual`
 * is an undirected or order-free signature — `degreeSequence` increments
 * BOTH endpoints and sorts, and minlens/shapes/ports/cluster-sizes are
 * sorted multisets — so reversing `a -> b` to `b -> a` left all eleven
 * checks invariant. Edge ORIENTATION was therefore invisible to this gate
 * for its whole life, which is how M7 (`class-arrow-grammar.ts`'s
 * decor-driven endpoint swap) survived in 116 of 722 class fixtures while
 * they scored EQUAL. See `plans/object-close/ledger.md` B31.
 *
 * Node ids are synthetic and deliberately never compared (the same reason
 * `degreeSequence` and `sortedPorts` are id-agnostic), so direction is
 * captured as each node's own (indegree, outdegree) pair rather than by
 * matching endpoints: a reversal moves a node from `1:0` to `0:1` and its
 * partner the other way, which no sorting can hide. A graph whose every
 * node has equal in- and out-degree is genuinely indistinguishable under
 * reversal at this resolution — that is a real limit of an id-agnostic
 * comparison, not a gap this closes.
 */
const degreeSequenceDirected = (g: StructuralGraph): string[] => {
  const inDeg = new Map<string, number>();
  const outDeg = new Map<string, number>();
  for (const n of g.nodes) {
    inDeg.set(n.id, 0);
    outDeg.set(n.id, 0);
  }
  for (const e of g.edges) {
    outDeg.set(e.from, (outDeg.get(e.from) ?? 0) + 1);
    inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
  }
  const ids = new Set([...inDeg.keys(), ...outDeg.keys()]);
  return [...ids].map((id) => `${inDeg.get(id) ?? 0}:${outDeg.get(id) ?? 0}`).sort();
};

const eqNum = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);
const eqStr = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const sortedShapes = (g: StructuralGraph): string[] => g.nodes.map((n) => n.shape).sort();
const sortedMinlens = (g: StructuralGraph): number[] => g.edges.map((e) => e.minlen).sort((a, b) => a - b);
const labelCounts = (g: StructuralGraph): [number, number, number, number] => [
  g.edges.filter((e) => e.hasLabel).length,
  g.edges.filter((e) => e.hasTailLabel).length,
  g.edges.filter((e) => e.hasHeadLabel).length,
  g.edges.filter((e) => e.hasXLabel).length,
];
/** How many edges carry `constraint=false` and `style=invis`. Counts rather
 *  than multisets because neither attribute has a value — only presence. */
const flagCounts = (g: StructuralGraph): number[] => [
  g.edges.filter((e) => e.constraint).length,
  g.edges.filter((e) => e.invis).length,
];

/** Sorted multiset of the `sametail` VALUES present, absent edges skipped. */
const sortedSametails = (g: StructuralGraph): string[] =>
  g.edges.map((e) => e.sametail).filter((v): v is string => v !== undefined).sort();

const sortedClusterSizes = (g: StructuralGraph): number[] =>
  g.clusters.map((c) => c.memberCount).sort((a, b) => a - b);

/** Sorted multiset of every edge ENDPOINT's port id, `-` for "no port". Node
 *  ids are synthetic and deliberately not compared, so the ports are gathered
 *  id-agnostically, exactly like {@link degreeSequence}. */
const sortedPorts = (g: StructuralGraph): string[] =>
  g.edges.flatMap((e) => [e.fromPort ?? '-', e.toPort ?? '-']).sort();

/** Epsilon for numeric graph-attr comparisons: both sides print 6-decimal inches. */
const NUM_ATTR_EPSILON = 1e-6;

/** Node width/height are `conformant` when every dimension is within this many
 *  inches of the oracle (the graded `conformant` bar from planning/
 *  conformance.md). Reported as `sizeConformantOk`; deliberately NOT folded
 *  into `structurallyEqual`, which stays a structure-only gate (sizes are
 *  ratcheted separately via oracle/goldens/<type>/size-backlog.json). */
export const SIZE_CONFORMANCE_TOLERANCE_IN = 0.01;

/** absent==absent equal; absent vs present mismatch; else numeric within epsilon. */
function numAttrOk(a: number | undefined, b: number | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return Math.abs(a - b) < NUM_ATTR_EPSILON;
}

/** rankdir: textual equality; absent==absent equal (svek omits it for the TB
 *  default — do NOT treat absent as equal to the literal string "TB"). */
function rankdirOk(a: string | undefined, b: string | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return a === b;
}

export interface StructuralDiff {
  nodeCountOk: boolean;
  edgeCountOk: boolean;
  degreeOk: boolean;
  minlenOk: boolean;
  /** `sametail` values match as a sorted multiset — see
   *  {@link StructuralEdge.sametail}. */
  sametailOk: boolean;
  /** `constraint=false` and `style=invis` edge counts match — see
   *  {@link StructuralEdge.constraint} / {@link StructuralEdge.invis}. */
  constraintOk: boolean;
  shapeOk: boolean;
  labelOk: boolean;
  /** Edge endpoint ports match as a sorted multiset. Anchoring an edge to a
   *  member ROW is a different graph from anchoring it to the whole node —
   *  see this module's doc comment for the measured blindness this closes. */
  portOk: boolean;
  clusterOk: boolean;
  /** Edge ORIENTATION matches, as a sorted `in:out` degree multiset — see
   *  {@link degreeSequenceDirected} for why this is not covered by
   *  `degreeOk`, which is undirected. B31. */
  directionOk: boolean;
  /** rankdir: textual equality; absent==absent equal; absent vs present mismatches. */
  rankdirOk: boolean;
  /** nodesep: numeric equality (epsilon 1e-6); absent==absent equal. */
  nodesepOk: boolean;
  /** ranksep: numeric equality (epsilon 1e-6); absent==absent equal. */
  ranksepOk: boolean;
  /** All structural checks hold — the DOT-level parity bar (ids/colors/sizes excluded). */
  structurallyEqual: boolean;
  /** Node width/height all within SIZE_CONFORMANCE_TOLERANCE_IN of the oracle
   *  (the `conformant` size bar). Independent of `structurallyEqual` — a graph
   *  can be structurally equal but size-non-conformant (the S1L tail). */
  sizeConformantOk: boolean;
  oracle: { nodes: number; edges: number; degree: number[]; clusters: number };
  candidate: { nodes: number; edges: number; degree: number[]; clusters: number };
  /** Tolerant metric note: largest single node-dimension delta (inches). */
  maxSizeDeltaIn: number;
  /** Tolerant metric note: median single node-dimension delta (inches). */
  medianSizeDeltaIn: number;
  attrs: {
    oracle: [number | undefined, number | undefined];
    candidate: [number | undefined, number | undefined];
  };
}

/** Sorted, paired per-index abs deltas of node width+height (inches), same
 *  pairing logic used by both maxSizeDelta and medianSizeDelta. */
function sizeDeltas(oracle: StructuralGraph, candidate: StructuralGraph): number[] {
  const sizes = (g: StructuralGraph): number[] =>
    [...g.nodes.map((n) => n.width), ...g.nodes.map((n) => n.height)].sort((a, b) => a - b);
  const os = sizes(oracle);
  const cs = sizes(candidate);
  const deltas: number[] = [];
  for (let i = 0; i < Math.min(os.length, cs.length); i++) {
    deltas.push(Math.abs(os[i]! - cs[i]!));
  }
  return deltas;
}

function maxSizeDelta(oracle: StructuralGraph, candidate: StructuralGraph): number {
  const deltas = sizeDeltas(oracle, candidate);
  return deltas.length === 0 ? 0 : Math.max(...deltas);
}

function medianSizeDelta(oracle: StructuralGraph, candidate: StructuralGraph): number {
  const deltas = sizeDeltas(oracle, candidate).sort((a, b) => a - b);
  if (deltas.length === 0) return 0;
  const mid = Math.floor(deltas.length / 2);
  return deltas.length % 2 === 0 ? (deltas[mid - 1]! + deltas[mid]!) / 2 : deltas[mid]!;
}

export function compareStructural(
  oracle: StructuralGraph,
  candidate: StructuralGraph,
): StructuralDiff {
  const od = degreeSequence(oracle);
  const cd = degreeSequence(candidate);

  const nodeCountOk = oracle.nodes.length === candidate.nodes.length;
  const edgeCountOk = oracle.edges.length === candidate.edges.length;
  const degreeOk = eqNum(od, cd);
  const directionOk = eqStr(degreeSequenceDirected(oracle), degreeSequenceDirected(candidate));
  const minlenOk = eqNum(sortedMinlens(oracle), sortedMinlens(candidate));
  const sametailOk = eqStr(sortedSametails(oracle), sortedSametails(candidate));
  const constraintOk = eqNum(flagCounts(oracle), flagCounts(candidate));
  const shapeOk = eqStr(sortedShapes(oracle), sortedShapes(candidate));
  const labelOk = eqNum(labelCounts(oracle), labelCounts(candidate));
  const portOk = eqStr(sortedPorts(oracle), sortedPorts(candidate));
  const clusterOk = eqNum(sortedClusterSizes(oracle), sortedClusterSizes(candidate));
  const rdOk = rankdirOk(oracle.rankdir, candidate.rankdir);
  const nsOk = numAttrOk(oracle.nodesep, candidate.nodesep);
  const rsOk = numAttrOk(oracle.ranksep, candidate.ranksep);
  const maxDelta = maxSizeDelta(oracle, candidate);

  return {
    nodeCountOk,
    edgeCountOk,
    degreeOk,
    directionOk,
    minlenOk,
    sametailOk,
    constraintOk,
    shapeOk,
    labelOk,
    portOk,
    clusterOk,
    rankdirOk: rdOk,
    nodesepOk: nsOk,
    ranksepOk: rsOk,
    structurallyEqual:
      nodeCountOk &&
      edgeCountOk &&
      degreeOk &&
      directionOk &&
      minlenOk &&
      sametailOk &&
      constraintOk &&
      shapeOk &&
      labelOk &&
      portOk &&
      clusterOk &&
      rdOk &&
      nsOk &&
      rsOk,
    sizeConformantOk: maxDelta <= SIZE_CONFORMANCE_TOLERANCE_IN,
    oracle: {
      nodes: oracle.nodes.length,
      edges: oracle.edges.length,
      degree: od,
      clusters: oracle.clusters.length,
    },
    candidate: {
      nodes: candidate.nodes.length,
      edges: candidate.edges.length,
      degree: cd,
      clusters: candidate.clusters.length,
    },
    maxSizeDeltaIn: maxDelta,
    medianSizeDeltaIn: medianSizeDelta(oracle, candidate),
    attrs: {
      oracle: [oracle.nodesep, oracle.ranksep],
      candidate: [candidate.nodesep, candidate.ranksep],
    },
  };
}
