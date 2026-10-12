import type { ElkNode } from '../graph/ElkNode.js';
import type { NullElkProgressMonitor } from './util/NullElkProgressMonitor.js';

/** The part of an `ElkBackend` that lays a graph out (`elk-backend.ts`). */
export interface ElkLayoutRunner {
  layout(root: ElkNode): void;
}

/**
 * Proxy for `org.eclipse.elk.core.RecursiveGraphLayoutEngine`. Upstream
 * instantiates ELK's engine by reflection (`:10`); here the backend that built
 * the graph lays it out, so the engine is constructed over that backend.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/core/RecursiveGraphLayoutEngine.java:7-16
 */
export class RecursiveGraphLayoutEngine {
  constructor(private readonly backend: ElkLayoutRunner) {}

  /** The monitor is ELK's no-op one; a backend runs its own (elkjs: `BasicProgressMonitor`). */
  layout(root: ElkNode, monitor: NullElkProgressMonitor): void {
    void monitor;
    this.backend.layout(root);
  }
}
