/**
 * The order Svek's DOT text declares nodes in — the single definition of
 * "which node does graphviz's parser meet first", shared by the two consumers
 * of one `DotInputGraph`.
 *
 * `DotStringFactory#createDotString` interleaves node and cluster declarations
 * with two global edge batches (`:187-198`): `lines0` (jar's
 * `link.getLength() == 1`, this port's `minLen === 0`) prints BEFORE any node
 * shape line or cluster subgraph, then the root's own leaves, then each
 * cluster's block, then `lines1`. In real DOT text a `lines0` statement
 * IMPLICITLY creates its endpoints the moment the parser reaches it, and a
 * `{rank=…;a;b;}` group does the same for the ids it names — so the textual
 * order and the node-creation order are not the same list.
 *
 * That creation order is load-bearing: graphviz's cycle-breaking DFS
 * (`~/git/graphviz/lib/dotgen/acyclic.c`, run before rank assignment) roots at
 * the FIRST node created, so it can pick a different back-edge for any pass
 * whose edge set contains a cycle. G7 T16 established this and ported the
 * `lines0` half of it (jar-verified on `pesita-10-dene726`, whose 4-node cycle
 * produced a >2.5x-too-tall cluster bbox from the wrong root).
 *
 * G9/T4 completes it. Measured across the cached corpus BEFORE this change,
 * the first node created by our layout builder differed from jar's on 172 of
 * 1365 graphs — state 77, class 52, component 30, usecase 12, object 1 — the
 * bulk of them clusters, where jar's text declares a group's `za` anchor and
 * the root's own leaves before any wrapped cluster member, and our builder
 * declared `input.nodes` in array order.
 *
 * `svek-dot-emit.ts` writes exactly this order as text and this module
 * reproduces it as a list; `tests/oracle/declaration-order-parity.test.ts`
 * asserts the two agree over the whole corpus, because four prior defects in
 * this area were divergences between those two consumers.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java:178-199
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:135-184,254-287
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Bibliotekon.java:89-114
 */

import type { DotInputCluster, DotInputGraph, DotInputNode } from './graph-layout.types.js';
import { buildClusterTree } from './svek-dot-sequence.js';

/** Collector: appends an id the first time it is seen, ignoring ids that are
 *  not real nodes (a dangling edge endpoint, or a `portAnchorId` naming a
 *  node this graph never materialized). */
class Encounter {
  readonly order: string[] = [];
  private readonly seen = new Set<string>();
  constructor(private readonly nodeById: ReadonlyMap<string, DotInputNode>) {}
  push(id: string | undefined): void {
    if (id === undefined || this.seen.has(id) || !this.nodeById.has(id)) return;
    this.seen.add(id);
    this.order.push(id);
  }
  isPort(id: string): boolean {
    return this.nodeById.get(id)?.isPort === true;
  }
}

interface WalkCtx {
  enc: Encounter;
  childrenOf: Map<string | undefined, DotInputCluster[]>;
  kermor: boolean;
}

/** The ids a cluster's `{rank=…;…}` groups name, in group order. `rank`
 *  narrows to one kind (kermor emits source and sink at different points);
 *  omit it for `ClusterDotString.printRanks`, which emits both up front. */
function rankIds(c: DotInputCluster, rank?: 'source' | 'sink'): string[] {
  return (c.portRanks ?? [])
    .filter((r) => rank === undefined || r.rank === rank)
    .flatMap((r) => r.nodeIds);
}

/** `ClusterDotStringKermor.printRanks` (`:231-245`): the `{rank=X;…}` group
 *  names its ids, then each gets its own shape line — so the group is where
 *  they are created. Source ranks precede `gamma`, sink ranks follow the
 *  children (`Cluster.java:595-609`). */
function pushKermorCluster(c: DotInputCluster, ctx: WalkCtx): void {
  const portIds = new Set(rankIds(c));
  for (const id of rankIds(c, 'source')) ctx.enc.push(id);
  for (const id of c.nodeIds.filter((id) => !portIds.has(id))) ctx.enc.push(id);
  for (const child of ctx.childrenOf.get(c.id) ?? []) pushKermorCluster(child, ctx);
  for (const id of rankIds(c, 'sink')) ctx.enc.push(id);
}

/** The ids each `printRanks` call names, in call order: its group's members,
 *  then — on the `hasPort()` branch (`:267-284`) — the `empty()` anchor its
 *  own constraint chain links to. */
