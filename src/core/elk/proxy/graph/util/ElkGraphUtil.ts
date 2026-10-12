import type { ElkEdge } from '../ElkEdge.js';
import type { ElkLabel } from '../ElkLabel.js';
import type { ElkNode } from '../ElkNode.js';

/**
 * Proxy for `org.eclipse.elk.graph.util.ElkGraphUtil`'s factory methods.
 * Upstream's are static and reach ELK by reflection; here a backend
 * implements them (`ElkBackend` extends this), so the graph it builds is
 * one it can lay out.
 *
 * `createSimpleEdge` sets the edge's containing node as ELK does
 * (`ElkGraphUtil#updateContainment`), so {@link ElkEdge.getContainingNode}
 * is defined before layout.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/graph/util/ElkGraphUtil.java:8-32
 */
export interface ElkGraphUtil {
  /** Both upstream overloads, `createLabel(ElkEdge)` and `createLabel(ElkNode)` (`:11-17`). */
  createLabel(owner: ElkEdge | ElkNode): ElkLabel;
  createNode(root: ElkNode): ElkNode;
  createSimpleEdge(node1: ElkNode, node2: ElkNode): ElkEdge;
  createGraph(): ElkNode;
}
