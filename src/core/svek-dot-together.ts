/**
 * `together { }` blocks as svek prints them: an unlabelled
 * `subgraph <clusterId>t<k> { ... }` inside the cluster (or the root) that
 * holds the members. The name starts with `cluster`, so graphviz treats each
 * one as a real cluster.
 *
 * The Java walks each cluster's own nodes in `printCluster2`
 * (`Cluster.java:550-583`):
 *   1. every node WITHOUT a together, in node order;
 *   2. every top-level together met through a node or a child cluster
 *      (`addTogetherWithParents` adds each ancestor too), via `printTogether`
 *      (`:528-547`). That prints the together's own nodes, then the child
 *      clusters whose group carries it, then its nested togethers;
 *   3. every child cluster WITHOUT a together.
 * Inverted-edge tails are not in that walk. `printCluster1` has already
 * declared them (`./svek-dot-top.ts`), so they never enter a together
 * subgraph.
 *
 * This module turns that walk into extra `DotInputCluster` entries flagged
 * `isTogether`. It moves member ids out of their container's `nodeIds` and
 * re-parents together-carrying child clusters. The emitter
 * (`svek-dot-emit.ts`), the node-creation order (`svek-dot-order.ts`) and the
 * layout builder (`graph-layout-build.ts#addClusters`) all nest through the
 * same `parentId` tree, so all three read the one structure built here.
 * `assignSequence` keeps the raw clusters: a together reserves no
 * ColorSequence value (`Together` is no `Cluster`, `abel/Together.java:39-51`).
 *
 * Array order encodes the Java's sibling order. Top-level togethers come
 * right after their container (the root's come first), so they precede its
 * non-together child clusters. Nested togethers come last, after the child
 * clusters `printTogether` prints ahead of them.
 *
 * Under `!pragma kermor on`, `printCluster3_forKermor` prints no togethers
 * (`Cluster.java:595-609`), so the clusters come back unchanged.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:526-583
 */

import type { DotInputCluster, DotInputGraph } from './graph-layout.types.js';
import { normalPositionOf, nodesOrderedWithoutTop } from './svek-dot-top.js';

/** The id prefix for the ROOT's together subgraphs. The jar writes the root
 *  cluster's own id (`cluster2`, its first ColorSequence value). This port's
 *  cluster ids are synthetic `clusterN` tokens, so that prefix could collide
 *  with a real cluster's togethers. The DOT-parity comparator never reads
 *  these names (`tests/oracle/svek-dot.ts` matches `^cluster\d+$` only). */
export const ROOT_TOGETHER_PREFIX = 'clusterroot';

interface Container {
  /** `undefined` = the root. */
  readonly id: string | undefined;
  readonly prefix: string;
  /** `getNodesOrderedWithoutTop`. */
  readonly nodeIds: readonly string[];
  readonly children: readonly DotInputCluster[];
}

interface Walk {
  readonly parentOf: ReadonlyMap<string, string | undefined>;
  readonly nodeTogether: ReadonlyMap<string, string>;
  /** Ids moved into a together subgraph (removed from their container). */
  readonly moved: Set<string>;
  /** Child cluster id -> the together subgraph it now nests in. */
  readonly reparent: Map<string, string>;
  readonly topLevel: DotInputCluster[];
  readonly nested: DotInputCluster[];
  readonly usedNames: Set<string>;
}

/** `Cluster#addTogetherWithParents` (`Cluster.java:585-591`). */
function addTogetherWithParents(
  set: Set<string>,
  together: string,
  parentOf: ReadonlyMap<string, string | undefined>,
): void {
  let t: string | undefined = together;
  while (t !== undefined) {
    set.add(t);
    t = parentOf.get(t);
  }
}

/** A subgraph id. The jar gives a nested together the SAME name as its
 *  parent: `togetherCounter` only increments after the nested call returns
 *  (`Cluster.java:531,545`). graphviz then opens a second, nested subgraph of
 *  that name. Here the id is also a tree key, so a repeat takes an `n<k>`
 *  suffix and keeps the nesting. */
function uniqueName(base: string, used: Set<string>): string {
  let name = base;
  for (let k = 1; used.has(name); k++) name = `${base}n${k}`;
  used.add(name);
  return name;
}

