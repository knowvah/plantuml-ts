# Batch 0: oracle re-pin to 1.2026.8beta1

Sequential, orchestrator only. The oracle is shared state, and every later
measurement depends on it. Start from main `f49cbad13` on a new branch
`feat/class-divergence-drive-5`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-fork-and-jar.md) | fork cleanup, jar rebuild + cmp, pin.json | orchestrator | `oracle/pin.json`, fork branch | — | [x] |
| [T0b](T0b-7beta11-baseline.md) | survey all 28 engines on the 7beta11 cache | orchestrator | `measurements/b0-7beta11/` | T0a | [x] |
| [T0c](T0c-recapture.md) | recapture every engine + DOT goldens; freshness test | orchestrator | `test-results/dot-cache/**`, `oracle/goldens/{class,description,object,state}/**`, `oracle-freshness.test.ts` | T0b | [x] |
| [T0d](T0d-resurvey-classify.md) | re-survey, diff, classify every mover | orchestrator | `measurements/b0-8beta1/`, journal, `fixtures.md` (seed) | T0c | [x] |
| [T0e](T0e-golden-rebaseline.md) | re-baseline svg goldens/baselines, unpin the broken; gates | orchestrator | `oracle/goldens/svg-*/**`, gate test counts, `tests/oracle/svg-conformance/*.json` | T0d | [x] |
| [T0f](T0f-acceptances.md) | re-verify the 17 acceptances + besepi | orchestrator | `oracle/accepted-divergences.json` | T0e | [x] |

Why T0b precedes T0c: it isolates the oracle effect. T0b and T0d run on the
identical `src/`, so every T0b→T0d mover comes from the jar alone.

Batch 0 has no close-procedure run. T0e's gates plus T0d's journal are its
close. Tick the README row after T0f.
