# T8 — Close-out

## Context

Mission `edge-label-box-followups`; every number below must come from a
command run during close-out **on a clean tree at the final commit**, not
carried from a task's journal. SI23's T13 (`plans/edge-label-box-backlog/
batch-7/T13-close-out.md` and the README's close-out section) is the template
and the bar for honesty.

## Task

1. Measure: `npx jiti scripts/label-box-triage.ts`; `dot-sync-report` for
   class, state, description, object; `shape-match-report` (per-fixture diff
   against the mission's captured baseline, not totals); test count/coverage;
   ratchet pins.
2. Score the exit bar clause by clause in `README.md` (append a "Close-out"
   section: table, ✓/✗ per clause, measurement column). Do not reword a clause.
3. Residue table: every remaining slug per backlog with its mechanism or
   "undiagnosed" — carry SI23's out-of-scope entries forward verbatim.
4. `planning/mission-index.md`: add row **SI24** with the measurements;
   `planning/next-missions.md`: mark this mission done, name the follow-ons
   (note-on-link SVG shape for three engines; the seam mission's now-four Rose
   copies; T7 sites if skipped; any new mechanism found).
5. `plans/edge-label-box-backlog/README.md`: correct the `vuresa` residue line's
   sign reasoning (`decisions.md#the-two-formerly-undiagnosed-slugs`) — one
   line, nothing else in that file.
6. Journal: task count planned vs executed, decisions flagged for review,
   gate results.

## Write-set

`plans/edge-label-box-followups/README.md`, `decision-journal.md`,
`planning/mission-index.md`, `planning/next-missions.md`,
`plans/edge-label-box-backlog/README.md`.

## Read-set

`plans/edge-label-box-backlog/README.md:147-235`, `batch-7/T13-close-out.md`,
`planning/mission-index.md` (SI22/SI23 rows for format), this mission's
`decision-journal.md`.

## Acceptance criteria

- **Given** each clause, **then** it is scored with a command-run measurement.
- **Given** the residue, **then** no slug lacks a mechanism or an explicit "undiagnosed".
- **Given** `next-missions.md`, **then** its standing-signals block is refreshed
  from these measurements and dated.

## Rollback

Reversible — docs only.

## Commit

`docs(T8): close edge-label-box-followups — scored bar, residue, SI24 row`
