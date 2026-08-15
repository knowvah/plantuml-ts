// Svek ColorSequence assignment — the pre-pass that fixes every `sh####` id
// and `color="#……"` back-reference tag before a single line is emitted.
//
// Split out of svek-dot-emit.ts (500-line cap). It exists because upstream
// consumes its counter at object CONSTRUCTION time, while a serializer
// naturally consumes it at emission time — and those are different orders, so
// doing it inline produced ids that never matched the oracle's.
//
// Upstream's order (GraphvizImageBuilder.java, Cluster.java, SvekEdge.java):
//
//   1. root Cluster ctor                      -- 4 values
//      (CucaDiagramFileMaker.java:59 -> Cluster.java:162-165: color,
//       colorTitle, colorNoteTop, colorNoteBottom)
//   2. printGroups(rootGroup)                 -- GraphvizImageBuilder.java:226
//        per group, depth-first (printGroup, :429-433):
//          openCluster(g)                     -- 4 values
//          printEntities(g.leafs())           -- 1 value per leaf
//          printGroups(g)                     -- recurse
//   3. printEntities(unpackagedEntities)      -- :227, 1 per top-level leaf
//   4. SvekEdge ctor                          -- 4 per edge
//      (SvekEdge.java:275-278: lineColor, noteLabelColor, startTailColor,
//       endHeadColor -- reserved UNCONDITIONALLY, whether or not the edge
//       carries any label)
//
// The two orders are ASYMMETRIC and that asymmetry is load-bearing: the ROOT
// does groups-then-leaves (:226-227), while a NESTED group does
// leaves-then-groups (:431-433). Getting that backwards misnumbers every
// fixture that has both a container and a top-level element.
//
// Verified against four goldens before this was written --
// plans/s1l-tail-fix/findings/svek-node-id-alignment.md carries the
// predictions and the oracle values they were checked against.

import type {
  DotInputCluster,
  DotInputGraph,
  DotInputNode,
} from './graph-layout.types.js';

/** Svek's ColorSequence: a counter whose value is both the `sh####` id suffix
 *  and the `color="#……"` back-reference tag. Upstream's first value is 2. */
export class Seq {
  private n = 1;
  next(): number {
    this.n += 1;
    return this.n;
  }
}

const shId = (n: number): string => 'sh' + String(n).padStart(4, '0');

export interface NodeRec {
  readonly sh: string;
  readonly color: number;
}

/** `Cluster.java:162-165` — four values per cluster, root included. Only
 *  `color` and `title` reach the emitted DOT; `noteTop`/`noteBottom` are
 *  RESERVED but unused, exactly as upstream reserves them for note placement
 *  it may never draw. Dropping them would shift every subsequent id. */
export interface ClusterColors {
  readonly color: number;
  readonly title: number;
  readonly noteTop: number;
  readonly noteBottom: number;
}

/** `SvekEdge.java:275-278` — four per edge, reserved unconditionally. */
export interface EdgeColors {
  readonly line: number;
  readonly noteLabel: number;
  readonly startTail: number;
  readonly endHead: number;
}

export interface ClusterTree {
  clusteredIds: Set<string>;
  childrenOf: Map<string | undefined, DotInputCluster[]>;
}

export function buildClusterTree(clusters: DotInputCluster[]): ClusterTree {
  const clusteredIds = new Set(clusters.flatMap((c) => c.nodeIds));
  const childrenOf = new Map<string | undefined, DotInputCluster[]>();
  for (const c of clusters) {
    const arr = childrenOf.get(c.parentId) ?? [];
    arr.push(c);
    childrenOf.set(c.parentId, arr);
  }
  return { clusteredIds, childrenOf };
}

export interface SeqAssignment {
  readonly recs: Map<string, NodeRec>;
  readonly nodeById: Map<string, DotInputNode>;
  readonly clusterColors: Map<string, ClusterColors>;
  /** Parallel to `input.edges`. */
  readonly edgeColors: readonly EdgeColors[];
}

const reserveCluster = (seq: Seq): ClusterColors => ({
  color: seq.next(),
  title: seq.next(),
  noteTop: seq.next(),
  noteBottom: seq.next(),
});

const reserveEdge = (seq: Seq): EdgeColors => ({
  line: seq.next(),
  noteLabel: seq.next(),
  startTail: seq.next(),
  endHead: seq.next(),
});

