/**
 * The elkjs backend, loaded on demand (cdd8 D1). This module is the ONLY
 * place under `src/` that names elkjs (fitness test
 * `tests/unit/elk/elk-import-boundary.test.ts`), and it does so through a
 * dynamic `import()`, so the 1.6 MB worker is a separate chunk that a render
 * fetches only for a diagram laid out by ELK (`CucaDiagram.java:478-479`,
 * `isUseElk()`).
 */
// The declaration must be referenced, not imported: it declares an untyped
// module, which a module file cannot do. tsconfig.node.json's program reaches
// this file from scripts/ without including src/**/*.d.ts, so without the
// reference that typecheck reports TS7016 on the import() below.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./elkjs-worker.d.ts" />
import type { ElkBackend } from './elk-backend.js';
import { createElkjsBackend } from './elkjs-backend.js';

export type { ElkBackend } from './elk-backend.js';

/**
 * A new elkjs-backed `ElkBackend`. Pass it as `RenderOptions.elk` to lay out
 * `!pragma layout elk` diagrams with `renderSync`; `render()` calls this
 * itself when it needs one and none was passed.
 *
 * Runs where elkjs's worker module exports its `FakeWorker` (Node, and a
 * bundled browser main thread). In a Web Worker the module instead installs
 * itself as that worker's message handler and exports nothing, and this
 * rejects with an `ElkBackendError`.
 */
export async function loadElk(): Promise<ElkBackend> {
  const workerModule: unknown = await import('elkjs/lib/elk-worker.min.js');
  return createElkjsBackend(workerModule);
}
