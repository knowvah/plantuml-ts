# T0 — branch + b0 baseline (orchestrator)

## Context
Main `191253829`. The committed dashboard says activity 409/5/37, but it reads
a survey generated 2026-10-08, before isw re-captured the oracle. A fresh
survey at planning gave 433/1/17 (18 rows, `fixtures.md`).

## Task
1. `git switch -c feat/activity-error-page-parity` from clean main `191253829`.
2. Commit the brief: `docs(aepp): add mission brief`.
3. `measurements/survey-all.sh measurements/b0-eng` (sequential, all engines).
   Confirm activity = 433 / 1 / 17 and the 18 slugs equal `fixtures.md`.
   A different count: journal it, re-derive `fixtures.md`, continue (push-forward)
   unless an activity row is NEW (then stop 3).
4. Snapshot the activity census inputs: copy the four
   `oracle/goldens/svg-activity/{diff,style,text,swimlane}-baseline.json` to
   `measurements/b0-census/`.
5. Run the four gates once; record collected = on-disk.
6. Journal a `close` row (b0 counts per engine, gates); commit `chore(aepp-b0): baseline`.

## Write-set
`plans/activity-error-page-parity/**` only.

## Acceptance
- Given clean main, when T0 runs, then `measurements/b0-eng/parity-<bucket>.json`
  exists for every bucket and activity reads 433/1/17.
- Given the gates, then all four are green and collected = on-disk.

## Observability
N/A — measurement only.

## Rollback
Reversible (delete the branch).
