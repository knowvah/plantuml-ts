# T20 — Close-out (Opus)

Return only the structured result — no preamble, no trailing summary.

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
Read `README.md`, `decisions.md`, `decision-journal.md` (every task's rows /
ratchets / manifest moves are logged there), the eight `findings/G*.md`
(+ `G13.md` if T11 left it), SI28's `SYNTHESIS.md` §1/§4, and the precedent
close-out in `plans/state-declared-size-diagnosis/README.md#Close-out`.

## Task
1. Run the harness and `harness-diff.py` against SI28's ORIGINAL baseline
   (sha `b790fabc…505e0`; the orchestrator keeps a copy at
   `test-results/state-declared-size-baseline.si28.jsonl`) — report rows
   exact per group/task, total mismatched/last-digit/unmatched now vs 144/29/4,
   and the summary line. Run `render-manifest --diff` against SI28's tree
   baseline; every moved fixture must be attributable to a task (list any
   that is not — that is a finding, not a pass).
2. `findings/CLOSE-OUT.md`: per task — fixtures targeted / rows exact /
   residual rows with mechanism / ratchet entries removed / manifest moves;
   per Batch-5 group — status; parity ratchets before/after (state DOT EQUAL
   x/268, svg-conformance state golden count, class/description/object
   unchanged); coverage; `npm test` wall-clock vs SI28 close-out.
3. Schema check for `findings/G*.md`: copy SI28's `check-schema.py` next to
   them with `partition.json` (13 slugs) and run it — must print
   `N records, 0 violations`.
4. `README.md`: tick batches; append "Close-out (date)" scoring: rows exact
   count, groups closed, unresolved remaining with nextStep, flags,
   follow-ups (the follow-on fix batch for whatever Batch 5 resolved; G14
   deliberately unscheduled).
5. `planning/mission-index.md`: SI29 row after SI28 (mirror its columns);
   `planning/next-missions.md`: replace the `state-declared-size-fix` pointer
   with DONE + the follow-on. Append to SI28's `SYNTHESIS.md` a short
   "Outcome (SI29)" section linking CLOSE-OUT.md — nothing else in that file.
Read-only git only (`git log`, `git diff`); no commits.

## Write-set
As in the batch overview.

## Acceptance
- Given the final tree, then `harness-diff.py` vs the SI28 baseline prints only "went exact" rows and 0 appeared/grew; the summary is reported.
- Given `findings/G*.md`, then the schema check prints 0 violations.
- Given README/mission-index/next-missions, then SI29 is recorded with per-task commit ids from `git log`.

## Report (≤700 tokens)
Rows exact / remaining; groups closed / open; ratchet totals; any collateral
manifest move; anything the orchestrator must fix.

## Observability / Rollback
N/A — docs and register rows only. Reversible.
