# T0a — branch, b0, classifier, ledger

Agent: orchestrator for steps 1, 3–5; `typescript-pro` (worktree
`sdd1-T0a`) for step 2. Commit: `chore(sdd1-T0a): b0 measurements and
sequence classifier`.

## Context
sdd1 needs one frozen reference (D7) for every later "loss" and "rise", and
a classifier that sorts each sequence fixture into exactly one cohort so the
D10 target (paint-only rows pinned) is countable. The planning source is
`$T/classify-scratch.mts`: it renders through the ratchet path
(`renderFixtureSequence` + `DeterministicMeasurer` + `fixtureIncludeStore()`)
and produced `measurements/plan-classify.json` (paint-only 338, geometry 513,
structural 277, error 13; Σ 150864 at `9e3a27dee`).

## Task
1. `git switch -c feat/sequence-divergence-drive` off clean main; `git
   config --worktree commit.gpgsign false` in the main checkout (memory
   `signed-commits-need-user-rebase`; `mkwt.sh` does it for agent
   worktrees); commit the brief (`plans/sequence-divergence-drive/` and
   `.agent-notes/sdd1-planning.md`) as
   `docs(sdd1): add the sequence-divergence-drive brief`.
2. Promote `classify-scratch.mts` to `$T/classify.mts` + `$T/classify.test.mts`
   (run with `npx vitest run --config $T/vitest.config.mts`). Keep the cohort
   predicates; add per-row `keys` (the diff paths with `[n]` stripped, each
   with its count) so a close can name mechanisms. Unit-test each predicate
   on hand-built `Diff[]`: `zero`, `paint-only`, `geometry`, `structural`
   (both the `childCount` and the tag-substitution shapes), and that a
   render failure is `error` with its message.
3. b0: `npm run svg:survey -- sequence --out $M/b0-survey.json`;
   `npx tsx $T/classify.mts $M/b0-classify.json`; every other surveyed
   engine into `$M/b0-eng/parity-<e>.json` (the type list is the parity
   dashboard's rows that have a survey).
4. If b0's Σ differs from the committed diff-baseline (150933), journal the
   per-row delta (planning saw 150864: 69 of main drift since 10-08). This is
   not a stop; b0 is the reference from here on.
5. Seed `fixtures.md`: one row per `paint-only` slug with `b0 ws` and its
   diff keys; fill the counts table's `b0` row.

## Write-set
`plans/sequence-divergence-drive/{measurements/b0*,tools/classify.mts,
tools/classify.test.mts,fixtures.md,decision-journal.md}`.

## Read-set
`$T/classify-scratch.mts` (whole); `tests/oracle/svg-conformance/compare.ts:
35-50,578-615` (`Diff`, `compareSvg`, `weightedScore`);
`tests/oracle/svg-conformance/sequence-diff-census.ts:1-60` (the closed
bucket rules — do not change them); `close-procedure.md`.

## Interface contracts (outputs)
`b0-classify.json`: `Array<{ slug: string; cohort: 'zero' | 'paint-only' |
'geometry' | 'structural' | 'error'; ws?: number; n?: number; nonPaint?:
number; keys?: Record<string, number>; error?: string }>`, one row per
diff-baseline row. Consumed by every close and by T4's family seeding.

## Acceptance
- Given clean main at `9e3a27dee`, when b0 runs, then `b0-survey.json`
  reads 0 conformant / 1143 rows and `b0-classify.json` has 1141 rows.
- Given `b0-classify.json`, then every row has exactly one cohort and the
  paint-only count is 338 ± 5 (a larger gap is journaled with the rows).
- Given `classify.test.mts`, then each cohort predicate has a passing case
  and the suite runs under the tools vitest config.
- Given `fixtures.md`, then its paint-only rows equal b0's paint-only count.

Quality bar: tools vitest + `npx tsc --noEmit -p $T`; eslint does not reach
`plans/` (see `$T/vitest.config.mts` note). Boundaries: `src/` untouched;
`oracle/goldens/**` untouched. Observability: N/A — no new observable
operations. Rollback: Reversible.