/**
 * G9/T3: the group's special point is NOT an entity, so it consumes no
 * ColorSequence value and carries no `sh####` id. Jar synthesizes its DOT id
 * as `Cluster.CENTER_ID + group.getUid()` = `"za" + "ent####"`
 * (`Cluster.java:104,653-654`), and declares it either as the `za` anchor
 * point (`ClusterDotString.java:148-149`) or as the `empty()` title-table
 * placeholder (`:179-183`) — the same id in both cases (`:220-226`).
 *
 * `DotInputGraph` models the anchor as an ordinary node, so before this it
 * took an `sh` number of its own and shifted every id and color after it by
 * one (`banatu-09-koce254`: our `sh0011`/`#00000b` against jar's
 * `zaent0001`/`#000007`, and every later id off by the count of anchors).
 *
 * The numeric suffix is allocated here, in cluster-walk order, and does NOT
 * reproduce jar's: jar takes it from the diagram-wide entity uid sequence
 * (`EntityBase#getUid`, which numbers leaves too — hence its `zaent0004` where
 * the first cluster's anchor would be ours), and `DotInputGraph` does not
 * carry entity uids. Only the id's FORM is structural; `tests/oracle/
 * svek-dot.ts` compares shapes, counts and degrees, never id text.
 */
const zaId = (n: number): string => 'zaent' + String(n).padStart(4, '0');

/** The node ids that are group anchors rather than entities: jar's `za` point
 *  (`unwrappedNodeId`) and its `empty()` placeholder (`portAnchorId`), mapped
 *  to the cluster that owns them. */
function anchorOwners(clusters: readonly DotInputCluster[]): Map<string, string> {
  const owners = new Map<string, string>();
  for (const c of clusters) {
    for (const id of [c.unwrappedNodeId, c.portAnchorId]) {
      if (id !== undefined && !owners.has(id)) owners.set(id, c.id);
    }
  }
  return owners;
}

interface SeqOut {
  recs: Map<string, NodeRec>;
  nodeById: Map<string, DotInputNode>;
  clusterColors: Map<string, ClusterColors>;
  /** node id → owning cluster id, for anchors only (see {@link anchorOwners}). */
  anchorOf: Map<string, string>;
  /** Anchors met so far, in walk order — their `zaent####` suffix. */
  zaCount: number;
}

/** `printEntities` — one value per leaf, in declaration order. Anchors take a
 *  `za` id and their cluster's TITLE color instead: jar's `empty()` label
 *  table is built from `cluster.getTitleColor()` (`ClusterDotString.java:
 *  123-127,179-181`), which is what `banatu-09-koce254`'s `BGCOLOR="#000007"`
 *  is — cluster6's title, not a value of the anchor's own. */
function assignNodes(ids: readonly string[], out: SeqOut, seq: Seq): void {
  for (const id of ids) {
    if (!out.nodeById.has(id) || out.recs.has(id)) continue;
    const ownerId = out.anchorOf.get(id);
    if (ownerId !== undefined) {
      out.zaCount += 1;
      out.recs.set(id, { sh: zaId(out.zaCount), color: out.clusterColors.get(ownerId)?.title ?? 0 });
      continue;
    }
    const color = seq.next();
    out.recs.set(id, { sh: shId(color), color });
  }
}

/** `printGroup` — openCluster (4), then this group's OWN leaves, then recurse
 *  into child groups. Leaves-before-groups: the nested order. */
function walkCluster(cluster: DotInputCluster, tree: ClusterTree, out: SeqOut, seq: Seq): void {
  out.clusterColors.set(cluster.id, reserveCluster(seq));
  assignNodes(cluster.nodeIds, out, seq);
  for (const child of tree.childrenOf.get(cluster.id) ?? []) {
    walkCluster(child, tree, out, seq);
  }
}

/**
 * Assign every id/color in upstream's construction order (see file header).
 *
 * Order here is the entire point — do not "simplify" it into a single pass
 * over `input.nodes`. That is exactly what this replaces.
 */
export function assignSequence(input: DotInputGraph, tree: ClusterTree): SeqAssignment {
  const seq = new Seq();
  const recs = new Map<string, NodeRec>();
  const nodeById = new Map<string, DotInputNode>();
  const clusterColors = new Map<string, ClusterColors>();
  for (const n of input.nodes) nodeById.set(n.id, n);

  // 1. root Cluster ctor, before anything else.
  reserveCluster(seq);

  // 2. printGroups(rootGroup) — groups BEFORE the root's own leaves.
  const out: SeqOut = {
    recs,
    nodeById,
    clusterColors,
    anchorOf: anchorOwners(input.clusters ?? []),
    zaCount: 0,
  };
  for (const top of tree.childrenOf.get(undefined) ?? []) walkCluster(top, tree, out, seq);

  // 3. printEntities(getUnpackagedEntities()).
  assignNodes(
    input.nodes.filter((n) => !tree.clusteredIds.has(n.id)).map((n) => n.id),
    out,
    seq,
  );

  // 4. SvekEdge ctors, last. Because edges come after every node and cluster,
  //    their reservation cannot perturb a single `sh####` id — but it is
  //    reserved faithfully so edge colors line up too.
  const edgeColors = input.edges.map(() => reserveEdge(seq));

  return { recs, nodeById, clusterColors, edgeColors };
}
