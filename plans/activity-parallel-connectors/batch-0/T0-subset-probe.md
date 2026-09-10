# T0 — Subset probe and pre-change record

**Agent:** orchestrator · **Depends on:** —

## Task

1. Build the probe described in [`overview.md`](overview.md#the-probe) and
   run it at the branch tip; confirm 43977 / 8218 and zero movers.
2. Count near-zero segments (|dx|, |dy| ≤ 0.01) in the JAR goldens: 7 on
   3 fixtures (`jupoxe-15-sugo110`, `racana-82-zece676`,
   `sopape-11-laxo488`). Record them: D2's evidence that upstream keeps
   near-equal points.
3. Dump, for `simuti-16-lece058` (split, no lanes) and
   `bixefi-77-moki051` (fork, three lanes), the jar's `<line>`/`<rect>`
   list beside ours, so T2–T5 have the target shapes in the notes.
4. Write `.agent-notes/apc-T0.md`: the numbers above, the 32-fixture list
   with scores, how many have lanes (17) and a terminating branch (21).

## Acceptance criteria

- Given the branch tip, when the probe runs, then it prints aggregate
  43977 -> 43977, subset 8218 -> 8218, 0 risers, 0 fallers, and our
  zero-length count 2
- Given the goldens, then the seven near-zero segments are listed by fixture

## Observability / Rollback

N/A / **Reversible** (a note only).

## Quality bar

The four gates are untouched by this task; run the four activity oracle
gates once to confirm 1260/1260 at the branch tip.

## Commit

`docs(apc-T0): record the split/fork subset before the parallel port`
