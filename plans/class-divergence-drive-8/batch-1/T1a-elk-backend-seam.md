# T1a: the `ElkBackend` seam (D2, D2b)

Prepend [task-preamble.md](task-preamble.md).

## Why this shape
The maintainer will port ELK to TypeScript next, and that backend must replace
elkjs with no change to the ELK maker (D2). Upstream already isolates ELK behind
a reflection proxy (`net/sourceforge/plantuml/elk/proxy/`, 670 lines) so the jar
runs without ELK on the classpath. That proxy IS the seam: port it as interfaces.

## Task (TDD)
1. **Port the proxy layer** to `src/core/elk/proxy/`, keeping upstream names and one
   file per Java file: `ElkObjectProxy`, `graph/{ElkNode,ElkEdge,ElkLabel,
   ElkEdgeSection,ElkBendPoint,ElkWithProperty}`, `graph/util/ElkGraphUtil`,
   `core/RecursiveGraphLayoutEngine`, `core/options/{CoreOptions,Direction,
   HierarchyHandling,EdgeLabelPlacement,NodeLabelPlacement,SizeConstraint}`,
   `core/math/ElkPadding`, `core/util/NullElkProgressMonitor`.
   - Each Java proxy method becomes an interface member.
   - Each `CoreOptions.X` becomes an `IProperty`-like constant that carries ELK's
     option id (`org.eclipse.elk.direction`, …) and the value encoding elkjs
     expects.
   - `Reflect.java` has no port: its role is the backend.
2. **`src/core/elk/elk-backend.ts`.** It defines `ElkBackend` (the factory behind
   `ElkGraphUtil.create*` plus `layout(root)`), the contract below.
3. **`src/core/elk/elkjs-backend.ts`.** An in-memory implementation of the proxy
   interfaces. `layout(root)` does four things:
   - serialises to ELK JSON (children, edges, labels, layoutOptions by id)
   - runs `dispatcher.dispatch({data:{id,cmd:'register',algorithms}})` once per
     backend, then `{cmd:'layout', graph, layoutOptions:{}, options:{}}`
   - reads the reply delivered synchronously to `onmessage`
   - writes positions, sizes, sections and bend points back

   A missing `dispatcher` throws `ElkBackendError('elkjs worker dispatcher not found
   — elkjs must be exactly 0.12.0')` (stop 15).
4. **`src/core/elk/load-elk.ts`.** `export async function loadElk(): Promise<ElkBackend>`
   uses `await import('elkjs/lib/elk-worker.min.js')`. It is the only import site of
   elkjs (D1). Verify `npm run build` emits it as a separate chunk.
5. **Plumbing:**
   - `RenderOptions.elk?: ElkBackend` in `src/core/render-options.ts`, with JSDoc.
   - `SyncPlugin` in `src/core/dispatcher.ts:298` gains an optional 4th parameter,
     `services?: LayoutServices` (`{ elk?: ElkBackend }`), and an optional hook,
     `requiresElk?(ast): boolean`.
   - In `src/index.ts`:
     - `renderPagesSync` passes `{ elk: options?.elk }`.
     - `render()`/`renderPages()`/`renderAll()` resolve `options.elk ?? (await
       loadElk())` only when `plugin.requiresElk?.(ast)` is true.
     - When `requiresElk` is true and no backend is available, `renderSync` throws
       `'!pragma layout elk is not supported in renderSync without options.elk — use
       render(), or pass options.elk (await loadElk())'`, mirroring
       `src/index.ts:395-399`.
   - Export `loadElk` and the `ElkBackend` type from `src/index.ts`.
6. **The contract suite.** `tests/unit/elk/elk-backend.contract.ts` exports
   `runElkBackendContract(name, makeBackend)`; `elkjs-backend.test.ts` calls it. The
   cases are:
   - a 2-node DOWN graph gives exact coordinates, pinned from elkjs 0.12.0
   - a cluster with `ElkPadding(top,15,15,15)` gives the child offset
   - an edge label with `EDGE_LABELS_INLINE` and placement `TAIL` gives the label
     position
   - section start/end/bend points
   - `HierarchyHandling.INCLUDE_CHILDREN` gives a cross-cluster edge

## Write-set
`src/core/elk/**`, `src/core/dispatcher.ts`, `src/core/render-options.ts`,
`src/index.ts`, `tests/unit/elk/**`, `tests/unit/index*.test.ts` (renderSync/render
ELK cases), `docs/catalog.md`.

## Read-set
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/**` (all of it);
`CucaDiagramFileMakerElk.java:300-500` (to see which proxy members are used);
`node_modules/elkjs/lib/elk-api.js` (the JSON shape); `src/index.ts:385-520`;
`src/core/dispatcher.ts:280-320`; `src/core/render-options.ts:1-80`; the T0c spike
(`plans/class-divergence-drive-8/spike/`).

## Interface contract (output, consumed by T1b, T2a–T2d, T3a, T3b)
```ts
// src/core/elk/elk-backend.ts
export interface ElkBackend {
  createGraph(): ElkNode;                         // ElkGraphUtil.createGraph
  createNode(parent: ElkNode): ElkNode;           // ElkGraphUtil.createNode
  createLabel(owner: ElkNode | ElkEdge): ElkLabel;
  createSimpleEdge(source: ElkNode, target: ElkNode): ElkEdge;
  layout(root: ElkNode): void;                    // RecursiveGraphLayoutEngine.layout
}
// proxy members mirror the Java proxies: getX/getY/getWidth/getHeight/
// setDimensions/setLocation/getContainingNode/getSections/setProperty(prop, value)/
// getLabels/setText/getParent; ElkEdgeSection getStartX/Y, getEndX/Y, getBendPoints.
export interface LayoutServices { elk?: ElkBackend }
// SyncPlugin.layoutSync(ast, theme, measurer, services?: LayoutServices)
// SyncPlugin.requiresElk?(ast: AST): boolean
```
Keep the member names exactly as in the Java proxies. T2a–T2d port against them.

## Acceptance
- Given the contract suite, when run against the elkjs backend, then every case passes
  with pinned coordinates.
- Given a backend whose worker lacks `dispatcher`, when `layout` runs, then
  `ElkBackendError` names the 0.12.0 pin.
- Given `renderSync` on a plugin whose `requiresElk` returns true and no `options.elk`,
  then the error page carries the exact message above.
- Given `npm run build`, then elkjs is in its own chunk and the main entry has no
  static import of it.
- Given every existing test, then it passes unchanged: the parameter is additive.

## Architecture decisions (locked)
D1, D2, D2b, D2d.
