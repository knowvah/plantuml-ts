# T0b: salt oracle harness (D6)

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Mirror mindmap-engine-port T0b exactly (`plans/mindmap-engine-port/batch-0/T0b-oracle-harness.md`):
1. `tests/oracle/svg-conformance/render-fixture-salt.ts`: render a fixture's `in.puml`
   through production `renderSync` with the survey's measurer and the fixture include/asset
   stores (copy the pattern of `render-fixture-mindmap.ts`).
2. `salt.diff-baseline.ratchet.test.ts`: mirror `mindmap.diff-baseline.ratchet.test.ts`.
   Manifest `oracle/goldens/svg-salt/diff-baseline.json` seeded from a fresh measurement at
   b0 (every row today renders the dispatcher's unknown-diagram error sentinel; mark
   jar-error rows per T0a's classification).
3. `salt.golden.ratchet.test.ts`: mirror `mindmap.golden.ratchet.test.ts`; ratchet
   `oracle/goldens/svg-salt/ratchet.json` with 0 pins; no DOT eligibility (salt never dumps
   `svek-N.dot`).
4. `plans/salt-engine-port/measurements/pin-salt.mts`: the orchestrator's pin path (copy
   `test-results/dot-cache/salt/<slug>/{in.svg,in.puml}` to `oracle/goldens/svg-salt/<slug>/`,
   append to `ratchet.json`, prove byte equality), with a unit test.
5. Track `tests/oracle/svg-conformance/parity-salt.json` from `npm run svg:survey -- salt --out …`.
6. A manifest-shape test: rows = the 51 cached slugs.

## Write-set
`tests/oracle/svg-conformance/render-fixture-salt.ts`,
`tests/oracle/svg-conformance/salt.{golden,diff-baseline}.ratchet.test.ts`,
`tests/oracle/svg-conformance/parity-salt.json`, `oracle/goldens/svg-salt/**`,
`plans/salt-engine-port/measurements/pin-salt.mts` (+ its test).

## Interface contract (consumed by every close)
`renderFixtureSalt(markup: string, measurer: StringMeasurer, options?: { includeStore?, assetStore? }): string`

## Acceptance
- Given the empty golden ratchet, then it passes with 0 pins.
- Given the seeded diff-baseline, then it passes at b0, and a forced regression in a test
  double fails it.
- Given `pin-salt.mts` on a temp copy, then golden bytes equal the cache bytes.

**Observability:** N/A. **Rollback:** Reversible (new files).
