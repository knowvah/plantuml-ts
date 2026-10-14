# T1a — layoutParity module

Prepend [../task-preamble.md](../task-preamble.md).

## Task
Build the in-process layout comparison of decisions.md D1/D2. It is a test-side oracle module (like
`tests/oracle/svek-dot.ts`), not production code.

## Write-set
- `tests/oracle/layout-parity.ts` (new)
- `tests/unit/oracle/layout-parity.test.ts` (new; create the directory if absent)

## Read-set
- `decisions.md#d1`, `#d2`
- `src/core/graph-layout.ts`: `layoutGraph`, `setLayoutInputObserver` (`:50-80`), and how it builds the
  dot-engine graph from a `DotInputGraph`. Reuse that builder entry point; do not re-implement it.
- `tests/unit/core/graph-layout-svek-read.test.ts:1-20`: existing `parse`/`render`/`getLayout` use
- `node_modules/@knowvah/dot-engine/dist/api/index.d.ts`: `getLayout`, `LayoutSnapshot`,
  `ClusterGeometry` shapes
- `.agent-notes/dot-engine-2.4.0-bump.md` ("dump our builder graph as DOT")
- `scripts/svg-parity-survey.ts:264-292`: how a fixture is rendered and its `DotInputGraph` captured
  (`DeterministicMeasurer`, asset/include stores). The test must capture the same way.

## Interface contract (output)
```ts
export type LayoutDiffComponent = 'clusterTree' | 'bb' | 'nodeSizes' | 'nodePositions' | 'edgePos';
export interface LayoutParityResult {
  equal: boolean;
  firstDiff?: { component: LayoutDiffComponent; detail: string }; // detail ≤ 200 chars
}
export function layoutParity(jarSvekDot: string, ours: DotInputGraph): LayoutParityResult;
```
- Comparison order is D1's: `clusterTree`, then `bb`, `nodeSizes`, `nodePositions`, `edgePos`.
- Numbers are compared exactly as dot-engine reports them; there is no epsilon. Any epsilon
  needed to pass is a finding to report, not a tolerance to add.
- Only `nestedDepth === 0` graphs are comparable (`LayoutInputEvent` doc comment). The caller filters;
  document this on the export.
- Multi-page fixtures (`svek-2.dot`…) pair by index, like `scripts/lib/survey-dot-equal.ts`. Expose a
  helper or document the pairing for T2.

## Acceptance
- Given the cached jar DOT and our captured graph for `component/xenusu-76-sabi405`,
  `class/pavuzo-79-zodu430`, `unknown/rubebe-45-sura795` and `class/zuduxu-90-kosi876`, when
  `layoutParity` runs, then `equal === true`.
- Given `unknown/bamami-10-lava790`, when it runs, then `equal === false` and
  `firstDiff.component === 'clusterTree'`.
- Given `unknown/xagonu-36-sudi116`, when it runs, then `firstDiff.detail` names 13 vs 43 clusters.
- Given bamami and xenusu, when the jar-side layout is compared with T0's native
  `measurements/b0-native/` output, then bb and edge `pos` agree. A disagreement is stop 8.
- Given identical inputs run twice, then the results are deep-equal (determinism).

Fixture-reading tests skip cleanly when `test-results/dot-cache` is absent (CI without the corpus),
following the existing corpus-test convention in `tests/oracle/`.

**Observability:** N/A — test-side instrument. **Rollback:** Reversible.
