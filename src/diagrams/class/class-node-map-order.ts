/**
 * `Bibliotekon#allNodes` (`svek/Bibliotekon.java:54,74,182-184`): the
 * `LinkedHashMap` of every `SvekNode` in `createNode` order — the order
 * `GraphvizImageBuilder#printGroups`/`printEntities` construct them, which is
 * the ColorSequence order `core/svek-dot-sequence.ts#assignSequence`
 * reproduces (its `sh####` number). A group's `za` anchor is no `SvekNode`
 * (`Cluster.getSpecialPointId`), so it is not in the map.
 *
 * `SvekEdge#manageCollision` (`svek/SvekEdge.java:1205-1216`, called from
 * `DotStringFactory.java:473`) walks this collection and moves a tail/head
 * label away from each node it overlaps IN TURN, so the walk order changes
 * where a label that touches two nodes ends up. The layout result lists
 * nodes in graphviz CREATION order instead (`core/svek-dot-order.ts`), which
 * `Cluster#printCluster1` reorders (cdd3-T16, `vegubu-29-bomu147`'s `1..1`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Bibliotekon.java:182-184
 */

import type { DotInputGraph, DotLayoutResult } from '../../core/graph-layout.js';
import { assignSequence, buildClusterTree } from '../../core/svek-dot-sequence.js';

/** `result` with `nodes` replaced by the `allNodes()` collection: entity
 *  nodes only, in construction order. */
export function inNodeMapOrder(result: DotLayoutResult, dotGraph: DotInputGraph): DotLayoutResult {
  const { recs } = assignSequence(dotGraph, buildClusterTree(dotGraph.clusters ?? []));
  const created = (id: string): number | undefined => {
    const rec = recs.get(id);
    return rec !== undefined && rec.sh.startsWith('sh') ? rec.color : undefined;
  };
  const nodes = result.nodes.filter((n) => created(n.id) !== undefined).sort((a, b) => created(a.id)! - created(b.id)!);
  return { ...result, nodes };
}
