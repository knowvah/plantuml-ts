/**
 * `!pragma kermor on` cluster nesting for the layout builder -- the
 * `ClusterDotStringKermor.printInternal` shape (`svek/ClusterDotStringKermor.java:67-165`):
 *
 *   [alpha {label=<note TOP table or "">]            only if the group has a TOP or BOTTOM note (:81-100, :145-147)
 *     beta {labelloc=b; label=<note BOTTOM table or "">    always (:102-115)
 *       {rank=source; input ports}                          (:117)
 *       gamma {labelloc=t; style=solid; label=<title table>  always (:126-143)
 *         normal members | `empty` point; child clusters    (`Cluster.printCluster3_forKermor`, Cluster.java:595-609)
 *         {rank=sink; output ports}                         (:153)
 *
 * There is no bare `cluster<N>`, no `p0`/`p1`, no `a`/`i` and no `ee`: kermor
 * never calls `protection0/1` (`:258-265` are unused). `gamma` is the drawn
 * cluster, so it is the subgraph the `ClusterIndex` maps back to the caller's id.
 */

import type { GvGraphBuilder } from '@knowvah/dot-engine';
import type { DotInputCluster, DotInputGraph, DotInputNode } from './graph-layout.types.js';

/** `SvekEdge.appendTable`'s `(int)` casts (`SvekEdge.java:504-507`). */
function noteTable(width: number, height: number): string {
  return `<TABLE FIXEDSIZE="TRUE" WIDTH="${Math.floor(width)}" HEIGHT="${Math.floor(height)}"><TR><TD></TD></TR></TABLE>`;
}

/** Sets `label` to the note's table (`:90-99`, `:104-112`), else the bare `""`. */
function labelWithNote(sub: GvGraphBuilder, note: { width: number; height: number } | undefined): void {
  if (note !== undefined) sub.setHtmlAttr('label', noteTable(note.width, note.height));
}

/** `useAlphaAndBeta()` (`:167-174`): any TOP or BOTTOM note on the group. */
export function kermorHasAlpha(c: DotInputCluster): boolean {
  return c.kermorNotes?.top !== undefined || c.kermorNotes?.bottom !== undefined;
}

/** Which of a group's two kermor note slots a published label box belongs to. */
export type KermorNoteSlot = 'top' | 'bottom';

/**
 * The `DotLayoutResult.clusters` id of a kermor note's label table: `alpha` carries the TOP note's table and
 * `beta` the BOTTOM one (`ClusterDotStringKermor.java:88-99,104-112`). `DotStringFactory.java:454,460` reads
 * their placed polygons (`Cluster.setNoteTopPosition/BottomPosition`); the `#` keeps the id out of every real
 * cluster id's namespace.
 */
export function kermorNoteClusterId(clusterId: string, slot: KermorNoteSlot): string {
  return `${clusterId}#kermor-note-${slot}`;
}

/**
 * Names the engine subgraphs of one kermor group for the result: `gamma` is the drawn cluster (`idByName` maps it
 * to the caller's id), and a note's `alpha` (TOP) / `beta` (BOTTOM) subgraph is published under
 * {@link kermorNoteClusterId} so its label box reaches the caller.
 */
export function registerKermorClusterIds(idByName: Map<string, string>, c: DotInputCluster, outerName: string): void {
  idByName.delete(outerName);
  idByName.set(`${outerName}gamma`, c.id);
  if (c.kermorNotes?.top !== undefined) idByName.set(`${outerName}alpha`, kermorNoteClusterId(c.id, 'top'));
  if (c.kermorNotes?.bottom !== undefined) idByName.set(`${outerName}beta`, kermorNoteClusterId(c.id, 'bottom'));
}

/** The `main`/`innermost` pair `addClusters` threads; both are `gamma` here. */
interface ClusterHandlesLike {
  main: GvGraphBuilder;
  innermost: GvGraphBuilder;
}

