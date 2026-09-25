# T6 — batch-0 close: re-group and write batch 1–4 write-sets

**Agent:** orchestrator · **Depends on:** T1–T5

## Task

1. Read `diagnosis/{Q,C,R,D,S}.md`. Spot-check every HIGH claim that a fix
   will depend on: re-run its probe (memory: subagent reports carried
   confident claims measurement disproved). Downgrade what does not
   reproduce and journal it.
2. `fixtures.md`: fill `mechanism` for all 62; move a fixture's
   group/task when its mechanism belongs elsewhere; mark `final` =
   `open -> <owner>` now for any fixture whose owner is outside this
   mission (dot-engine → draft `docs/graphviz-issues/` + `TRACKER.md` line).
3. For each of batches 1–4, rewrite the task files' **Write-set** and
   **Mechanisms** sections from the reports' fix shapes. Split a task whose
   mechanisms touch disjoint files and are large; merge tasks that share a
   file. Within a batch, no two parallel tasks may share a file — set the
   overview's `Depends On` column to serialise any that do.
4. If a mechanism appears in more than one group (e.g. a Q residual that is
   really R's ink term), assign it to the EARLIEST batch in D2 order and
   point the later fixtures at it.
5. Journal the regrouping (counts per task before/after) and any
   out-of-mission fixture a report pulled in (README "Out of mission").
6. Measurement: none needed (no `src/` change). Tick batch 0 in README.
7. Commit `docs(cdd2-b0): close batch 0 — diagnosis folded, write-sets set`.

## Acceptance criteria

- Given 62 core fixtures, when T6 commits, then each has a mechanism id
  and exactly one fix task or an out-of-mission `final`
- Given batches 1–4, when their overviews are read, then no two tasks
  without a `Depends On` edge share a write-set file
- Given a HIGH mechanism a fix relies on, when its probe is re-run, then it
  reproduces, or it is downgraded and journaled

## Observability · Rollback

N/A. Reversible.