function rankBlockIds(c: DotInputCluster): (string | undefined)[] {
  const chained = c.portRanksLabelOnEe !== true;
  return (c.portRanks ?? []).flatMap((r) =>
    chained && r.nodeIds.length > 0 ? [...r.nodeIds, c.portAnchorId] : r.nodeIds,
  );
}

/** `ClusterDotString.printRanks` (`:254-287`) then the `ee` block
 *  (`:135-184`): rank groups name the border/port ids first, then those get
 *  their shape lines, then — on the `hasPort()` branch only — the constraint
 *  chain names `empty()`, then `ee`'s own members and child clusters. */
function pushPortCluster(c: DotInputCluster, ctx: WalkCtx): void {
  // Per rank group, not per cluster: each `printRanks` call emits its OWN
  // chain, so with a source and a sink group the anchor is created by the
  // FIRST group's chain, between the two (`gurive-62-ricu497`'s oracle).
  for (const id of rankBlockIds(c)) ctx.enc.push(id);
  const ports = c.nodeIds.filter((id) => ctx.enc.isPort(id));
  for (const id of [...ports, ...c.nodeIds]) ctx.enc.push(id);
  for (const child of ctx.childrenOf.get(c.id) ?? []) pushCluster(child, ctx);
}

/** One cluster's own declarations, in `ClusterDotString.printInternal` order.
 *  The plain family declares its `za` anchor in the BASE cluster, before the
 *  `i`/`p1` wrappers open (`:148-152`), so it precedes every other member. */
function pushCluster(c: DotInputCluster, ctx: WalkCtx): void {
  if (ctx.kermor) {
    pushKermorCluster(c, ctx);
    return;
  }
  if (c.portRanks !== undefined && c.portRanks.length > 0) {
    pushPortCluster(c, ctx);
    return;
  }
  const unwrapped = c.innerMarginLevels === undefined ? undefined : c.unwrappedNodeId;
  ctx.enc.push(unwrapped);
  for (const id of c.nodeIds) if (id !== unwrapped) ctx.enc.push(id);
  ctx.enc.push(c.portAnchorId);
  for (const child of ctx.childrenOf.get(c.id) ?? []) pushCluster(child, ctx);
}

/**
 * `input.nodes` reordered into the order Svek's DOT text creates them.
 *
 * Under `!pragma kermor on` BOTH edge batches print before any content
 * (`DotStringFactory.java:178-185`), so every `minLen === 0` endpoint still
 * comes first and the `lines1` endpoints follow — but `lines1` endpoints are
 * only created there if they were not already, which for kermor is never the
 * case that matters, since its clusters declare everything afterwards anyway.
 *
 * Deliberately not ported, and the reason the builder's root can still differ
 * from jar's: `Cluster#printCluster1`/`getNodesOrderedTop` (`:195-212,515-523`)
 * bumps a root-direct NORMAL node ahead of `lines0` when it is the tail of an
 * INVERTED edge that is not also length-1. `DotInputEdge` carries no
 * `isInverted` signal, so the condition cannot be evaluated here — the same
 * documented residual G7 T16 recorded, unchanged.
 */
export function firstEncounterOrder(input: DotInputGraph): DotInputNode[] {
  const nodeById = new Map(input.nodes.map((n) => [n.id, n]));
  const enc = new Encounter(nodeById);
  const kermor = input.kermor === true;
  const batch = (wantZero: boolean): void => {
    for (const e of input.edges.filter((e) => (e.attributes?.minLen === 0) === wantZero)) {
      enc.push(e.from);
      enc.push(e.to);
    }
  };
  batch(true);
  if (kermor) batch(false);
  const tree = buildClusterTree(input.clusters ?? []);
  const ctx: WalkCtx = { enc, childrenOf: tree.childrenOf, kermor };
  for (const n of input.nodes) if (!tree.clusteredIds.has(n.id)) enc.push(n.id);
  for (const top of tree.childrenOf.get(undefined) ?? []) pushCluster(top, ctx);
  // Anything the walk could not reach (a cluster id that is not in the tree,
  // a node in no cluster's list) keeps its array position, at the end.
  for (const n of input.nodes) enc.push(n.id);
  return enc.order.map((id) => nodeById.get(id)!);
}
