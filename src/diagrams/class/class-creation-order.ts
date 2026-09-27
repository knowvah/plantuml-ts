/**
 * cdd3-T14 (E1-1, E1-4, C-14 = E3-7): the class DOT graph's node and edge
 * lists in upstream's creation order. Split out of `class-dot-graph.ts`
 * (500-line cap).
 *
 * Nodes: `GraphvizImageBuilder#buildImage` prints `printGroups(root)` then
 * `printEntities(getUnpackagedEntities())` (`svek/GraphvizImageBuilder.java
 * :226-227`) -- a root EMPTY package is muted and printed inside
 * `printGroups` (`:416-418`), ahead of every unpackaged leaf, and the
 * unpackaged leaves follow `dotData.getLeafs()` creation order, notes
 * included (`:399-405`). `class-leaf-order.ts#computeLeafDrawOrder` is
 * exactly that print order (the same `Bibliotekon` insertion order the
 * leaves are drawn in), so the root nodes are sorted by it.
 *
 * Edges: relationships and note links in `getLinks()` order
 * (`class-link-order.ts`), then the magma links, which
 * `ClassDiagram#checkFinalError` adds last (`classdiagram/ClassDiagram.java
 * :87` -> `cucadiagram/Magma.java:61`).
 */
import type { ClassDiagramAST } from './ast.js';
import type { DotInputEdge, DotInputNode } from '../../core/graph-layout.js';
import type { NoteGroup } from './note-layout-groups.js';
import { buildLeafRankMap, computeLeafDrawOrder, computePrintGroupsOrder } from './class-leaf-order.js';
import { interleaveNoteLinks, orderClassLinks, relIndexOfDotEdgeId } from './class-link-order.js';

/** `dotNodes`/`dotEdges` as `buildDotNodesAndEdges` returns them: classifier
 *  nodes (+ package anchors), and relationship edges followed by magma. */
interface ClassifierDotParts {
  readonly dotNodes: readonly DotInputNode[];
  readonly dotEdges: readonly DotInputEdge[];
}

interface NoteDotParts {
  readonly nodes: readonly DotInputNode[];
  readonly edges: readonly DotInputEdge[];
  readonly groups: readonly NoteGroup[];
}

/**
 * `getOrderedLinks(getLinks())` (`class-link-order.ts#orderClassLinks`)
 * applied in place: `ast.relationships` becomes the relationship
 * subsequence (every later `ast.relationships` reader -- DOT edges, `Kal`s,
 * `layout.ts#buildEdgeGeos` -- indexes that array), and each linked note
 * group gets its `linkSlot`. Mutates both, as SB2's reassignment did.
 */
export function applyClassLinkOrder(ast: ClassDiagramAST, groups: readonly NoteGroup[]): void {
  const order = orderClassLinks(ast.relationships, groups, buildLeafRankMap(ast));
  ast.relationships = order.relationships;
  for (const group of groups) {
    const slot = order.noteLinkSlots.get(group.id);
    if (slot !== undefined) group.linkSlot = slot;
  }
}

/** Stable sort by `computeLeafDrawOrder` position; ids it does not list
 *  (`zaent-*` package anchors, which emit inside their cluster) keep their
 *  relative order after every listed id. */
function creationOrderedNodes(ast: ClassDiagramAST, nodes: readonly DotInputNode[]): DotInputNode[] {
  const rank = new Map(computeLeafDrawOrder(ast).map((id, i) => [id, i] as const));
  const at = (n: DotInputNode): number => rank.get(n.id) ?? Number.POSITIVE_INFINITY;
  return [...nodes].sort((a, b) => (at(a) === at(b) ? 0 : at(a) - at(b)));
}

/**
 * The DOT node and edge lists in creation order (see the file header).
 * `relCount` is `ast.relationships.length`: `dotEdges`' first `relCount`
 * entries are the relationship edges, the rest are magma.
 */
export function creationOrderedDotParts(
  ast: ClassDiagramAST,
  classifierParts: ClassifierDotParts,
  noteParts: NoteDotParts,
  relCount: number,
): { nodes: DotInputNode[]; edges: DotInputEdge[] } {
  const slots = new Map(noteParts.groups.map((g) => [g.id, g.linkSlot] as const));
  const links = interleaveNoteLinks(
    classifierParts.dotEdges.slice(0, relCount),
    (e) => relIndexOfDotEdgeId(e.id),
    noteParts.edges,
    (e) => slots.get(e.from) ?? slots.get(e.to),
  );
  return {
    nodes: creationOrderedNodes(ast, [...classifierParts.dotNodes, ...noteParts.nodes]),
    edges: [...links.map((l) => ('rel' in l ? l.rel : l.note)), ...classifierParts.dotEdges.slice(relCount)],
  };
}

/** `DotInputGraph.printGroupsOrder`: `computePrintGroupsOrder` with each
 *  namespace id replaced by its synthetic `clusterN` DOT id. */
export function printGroupsOrderOf(
  ast: ClassDiagramAST,
  clusterIdByNs: ReadonlyMap<string, string> | undefined,
): string[] {
  return computePrintGroupsOrder(ast).map((id) => clusterIdByNs?.get(id) ?? id);
}
