# T8 — bookkeeping

## Context
plantuml-ts keeps its planning state in `planning/next-missions.md`
(ordered human list) and `planning/mission-index.md` (executable queue
with a "Snapshot" section, line 256, last refreshed 2026-07-13). The
README's "Supported Diagram Types" table (line 94-102) lists five ✓ rows
and omits activity, json, yaml, hcl, dot, board, chart, chronology,
files, packet — a second status surface that went stale the same way the
dashboard did. `docs/svg-conformance.md` § "Current description-engine
conformance status" (line 287-end) still reports 5 ratcheted fixtures
(there are 51).

## Task
Using the regenerated `docs/parity-report.md` (T7) as the only source of
numbers:
1. `README.md`: replace the five-row table with two sentences pointing at
   `docs/parity-report.md` (and the published /parity page) as the single
   status surface. Do not maintain a second list.
2. `docs/svg-conformance.md` § Current status: replace the 5-fixture table
   with a pointer to the report plus the current description pin count.
3. `planning/next-missions.md`: add a dated entry at the top of the
   "Done" region for this mission: what was refreshed, the headline
   per-type numbers, and the D9 rule ("every re-pin regenerates the
   report"). Do not rewrite older entries.
4. `planning/mission-index.md` Snapshot: append a dated bullet with the
   per-type numbers and the commit they were measured at; leave older
   bullets untouched (the file's own convention).

## Write-set
`README.md`, `docs/svg-conformance.md`, `planning/next-missions.md`,
`planning/mission-index.md`

## Read-set
- `docs/parity-report.md` (whole, regenerated)
- `README.md:90-105`; `docs/svg-conformance.md:287-330`
- `planning/next-missions.md:1-40`; `planning/mission-index.md:256-275`
- `plans/parity-dashboard-refresh/decisions.md#d9`

## Acceptance criteria
1. Given the README, when read, then no per-type status table remains
   and the pointer resolves to `docs/parity-report.md`.
2. Given the Snapshot, when read, then the new bullet carries a date, a
   commit hash and per-type numbers copied from the report.
3. Every number written appears verbatim in `docs/parity-report.md`.

## Observability / Rollback
N/A / Reversible.

## Quality bar
`npm run lint` (markdown untouched by eslint) and `npm run format:check`
green; `npm test` unaffected. Prettier runs on commit.

## Boundaries
Never invent or recompute a number; copy from the report. Never edit
generated files.

## Commit
`docs(pdr-T8): record the parity dashboard refresh`
