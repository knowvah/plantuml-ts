# T15 — bookkeeping (documentation-engineer)

## Context
Three status surfaces must record this mission from `docs/parity-report.md`
(T14) and `decision-journal.md` as the only sources of numbers:
`planning/next-missions.md` ("Done" region, newest first — read lines 1-60
for the convention), `planning/mission-index.md` § Snapshot (append one
dated bullet; bump the heading's "last refreshed" date), and
`.agent-notes/unknown-bucket-mapping.md` (append an "Outcome" section:
fixed vs pinned per cohort, the `[FIXED]` retirements, what remains pinned
and why).

## Write-set
Those three files only. Edit in place (you have Edit); never rewrite a file
wholesale.

## Acceptance criteria
1. Every number written appears verbatim in `docs/parity-report.md` or
   `decision-journal.md` (list each with its source line in your return).
2. The Snapshot bullet carries the date, the T14 commit hash and per-cohort
   fixed/pinned counts.
3. `npx prettier --check` on the three files passes.

## Observability / Rollback
N/A / Reversible (three doc edits).

## Commit
`docs(ubrr-T15): record the unknown-bucket routing repair`
