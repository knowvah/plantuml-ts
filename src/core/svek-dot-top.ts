/**
 * `Cluster#getNodesOrderedTop` / `getNodesOrderedWithoutTop` — the split
 * `printCluster1` / `printCluster2` make of one cluster's own nodes.
 *
 * Every cluster (the root included) first declares the TAIL of every
 * inverted link (`Link#getInv`, `abel/Link.java:145-147`; `SvekEdge
 * #isInverted`, `svek/SvekEdge.java:1148-1150`) whose tail is one of its own
 * NORMAL-position nodes. The tails are prepended one at a time
 * (`firsts.add(0, sh)`), so they come out newest link first and once PER
 * LINK: a node that is the tail of two inverted links is declared twice. The
 * remaining nodes follow in their own order, less those tails.
 *
 * For the root, `printCluster1` runs BEFORE the `lines0` edge batch
 * (`DotStringFactory.java:188-190`); for a nested cluster it runs after the
 * cluster's `za` anchor and wrappers (`ClusterDotString.java:148-176`). That
 * placement lives in the two consumers, `svek-dot-emit.ts` (text) and
 * `svek-dot-order.ts#firstEncounterOrder` (node creation order); this module
 * is the one definition of WHICH nodes and in what order, so those two
 * cannot drift.
 *
 * `lines` is `Bibliotekon#allLines` (`addLine` order), i.e. `input.edges`.
 * The tail is `getStartUidPrefix()`, the DOT edge's own tail: `edge.from`.
 *
 * Not ported: kermor. `!pragma kermor on` prints through
 * `printCluster3_forKermor` / `ClusterDotStringKermor`, neither of which
 * calls `printCluster1` (`DotStringFactory.java:178-185`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:195-238,515-523
 */

import type { DotInputCluster, DotInputEdge, DotInputGraph, DotInputNode } from './graph-layout.types.js';

/** `Cluster#isNormalPosition` (`Cluster.java:214-216`): `true` when the id
 *  is an ordinary entity node. */
export type IsNormalPosition = (id: string) => boolean;

/**
 * `Cluster#getNodesOrderedTop` (`Cluster.java:195-212`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:195-212
 */
export function nodesOrderedTop(
  nodeIds: readonly string[],
  edges: readonly DotInputEdge[],
  isNormal: IsNormalPosition,
): string[] {
  const own = new Set(nodeIds);
  const firsts: string[] = [];
  for (const e of edges) {
    if (e.inverted === true && own.has(e.from) && isNormal(e.from)) firsts.unshift(e.from);
  }
  return firsts;
}

/**
 * `Cluster#getNodesOrderedWithoutTop` (`Cluster.java:218-238`), less its
 * non-NORMAL filter: this port's consumers already route port and rank-group
 * nodes separately (`ClusterDotString.printRanks`), so only the tops are
 * removed here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:218-238
 */
export function nodesOrderedWithoutTop(
  nodeIds: readonly string[],
  edges: readonly DotInputEdge[],
  isNormal: IsNormalPosition,
): string[] {
  const tops = new Set(nodesOrderedTop(nodeIds, edges, isNormal));
  return nodeIds.filter((id) => !tops.has(id));
}

function nonNormalIdsOf(c: DotInputCluster): string[] {
  const anchors = [c.unwrappedNodeId, c.portAnchorId].filter((id): id is string => id !== undefined);
  return [...anchors, ...(c.portRanks ?? []).flatMap((r) => r.nodeIds)];
}

/**
 * The graph-wide NORMAL-position test. Not NORMAL: a PORTIN/PORTOUT port
 * (`isPort`), a border point named by a cluster's `{rank=…}` group
 * (`EntityPosition.ENTRY_POINT`/`EXIT_POINT`/…), and a group anchor — jar's
 * `za` point and `empty()` placeholder, which are no `SvekNode` at all, so
 * `getNodesOrderedTop`'s `shs` lookup can never return them.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:214-216
 */
export function normalPositionOf(input: DotInputGraph): IsNormalPosition {
  const nodeById = new Map<string, DotInputNode>(input.nodes.map((n) => [n.id, n]));
  const excluded = new Set<string>();
  for (const c of input.clusters ?? []) for (const id of nonNormalIdsOf(c)) excluded.add(id);
  return (id) => nodeById.get(id)?.isPort !== true && !excluded.has(id);
}

/**
 * `printCluster1` + `printCluster2` for every cluster: each cluster's
 * `nodeIds` rewritten to its tops (duplicates kept — jar prints one shape
 * line per inverted link) followed by the rest. A cluster with no tops is
 * returned as-is. Feed the result to `buildClusterTree` for EMISSION ORDER
 * only — `assignSequence` numbers nodes in the original order.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:515-523,550-556
 */
export function topsFirstClusters(input: DotInputGraph): DotInputCluster[] {
  const clusters = input.clusters ?? [];
  if (input.kermor === true) return clusters;
  const isNormal = normalPositionOf(input);
  return clusters.map((c) => {
    const tops = nodesOrderedTop(c.nodeIds, input.edges, isNormal);
    if (tops.length === 0) return c;
    return { ...c, nodeIds: [...tops, ...nodesOrderedWithoutTop(c.nodeIds, input.edges, isNormal)] };
  });
}

/**
 * The root's `printCluster1` (`DotStringFactory.java:188`): the tops among
 * the root's own nodes (`rootIds`, the unclustered ones). Empty under kermor.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java:186-190
 */
export function rootTops(input: DotInputGraph, rootIds: readonly string[]): string[] {
  if (input.kermor === true) return [];
  return nodesOrderedTop(rootIds, input.edges, normalPositionOf(input));
}
