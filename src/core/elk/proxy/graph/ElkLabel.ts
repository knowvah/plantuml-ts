import type { ElkWithProperty } from './ElkWithProperty.js';

/**
 * Proxy for `org.eclipse.elk.graph.ElkLabel`. An edge label's coordinates
 * are relative to the edge's containing node, as in ELK.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/graph/ElkLabel.java:5-31
 */
export interface ElkLabel extends ElkWithProperty {
  setText(text: string): void;
  setDimensions(width: number, height: number): void;
  getText(): string;
  getX(): number;
  getY(): number;
}
