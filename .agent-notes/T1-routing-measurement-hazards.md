## Observation: renderSync without an include store turns !include failures into routing "NONE"

- **Context**: Building the routing-conformance gate
  (`sequence-engine-overclaims-nested-diagrams` / T1), which reads
  `data-diagram-type` off our own rendered document and compares it with the
  jar's.
- **Finding**: `renderSync` refuses `!include` when `options.includeStore` is
  absent (`src/index.ts:213`) and, because it never rethrows, returns
  `errorSvg` — a document with **no** `data-diagram-type` attribute. Any
  measurement that reads that attribute therefore records a *resolution*
  failure as a *routing* answer of `NONE`. Measured over all 3158 committed
  fixtures: 90 disagreements with no store, 79 with
  `tests/helpers/fixture-include-store.ts`. The 79 are a strict subset — the
  store fixes 11 and breaks 0, and all 11 are `!include` fixtures.
- **Impact**: Any future harness that reads a root attribute, counts error
  cards, or classifies "did this render", must pass the shared include store
  or it is measuring its own missing store. This is the same class of defect
  that module's header already records for the sequence ratchet.
- **Confidence**: High — measured both ways, difference enumerated per fixture.

## Observation: the jsdom default measurer injects layout failures into any renderSync-based measurement

- **Context**: Same task; the gate first ran under `vitest` (`environment:
  'jsdom'`) with no explicit measurer.
- **Finding**: `resolveMeasurer` defaults to `CanvasMeasurer`, which calls
  `HTMLCanvasElement.prototype.getContext` — unimplemented in jsdom without
  the `canvas` package. The run floods with "Not implemented" traces from
  `src/core/measurer.ts:243`, and layout failures inside `renderSync` become
  `errorSvg`, i.e. another false `NONE`. Passing `DeterministicMeasurer`
  removes both. Routing itself is measurer-independent: the whole corpus
  scores 79 with an identical bucket table under either measurer, so this is
  a harness hazard, not a routing signal.
- **Impact**: Any test that calls `renderSync` (rather than a per-engine
  `render-fixture-*.ts` helper, which already inject a measurer) must pass one
  explicitly.
- **Confidence**: High — measured under both measurers over 3158 fixtures.

## Observation: vitest hides console.log from passing tests unless the reporter is named explicitly

- **Context**: Verifying that the gate's `[FIXED]` / `[ROUTING SLI]` progress
  messages actually reach a reader.
- **Finding**: `npx vitest run <file>` with stdout redirected prints none of
  them; `--reporter=default` or `--reporter=verbose` prints all of them under
  a `stdout | <file> > <test name>` header. `npm test`'s own output likewise
  carries none (`grep -c "ROUTING SLI" == 0`).
- **Impact**: The repo's ratchet convention of reporting falls via
  `console.log` (`sequence.diff-baseline.ratchet.test.ts`'s `[IMPROVED]` /
  `[PROMOTION READY]`, and this gate's `[FIXED]`) is visible interactively but
  **not** in captured CI logs. Verify such a message with an explicit
  reporter; never conclude a branch did not fire from a redirected run.
- **Confidence**: High — reproduced with and without the flag.
