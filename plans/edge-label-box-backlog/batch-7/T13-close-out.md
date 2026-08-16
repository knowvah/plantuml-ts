# T13 — Close out the mission

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML. This mission worked
the 50-slug edge-label reserved-box backlog that SI22's D7 surfaced, across four
mechanisms (M1–M4). Close it out.

Close-out is not paperwork here. The last three missions in this line each left
a stale status that cost the next reader real time —
`planning/next-missions.md` listed two shipped missions as "not started", and
SI22 was found with `[ ]` checkboxes on work that had already landed. Verify
against the **tree**, not against what the briefs claim.

## Task

1. **Score the exit bar, clause by clause, with the measurement attached.**
   The five clauses are in [README.md](../README.md#exit-bar). Mark each ✓ or
   ✗. An unmet clause is named with its number, not softened.
2. **Every remaining backlog slug carries a named mechanism** — or an explicit
   "undiagnosed" with the ruled-out list from its diagnosis note. Count what
   remains per type.
3. **Correct the 2026-08-15 shape survey** in
   `plans/edge-label-box-and-class-ports/decision-journal.md`'s successor
   record: `lozego-15-coci435` was read as "multi-line measured as one line"
   (it is a note-on-link merged box, M2) and the `givoli` family as a tail-box
   size delta (it is a tail/head swap, M3). Record the correction in this
   mission's journal — do not edit the closed mission's journal.
4. **Add the `planning/mission-index.md` row**: mechanisms, before/after
   numbers, what was delivered, what was not, and any hand-offs.
5. **Refresh `planning/next-missions.md`**: drop this mission from the queue,
   promote whatever now leads, and add any follow-on this mission surfaced —
   including the M3 hand-off to edge-draw-order if D5's stop fired.
6. **Record the module's new public surface** — `computeQuantifierBox`,
   `computeMergedLabelBox`, the cardinality cascade, `scripts/label-box-triage.ts`.
   CLAUDE.md points at `.claude/catalog.md` for this, but **that file does not
   exist in the repo** (verified 2026-08-16) and `.claude/` is gitignored, so
   anything written there would not be committed. Do **not** create it
   silently. Record the surface in this mission's journal, and flag the missing
   catalog in `planning/next-missions.md` as an unowned item — a CLAUDE.md rule
   pointing at a nonexistent file is the kind of stale premise this line keeps
   paying for.
7. **Write the session summary** at the bottom of `README.md`: tasks completed
   vs planned, decisions made, gate results, known issues and follow-ups.

## Write-set

- `planning/mission-index.md`
- `planning/next-missions.md`
- `plans/edge-label-box-backlog/README.md`
- `plans/edge-label-box-backlog/decision-journal.md`
- `src/diagrams/class/class-layout-edge-labels.ts` — **only** if T6 did not
  already correct the falsified `:25` comment about `cardinality` overrides

## Read-set

- `plans/edge-label-box-backlog/decision-journal.md` — every row
- `plans/edge-label-box-backlog/README.md#exit-bar`
- `.agent-notes/m3-tail-head-swap.md`, `.agent-notes/m4-single-line-width.md`
- The four `oracle/goldens/*/label-size-backlog.json` — final counts
- `planning/mission-index.md:131` — SI22's row, as the format to match
- `planning/next-missions.md` — the queue as it stands

## Acceptance criteria

- **Given** the exit bar, **when** scored, **then** each of the five clauses is
  marked ✓ or ✗ with its measurement, and no clause has been reworded.
- **Given** the remaining slugs, **when** counted, **then** each carries a named
  mechanism or an explicit "undiagnosed" — none is left unaccounted.
- **Given** `planning/mission-index.md`, **when** T13 lands, **then** a row for
  this mission exists carrying the before/after DOT EQUAL counts per type.
- **Given** `planning/next-missions.md`, **when** T13 lands, **then** it no
  longer lists this mission as pending and names any follow-on.
- **Given** the shape-survey corrections for `lozego` and `givoli`, **then**
  both are recorded in this mission's journal.
- **Given** all four gates, **when** run on the full branch, **then** they pass
  and the numbers are journalled.

## Quality bar

All four gates on the full feature branch: `npm test` (90/90/90),
`npm run typecheck`, `npm run lint`, `npm run build`. Plus a final:

```
npx jiti scripts/label-box-triage.ts
npx jiti scripts/shape-match-report.ts
for t in class object description state component usecase; do
  npx jiti scripts/dot-sync-report.ts $t
done
```

## Observability

This task **is** the mission's reporting surface. Every number that appears in
the mission-index row must come from a command run during close-out, not from
an earlier task's journal entry — those may be stale by now.

## Rollback

**Reversible** — documentation and one possible comment fix.

## Boundaries

- **Always:** verify batch and task status against the tree (commits, files,
  test output) before flipping a checkbox.
- **Always:** state unmet clauses with their measurement.
- **Never:** redefine the exit bar to make it look met.
- **Never:** claim a mechanism this mission did not deliver. If M3 or M4 was
  handed off or skipped, say so and name the owner.
- **Never:** edit a closed mission's decision journal.

## Commit

`docs(T13): close edge-label-box-backlog — scored bar, residue, index row`

Merge to main with a **merge commit**, not a squash — per-task commit IDs are
referenced throughout the journal.
