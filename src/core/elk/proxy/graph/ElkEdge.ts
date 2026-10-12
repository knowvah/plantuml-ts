import type { ElkEdgeSection } from './ElkEdgeSection.js';
import type { ElkLabel } from './ElkLabel.js';
import type { ElkNode } from './ElkNode.js';
import type { ElkWithProperty } from './ElkWithProperty.js';

/**
 * Proxy for `org.eclipse.elk.graph.ElkEdge`. Section and label coordinates
 * are relative to {@link ElkEdge.getContainingNode}, as in ELK.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/graph/ElkEdge.java:9-42
 */
export interface ElkEdge extends ElkWithProperty {
  getContainingNode(): ElkNode;
  /** `Collection<ElkLabel>`, in creation order. */
  getLabels(): readonly ElkLabel[];
  getSections(): readonly ElkEdgeSection[];
  /** Throws `UnsupportedOperationException` upstream (`ElkEdge.java:38-40`); every backend must too. */
  isHierarchical(): boolean;
}
