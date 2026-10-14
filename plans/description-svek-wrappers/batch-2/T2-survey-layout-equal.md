# T2 — survey `layoutEqual` column + layout-parity ratchet

Prepend [../task-preamble.md](../task-preamble.md).

## Task
Record `layoutEqual` and `layoutFirstDiff` per survey row, and gate the equal rows with a shrink-only
ratchet (decisions.md D3, including its pin-population clarification).

## Write-set
- `scripts/svg-parity-survey.ts`: add the two fields to the row type and the worker frame, beside `dotEqual`
- `scripts/lib/survey-layout-equal.ts` (new): mirrors `scripts/lib/survey-dot-equal.ts`'s shape
  (page pairing, `nestedDepth === 0` filter, smetana/elk `oracleBlind` → not comparable)
- `tests/unit/scripts/survey-layout-equal.test.ts` (new)
- `tests/oracle/svg-conformance/layout-parity.ratchet.test.ts` (new)
- `oracle/goldens/svg-conformance/layout-parity-baseline.json` (new)

## Read-set
- `decisions.md#d3`
- `tests/oracle/layout-parity.ts` (T1a) and its export docs
- `scripts/svg-parity-survey.ts:120-150` (row type), `:255-320` (worker frames), `:355-375` (row assembly)
- `scripts/lib/survey-dot-equal.ts` (whole, 240 lines)
- One existing ratchet for the shrink-only shape, e.g. `tests/oracle/svg-conformance/activity.golden.ratchet.test.ts`
- `oracle/goldens/svg-conformance/routing-baseline.json` (`ourType` per row, for the unknown filter)

## Interface contract
- Survey row: `layoutEqual: boolean | 'n/a'`, `layoutFirstDiff?: { component; detail }`. `'n/a'` when
  `oracleBlind`, when there is no svek DOT, or when the page counts differ.
- Baseline JSON: `{ "$comment": "...", "fixtures": [{ "tree", "slug", "addedAt" }] }`, sorted by tree/slug.
- Ratchet: for each pinned row, render with the survey's capture path, run `layoutParity` per page,
  and assert `equal`. A failing row prints `firstDiff`. It skips cleanly without `test-results/dot-cache`.

## Seeding
Run the survey with the new column for `component`, `usecase`, `c4` and `unknown`, plus the four
control fixtures, in this worktree. Use `bash plans/description-svek-wrappers/measurements/chain.sh`
restricted to those trees, writing to `measurements/T2-seed/`. Pin every `layoutEqual === true` row in
the D3 population. The worktree needs `test-results` children symlinked from the main checkout
([[batch-parallelism-needs-worktrees]]).

## Acceptance
- Given the four controls, when the survey runs, then each row has `layoutEqual === true`.
- Given bamami (pre-T3 code), then `layoutEqual === false` with `layoutFirstDiff.component === 'clusterTree'`.
- Given the seeded baseline, when the ratchet runs, then it passes. When a pinned row's builder graph is
  perturbed (unit test with a doctored `DotInputGraph`), then the comparison it uses reports unequal.
- Given the ratchet's wall-clock under `--maxWorkers=4`, then report it. Over 120 s is a journal note,
  not a stop ([[npm-test-ceiling-advisory]]).

**Observability:** adds the `layoutEqual` SLI to the survey. **Rollback:** Reversible.
