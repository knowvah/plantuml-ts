import type { ElkBendPoint } from './ElkBendPoint.js';

/**
 * Proxy for `org.eclipse.elk.graph.ElkEdgeSection`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/graph/ElkEdgeSection.java:10-53
 */
export interface ElkEdgeSection {
  getStartX(): number;
  getStartY(): number;
  getEndX(): number;
  getEndY(): number;
  /** `Collection<ElkBendPoint>`, in route order. */
  getBendPoints(): readonly ElkBendPoint[];
}
