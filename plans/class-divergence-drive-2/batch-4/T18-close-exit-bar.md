# T18 — batch-4 close, exit bar, batch-5 decision

**Agent:** orchestrator · **Depends on:** T17

## Task

1. [`../close-procedure.md`](../close-procedure.md) steps 1–13 for batch 4.
2. Exit bar (D8), measured from `measurements/b4.json`: conformant ≥ 600,
   diverged ≤ 61, all 62 core rows have a `final`. Write the measured
   numbers into the README under a `## Status` heading.
3. **If conformant ≥ 600:** run a 30-minute read-only pass over the 22
   stretch fixtures (`fixtures.md` group X) with `render-diff.mts`, pair
   them by shared first-diff, and write `batch-5/overview.md` +
   `batch-5/T19-*.md …` using [`../fix-task.md`](../fix-task.md), same
   rules (write-sets disjoint, one close). popesa's first read is the
   def-id seed filing in `planning/next-missions.md` ("Seed input for def
   ids").
4. **Else:** file the stretch pairs in `planning/next-missions.md` under
   this mission's heading, mark batch 5 skipped in README, go to T20.

## Acceptance criteria

- Given `b4.json`, when the exit bar is evaluated, then the README states
  each clause as met or not, with the number
- Given the D9 gate, when conformant ≥ 600, then batch-5 task files exist
  with disjoint write-sets; otherwise the pairs are filed

## Observability · Rollback

N/A. Reversible.
