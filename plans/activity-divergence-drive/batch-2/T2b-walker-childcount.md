# T2b — walker childCount (missing/extra elements from the walk)

Agent: typescript-pro, worktree `add1-T2b`. Commit: `fix(activity): <mechanism>`.

## Context
174 fixtures carry `g[childCount]` diffs. Two filed mechanisms live in the
walk, not the renderer: `activity-detach-as-stop` (`tile-layout.ts` builds
`kill`/`detach` as a drawn `GtileStop` + in-edge; the jar's `InstructionSimple
.kill()` only MUTATES the preceding instruction, `InstructionList.java:169-
173`, `InstructionSimple.java:124-126` — +2 lines/+2 arrowheads/+1 shape on
every `detach` fixture, `gevaxi`, `maketa`) and `activity-note-sibling-links`
(our AST models a note as a sibling node, so `gtile-top-down.ts` links into
and out of every note tile; the jar attaches notes via `FtileWithNotes` and
draws no link — `pifoni-76-duxa505`).

## Task
For each assigned row: `--dump <slug>` to name which elements are extra or
missing, then the Java construct, then the fix at the walker/dispatch — not a
renderer filter. `detach`: the preceding tile loses its out-point (the
`hasPointOut` seam T6b of `activity-loop-lane-translate` already made
trailing notes transparent to); `laneIn`/`laneOut` in `swimlane-lanes.ts` have
the same exposure — journal, re-slot to T2x if it needs that file. Notes:
skip note tiles when linking siblings. One commit per mechanism with a unit
pin quoting the Java.

## Write-set
`src/diagrams/activity/layout/tile-layout.ts`, `src/diagrams/activity/tiles/
gtile-top-down.ts`, `src/diagrams/activity/node-dispatch.ts`,
`tests/unit/activity/**`, `tests/diagrams/activity/tiles/**`.

## Read-set
`decisions.md#D6`; assigned rows; `planning/next-missions.md` entries
`activity-detach-as-stop`, `activity-note-sibling-links`; `tile-layout.ts`
(the kill/detach and note branches); `gtile-top-down.ts` (whole, 101); Java
`InstructionList.java:160-180`, `InstructionSimple.java:115-130`,
`ftile/vcompact/FtileWithNotes.java` (constructor + `drawU`).

## Acceptance
- Given a `detach` fixture, when rendered, then no extra stop shape, line or
  arrowhead; given `pifoni-76-duxa505`, then no note links.
- Given each assigned row, then its `childCount` diff is 0 or the residual is
  mechanised and re-slotted; 0 unexplained rises.

Quality bar: targeted vitest + typecheck + eslint. Boundaries: layout walkers
(T2a) and renderer files (T2c) read-only. Observability: N/A. Rollback:
Reversible.


## Assigned at the b1b close (2026-10-01, journal row 21) — supersedes the write-set above

Rows by named next mechanism:
- **kill/detach as mutation (InstructionSimple.kill)**: `piruxe-91-zivi081`, `simuti-16-lece058`

Source write-set: `src/diagrams/activity/layout/tile-layout.ts`, `src/diagrams/activity/tiles/{gtile-top-down,gtile-kill}.ts`, `src/diagrams/activity/{node-dispatch,dispatch-support}.ts`, plus the tests exercising those files and new tests. Rules: see `overview.md` (no Serena edits, no baseline writes, risers shown from the diff).

The note-sibling-links mechanism has no cohort row at b1b — out of scope this round.
