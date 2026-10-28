# T1d — `pin-gantt.mts` refuses rule-conformant slugs (D5)

Agent: `tooling-engineer` (sonnet), worktree `gdd-T1d`. Commit:
`chore(gdd): pin-gantt refuses accepted-divergence and stock-error slugs (T1d)`.
Read [../task-contract.md](../task-contract.md) first (the boundaries apply;
this task touches only the plan's measurements directory).

## Context
`plans/gantt-divergence-drive/measurements/pin-gantt.mts` (T0a's copy of gep's)
copies `test-results/dot-cache/gantt/<slug>/{in.puml,in.svg}` into
`oracle/goldens/svg-gantt/<slug>/` and appends to `ratchet.json`; dry-run by
default, `--write` to pin. The gep b7 close pinned 11 rule-conformant rows
(`.agent-notes/gep-execution.md`, last observation): a survey marks a row
conformant when byte-equal OR listed in `oracle/accepted-divergences.json`
OR a jar error page we also error on, but the golden ratchet demands bytes.

## Task
Before validating a slug, refuse it (print `REFUSED <slug>: <reason>`, exit
non-zero at the end, pin nothing for it) when (a) `svg-gantt/<slug>` is an
`id` in `oracle/accepted-divergences.json`, or (b) its `in.svg` is a stock
error page — match the way `tests/oracle/svg-conformance` decides it (read
`oracle/goldens/stock-error-pages.json` and the survey's error-page check in
`scripts/svg-parity-survey.ts`; reuse, do not reimplement a heuristic).
Other slugs behave exactly as before. Keep the wbs twin's argv shape.

## Tests (first)
`pin-gantt.test.mts` (run with `npx vitest run --config plans/gantt-divergence-drive/measurements/vitest.config.mts`):
`lituri-55-caju105` (accepted) refused; a jar-error slug from
`parity-gantt.json` (`jq '.fixtures[] | select(.firstDiff=="error-page")'`
or the 10 known rows) refused; a byte-conformant slug still validates and,
with `--write` into a temp goldens dir, pins and appends.

## Write-set
`plans/gantt-divergence-drive/measurements/pin-gantt.mts`,
`plans/gantt-divergence-drive/measurements/pin-gantt.test.mts`.

## Acceptance
- Given an accepted-divergence slug, when pinned, then it is refused by name and nothing is written.
- Given a stock-error-page slug, when pinned, then it is refused and nothing is written.
- Given a byte-conformant slug and a temp goldens dir, when `--write`, then the golden is byte-equal to the oracle and `ratchet.json` gained one entry.

Observability: N/A. Rollback: Reversible.
