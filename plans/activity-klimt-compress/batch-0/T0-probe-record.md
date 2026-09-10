# T0 — Probe and pre-change record

**Agent:** orchestrator · **Depends on:** —

## Task

1. Build the probe ([`overview.md`](overview.md#the-probe)) and run it at the
   branch tip; confirm 42511 / 6752 and zero movers.
2. Record the aggregate x/width families (`rect[]/@x`, `text[]/@x`,
   `line[]/@x1`, `@x2`, `svg/@width`, `svg/@viewBox[]`, `polygon[]/@points`)
   and the same on the subset.
3. Count, by reading `in.puml`: fixtures with a fork/split of 2+ branches
   (X slots between branches), with swimlanes, with `if`/`while`/`repeat`
   hexagons (reservations).
4. Time the four activity oracle gates (`npx vitest run
   tests/oracle/svg-conformance/activity.*.test.ts --coverage.enabled=false`)
   three times; record the median (the wall-clock SLI, stop 13).
5. Dump ours-vs-jar for `zizaki-04-guvi945`, `simuti-16-lece058`,
   `bixefi-77-moki051`, one laned `if` fixture and one `while` fixture; state
   for each which gaps the jar removed (and did not), so T3–T5 have targets.
   Record the `zizaki` in-branch vertical spacing gap (52 vs 67) with the
   family weight it carries, as the filed non-goal.
6. Write `.agent-notes/akc-T0.md`.

## Acceptance criteria

- Given the tip, when the probe runs, then 42511 -> 42511, 6752 -> 6752,
  0 risers, 0 fallers
- Given `zizaki`, then the note records the bar as 125.4 vs 103.4 = 18 + 2 + 2
- Given the goldens, then the note names at least one fixture where Y
  compression bites, or states that none of the five dumped does

## Observability / Rollback

The probe IS the SLI instrument / **Reversible** (a note only).

## Quality bar

Untouched by this task; run the four activity oracle gates once (1260/1260).

## Commit

`docs(akc-T0): record the activity geometry before the compress port`
