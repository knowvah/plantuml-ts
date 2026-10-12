/**
 * The ELK seam (cdd8 D2): one interface that a layout backend implements and
 * the ELK maker (`CucaDiagramFileMakerElk` port) calls. Upstream isolates ELK
 * behind a reflection proxy (`net/sourceforge/plantuml/elk/proxy/`) so the jar
 * runs without ELK on the classpath; that proxy layer, ported to
 * `src/core/elk/proxy/`, IS this seam. Backend 1 is elkjs 0.12.0
 * (`elkjs-backend.ts`); backend 2 will be a TypeScript ELK port, which must
 * pass the same contract suite (`tests/unit/elk/elk-backend.contract.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/graph/util/ElkGraphUtil.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/core/RecursiveGraphLayoutEngine.java
 */
import type { ElkLayoutRunner } from './proxy/core/RecursiveGraphLayoutEngine.js';
import type { ElkGraphUtil } from './proxy/graph/util/ElkGraphUtil.js';

/**
 * `ElkGraphUtil.create*` plus `RecursiveGraphLayoutEngine#layout`.
 *
 * Contract: `layout(root)` is synchronous, lays out the whole graph under
 * `root`, and writes positions, sizes, edge sections and bend points back
 * onto the same proxy objects, in ELK's coordinate conventions. A backend
 * only lays out graphs it created. A backend instance is not re-entrant:
 * one `layout` runs to completion before the next starts, which holds
 * because `layout` never yields.
 */
export interface ElkBackend extends ElkGraphUtil, ElkLayoutRunner {}

/**
 * Everything a plugin's layout may need beyond AST, theme and measurer: the
 * optional fourth argument of `SyncPlugin.layoutSync` (cdd8 D2b).
 */
export interface LayoutServices {
  /** Present when the caller passed `RenderOptions.elk`, or `render()` loaded elkjs for a diagram that requires ELK. */
  readonly elk?: ElkBackend | undefined;
}

/** A backend could not lay a graph out: a missing or changed elkjs, or a graph it did not build. */
export class ElkBackendError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ElkBackendError';
  }
}
