/**
 * cdd3-T18: the class parser's `together { }` membership
 * (`ClassDiagramAST.togethers`) projected onto the `DotInputGraph`: the
 * together list itself, `DotInputNode.together` on each member leaf, and
 * `DotInputCluster.together` on each member group. The core emitter and
 * layout builder print them (`src/core/svek-dot-together.ts`,
 * `Cluster#printCluster2`/`printTogether`, `svek/Cluster.java:528-583`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekNode.java:97-101
 */
import type { ClassDiagramAST } from './ast.js';
import type { DotInputCluster, DotInputGraph } from '../../core/graph-layout.js';

/** Every member id mapped to its together id. */
function membership(ast: ClassDiagramAST): Map<string, string> {
  const togetherOf = new Map<string, string>();
  for (const t of ast.togethers ?? []) for (const id of t.members) togetherOf.set(id, t.id);
  return togetherOf;
}

/** `together` on each member-group cluster. */
function markClusters(
  graph: DotInputGraph,
  clusterIdByNs: ReadonlyMap<string, string>,
  togetherOf: ReadonlyMap<string, string>,
): void {
  const clusterById = new Map<string, DotInputCluster>((graph.clusters ?? []).map((c) => [c.id, c]));
  for (const [nsId, clusterId] of clusterIdByNs) {
    const t = togetherOf.get(nsId);
    const cluster = clusterById.get(clusterId);
    if (t !== undefined && cluster !== undefined) cluster.together = t;
  }
}

/** Attach the together membership to `graph` in place. `clusterIdByNs` maps
 *  a namespace id to its `DotInputCluster.id` (`class-dot-clusters.ts`). */
export function applyClassTogethers(
  graph: DotInputGraph,
  ast: ClassDiagramAST,
  clusterIdByNs: ReadonlyMap<string, string>,
): void {
  const togethers = ast.togethers ?? [];
  if (togethers.length === 0) return;
  graph.togethers = togethers.map((t) =>
    t.parentId !== undefined ? { id: t.id, parentId: t.parentId } : { id: t.id },
  );
  const togetherOf = membership(ast);
  for (const node of graph.nodes) {
    const t = togetherOf.get(node.id);
    if (t !== undefined) node.together = t;
  }
  markClusters(graph, clusterIdByNs, togetherOf);
}