/** `Cluster#printTogether` (`Cluster.java:528-547`). */
function printTogether(
  together: string,
  all: readonly string[],
  box: { c: Container; parentId: string | undefined; counter: { k: number } },
  w: Walk,
  nested: boolean,
): void {
  const name = uniqueName(`${box.c.prefix}t${box.counter.k}`, w.usedNames);
  const nodeIds = box.c.nodeIds.filter((id) => w.nodeTogether.get(id) === together);
  for (const id of nodeIds) w.moved.add(id);
  const sub: DotInputCluster = { id: name, nodeIds, isTogether: true };
  if (box.parentId !== undefined) sub.parentId = box.parentId;
  (nested ? w.nested : w.topLevel).push(sub);
  for (const child of box.c.children) if (child.together === together) w.reparent.set(child.id, name);
  for (const other of all) {
    if (w.parentOf.get(other) === together) printTogether(other, all, { ...box, parentId: name }, w, true);
  }
  box.counter.k += 1;
}

/** `Cluster#printCluster2`'s together half (`Cluster.java:550-571`). */
function printContainer(c: Container, w: Walk): void {
  const togethers = new Set<string>();
  for (const id of c.nodeIds) {
    const t = w.nodeTogether.get(id);
    if (t !== undefined) addTogetherWithParents(togethers, t, w.parentOf);
  }
  for (const child of c.children) {
    if (child.together !== undefined) addTogetherWithParents(togethers, child.together, w.parentOf);
  }
  const all = [...togethers];
  const counter = { k: 0 };
  for (const t of all) {
    if (w.parentOf.get(t) === undefined) printTogether(t, all, { c, parentId: c.id, counter }, w, false);
  }
}

function newWalk(input: DotInputGraph): Walk {
  const nodeTogether = new Map<string, string>();
  for (const n of input.nodes) if (n.together !== undefined) nodeTogether.set(n.id, n.together);
  return {
    parentOf: new Map((input.togethers ?? []).map((t) => [t.id, t.parentId] as const)),
    nodeTogether,
    moved: new Set(),
    reparent: new Map(),
    topLevel: [],
    nested: [],
    usedNames: new Set(),
  };
}

/** Every container, root first, then each cluster in array order. */
function containersOf(input: DotInputGraph, clusters: readonly DotInputCluster[]): Container[] {
  const clustered = new Set(clusters.flatMap((c) => c.nodeIds));
  const isNormal = normalPositionOf(input);
  const childrenOf = (id: string | undefined): DotInputCluster[] => clusters.filter((c) => c.parentId === id);
  const rootIds = input.nodes.filter((n) => !clustered.has(n.id)).map((n) => n.id);
  return [
    {
      id: undefined,
      prefix: ROOT_TOGETHER_PREFIX,
      nodeIds: nodesOrderedWithoutTop(rootIds, input.edges, isNormal),
      children: childrenOf(undefined),
    },
    ...clusters.map((c) => ({
      id: c.id,
      prefix: c.id,
      nodeIds: nodesOrderedWithoutTop(c.nodeIds, input.edges, isNormal),
      children: childrenOf(c.id),
    })),
  ];
}

/** The raw clusters re-parented and emptied of moved members, each followed
 *  by its own top-level togethers; the root's come first, nested ones last. */
function assemble(clusters: readonly DotInputCluster[], w: Walk, byContainer: TogethersByContainer): DotInputCluster[] {
  const out: DotInputCluster[] = [...(byContainer.get(undefined) ?? [])];
  for (const c of clusters) {
    const parentId = w.reparent.get(c.id) ?? c.parentId;
    const nodeIds = c.nodeIds.filter((id) => !w.moved.has(id));
    out.push({ ...c, nodeIds, ...(parentId !== undefined ? { parentId } : {}) });
    out.push(...(byContainer.get(c.id) ?? []));
  }
  out.push(...w.nested);
  return out;
}

type TogethersByContainer = Map<string | undefined, DotInputCluster[]>;

/**
 * `input.clusters` plus one `isTogether` cluster per printed together (see
 * the file header). Returns `input.clusters` itself when nothing changes:
 * kermor, or no node or cluster carries a together.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:526-583
 */
export function togetherClusters(input: DotInputGraph): DotInputCluster[] {
  const clusters = input.clusters ?? [];
  if (input.kermor === true || (input.togethers ?? []).length === 0) return clusters;
  const w = newWalk(input);
  const byContainer: TogethersByContainer = new Map();
  for (const c of containersOf(input, clusters)) {
    const start = w.topLevel.length;
    printContainer(c, w);
    byContainer.set(c.id, w.topLevel.slice(start));
  }
  return w.topLevel.length === 0 ? clusters : assemble(clusters, w, byContainer);
}