/** Builds alpha?/beta/gamma for `c`; returns `{ main, innermost }` both = `gamma`. */
export function buildKermorClusterHandles(
  c: DotInputCluster,
  outerName: string,
  parentInnermost: GvGraphBuilder,
  nextRankSubId: () => number,
): ClusterHandlesLike {
  let host = parentInnermost;
  if (kermorHasAlpha(c)) {
    host = host.addSubgraph(`${outerName}alpha`, {});
    labelWithNote(host, c.kermorNotes?.top);
  }
  const beta = host.addSubgraph(`${outerName}beta`, { labelloc: 'b' }); // :103-104
  labelWithNote(beta, c.kermorNotes?.bottom);
  for (const pr of c.portRanks ?? []) {
    if (pr.rank !== 'source') continue;
    const rankSub = beta.addSubgraph(`__portrank_${nextRankSubId()}`, { rank: pr.rank });
    for (const id of pr.nodeIds) {
      rankSub.addNode(id);
      beta.addNode(id);
    }
  }
  const gamma = beta.addSubgraph(`${outerName}gamma`, { labelloc: 't' }); // :128-129
  if (c.titleTableWidth !== undefined && c.titleTableHeight !== undefined) {
    gamma.setHtmlAttr('label', noteTable(c.titleTableWidth, c.titleTableHeight));
  }
  return { main: gamma, innermost: gamma };
}

/** The rank=sink groups (`:153`) go last inside gamma; normal members first. */
export function placeKermorMembers(c: DotInputCluster, gamma: GvGraphBuilder, nextRankSubId: () => number): void {
  const ports = new Set((c.portRanks ?? []).flatMap((r) => r.nodeIds));
  const normals = c.nodeIds.filter((id) => !ports.has(id));
  // `Cluster.printCluster3_forKermor` (`Cluster.java:598-601`): `<id>empty` point when no normal member.
  if (normals.length === 0) gamma.addNode(`${c.id}empty`, { shape: 'point' });
  for (const id of normals) gamma.addNode(id);
  for (const pr of c.portRanks ?? []) {
    if (pr.rank !== 'sink') continue;
    const rankSub = gamma.addSubgraph(`__portrank_${nextRankSubId()}`, { rank: pr.rank });
    for (const id of pr.nodeIds) {
      rankSub.addNode(id);
      gamma.addNode(id);
    }
  }
}

/** `Cluster.printCluster3_forKermor` on the ROOT (`DotStringFactory.java:178-184`):
 *  both edge batches print FIRST, then the root prints
 *  `<rootId>empty [shape=point,label=""]` when it has no direct normal node
 *  (`Cluster.java:595-598`), then the clusters. So the placeholder is created
 *  after every edge endpoint and before any other cluster member -- graphviz
 *  breaks rank ties by creation order. Mirrors the text emitter's `rootEmpty`
 *  (`svek-dot-emit.ts`), same condition: no node outside a cluster.
 *  `order` is `firstEncounterOrder(input)`; `add` declares one node. */
export function addNodesWithKermorRootEmpty(
  b: GvGraphBuilder,
  input: DotInputGraph,
  order: readonly DotInputNode[],
  add: (b: GvGraphBuilder, n: DotInputNode) => void,
): void {
  if (input.kermor !== true) {
    for (const n of order) add(b, n);
    return;
  }
  const clustered = new Set((input.clusters ?? []).flatMap((c) => c.nodeIds));
  let pending = input.nodes.every((n) => clustered.has(n.id));
  const endpoints = new Set(input.edges.flatMap((e) => [e.from, e.to]));
  for (const n of order) {
    if (pending && !endpoints.has(n.id)) {
      b.addNode(KERMOR_ROOT_EMPTY_ID, { shape: 'point' });
      pending = false;
    }
    add(b, n);
  }
  if (pending) b.addNode(KERMOR_ROOT_EMPTY_ID, { shape: 'point' });
}

/** Same literal as the text emitter's placeholder (the comparator ignores ids). */
export const KERMOR_ROOT_EMPTY_ID = 'rootEmpty';
