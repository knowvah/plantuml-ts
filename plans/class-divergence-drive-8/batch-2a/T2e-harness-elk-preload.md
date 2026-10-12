# T2e: the harness preloads an `ElkBackend` (D2d; stop 14)

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
The production survey path, the census, the class fixture helper and the cdd tools
all call `renderSync`. After T1a, an ELK fixture renders the "options.elk" error page
under `renderSync` unless a backend is passed. Make each of them:
1. call `await loadElk()` **once per process** (or once per vitest worker for the
   helper), and
2. pass `{ elk }` in the options they already build. Change nothing else about those
   options.

Sites to cover:
- `scripts/svg-parity-survey.ts` (the `renderSync` call around :268-271)
- `scripts/svg-conformance-census.ts`, plus its `-json` sibling if it renders
- `tests/oracle/svg-conformance/render-fixture-class.ts`. If that helper is synchronous,
  add an exported `prepareElkOnce()` that the ratchet tests await in `beforeAll`. Keep
  the synchronous signature unchanged.
- `plans/class-divergence-drive/tools/{render-diff,render-all,pin-goldens}.mts`

## Byte-identity proof (stop 14)
Before and after the change, run `render-all --tree all` and, for every engine,
`svg:survey`. Every fixture without `!pragma layout elk` must produce identical
bytes: write a tiny comparison over the rendered SVG strings rather than over verdicts.
Journal the counts. Any byte difference is stop 14.

## Write-set
`scripts/svg-parity-survey.ts`, `scripts/svg-conformance-census.ts`,
`scripts/svg-conformance-census-json.ts`,
`tests/oracle/svg-conformance/render-fixture-class.ts`, the class ratchet test's `beforeAll`
only, `plans/class-divergence-drive/tools/{render-diff,render-all,pin-goldens}.mts`
plus their tests.

## Read-set
T1a's `load-elk.ts` and `RenderOptions.elk`; each file above at its `renderSync`
call site; `plans/class-divergence-drive/tools/README.md`.

## Acceptance
- Given an ELK class fixture, when surveyed, then it renders through the backend. Before
  T3a lands, that path still lays out with dot-engine, so its verdict equals b0's;
  either way the error page does not appear.
- Given every non-ELK fixture across all engines, then its bytes are identical before and
  after (counts journaled).
- Given a vitest run, then elkjs loads at most once per worker (assert with a load
  counter in the helper's test).

## Architecture decisions (locked)
D2d.
