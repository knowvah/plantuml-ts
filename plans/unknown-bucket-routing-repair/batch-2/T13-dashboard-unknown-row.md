# T13 — the dashboard's `unknown` row shows its numbers (D8)

## Context
`scripts/parity-dashboard-matrix.ts#engineCell` returns `n/a (accounting
bucket)` for `unknown` (D7 of `parity-dashboard-refresh`), and
`parity-dashboard.ts#columnsFor` short-circuits every comparison cell for a
`plantuml-ts only` type and for a no-engine type (`noEngineColumn`, keyed on
the `n/a (no engine (` prefix). After T14 lands the `unknown` tree, its
oracle count, survey, routing and refusal cells must show real numbers while
the engine cell keeps saying it is an accounting bucket. The drift test
(`tests/unit/scripts/parity-dashboard.test.ts`, D9) compares the committed
`docs/parity-report.md` byte-for-byte with a rebuild from disk.

## Task
- In `parity-dashboard-matrix.ts`, make the no-engine override apply only
  to `no engine (Dn todo)` cells, never to `accounting bucket` (it already
  does by prefix — add the test that proves it, and a comment citing D8 of
  this mission).
- Extend the preamble sentence about no-engine buckets with one clause: the
  `unknown` row keeps its accounting-bucket engine cell but reports every
  measurement its oracle allows.
- Add a synthetic `buildMatrix` test: `unknown` with `oracleCounts.unknown
  = 825`, a survey summary and routing/refusal groups → engine cell
  `n/a (accounting bucket)`, other cells numeric.
- Regenerate `docs/parity-report.md` (`npm run parity:dashboard`); with the
  tree still parked the row's cells read `n/a (no oracle captured)` — that is
  correct for this commit; T14 regenerates again.

## Write-set
`scripts/parity-dashboard-matrix.ts`, `scripts/parity-dashboard.ts` (preamble
only), `tests/unit/scripts/parity-dashboard.test.ts`, `docs/parity-report.md`.

## Read-set
`scripts/parity-dashboard-matrix.ts:50-100`, `scripts/parity-dashboard.ts`
(`columnsFor`, the preamble), `tests/unit/scripts/parity-dashboard.test.ts:
30-140`, `plans/unknown-bucket-routing-repair/decisions.md#d8`.

## Architecture decisions
D8, D10.

## Acceptance criteria
1. Given the synthetic inputs above, when `buildMatrix` runs, then the
   `unknown` row's engine cell is `n/a (accounting bucket)` and its routing
   cell is `<agree>/<total>`.
2. Given a no-engine bucket, when built, then every comparison cell still
   repeats the engine reason (existing test stays green).
3. Given the regenerated report, when the drift test runs twice, then it
   passes both times.

## Observability / Rollback
N/A / Reversible.

## Quality bar
Hook limits; `npx vitest run tests/unit/scripts/parity-dashboard.test.ts`
(1 file collected), typecheck, lint, prettier on the four files.

## Boundaries
Never touch producers, baselines, or `test-results/`.

## Commit
`feat(ubrr-T13): dashboard unknown row reports its measurements`
