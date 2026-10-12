import type { ElkLabel } from './ElkLabel.js';
import type { ElkWithProperty } from './ElkWithProperty.js';

/**
 * Proxy for `org.eclipse.elk.graph.ElkNode`: the members upstream calls.
 * Coordinates are relative to the parent node, as in ELK.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/graph/ElkNode.java:8-51
 */
export interface ElkNode extends ElkWithProperty {
  /** `null` for a graph root (`ElkNode.java:14-20`). */
  getParent(): ElkNode | null;
  getX(): number;
  getY(): number;
  /** `Collection<ElkLabel>`, in creation order. */
  getLabels(): readonly ElkLabel[];
  getWidth(): number;
  getHeight(): number;
  setDimensions(width: number, height: number): void;
}
