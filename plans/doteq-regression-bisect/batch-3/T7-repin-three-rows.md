# T7 — re-pin exactly three rows

## Context

The parity pins carry `generatedAt` of 2026-08-12 and **761 rows of
un-adopted drift** across three files. A whole-file regeneration is an
adoption decision about every row in the file, not just the ones you came
for — and it would bank four uncredited improvements and bury any other
regression under this mission's name.

This mission fixed three rows. It re-pins three rows.

## Task

1. Run the predicate on all three fixtures; confirm `dotEqual=true`.
2. Update **only** those three entries in `parity-state.json` (two) and
   `parity-class.json` (one). Do not regenerate either file wholesale.
3. Run all four quality gates.
4. Remove the three worktrees from D4.
5. Append the mission summary to `../README.md`.

## Write-set

- `tests/oracle/svg-conformance/parity-state.json` (2 rows)
- `tests/oracle/svg-conformance/parity-class.json` (1 row)
- `plans/doteq-regression-bisect/README.md` (summary section)

## Read-set

- `../README.md#quality-gates`
- `.agent-notes/lor-parity-pins-are-stale.md` — why wholesale re-pinning is
  forbidden here
- the three `.agent-notes/bisect-doteq-*.md` artifacts

## Acceptance criteria

- Given the three fixtures, when the predicate re-runs, then all three report
  `dotEqual=true`.
- Given the re-pin, when `git diff` is read, then **exactly 3 entries
  changed** — the other 758 drifted rows are NOT adopted.
- Given a diff touching any fourth row, then **STOP** (stop condition 3).
- Given the four gates, when run, then all exit 0 and `Test Files` has not
  fallen below 688.

## Observability

N/A — no new observable operations.

## Rollback

Reversible — one commit on a feature branch, nothing deploys.

## Quality bar

All four gates green. `git diff --name-only HEAD~1` matches the write-set.

## Commit

One commit: `test(dqb-T7): re-pin the three dotEqual regressions`
