# T6 — batch-0 close: fold diagnoses, write batches 2–4

**Agent:** orchestrator · **Depends on:** T1–T5

## Task

1. Commit each report as it lands (`docs(cdd3-T<n>): diagnose <group>`).
2. Spot-check every HIGH claim a fix will rely on by re-running its probe
   (prior missions: two dot-engine and three canvas claims fell to this).
   Downgrade and journal what does not reproduce.
3. `fixtures.md`: fill `mechanism` for all rows in C, E and B; move rows
   between workstreams/tasks where the mechanism says so (a B row that is
   not dot-engine's joins a fix batch; an E row sharing a workstream-A
   mechanism joins batch 1's task if it has not run yet, else the batch
   whose files it touches); set `final` now for confirmed dot-engine rows
   (`open -> docs/graphviz-issues/<n>`) and proposed acceptances (D6).
4. Write `batch-2/`, `batch-3/`, `batch-4/` overviews and task files from
   the fix shapes, grouped structure → paint/text → geometry (D1 order),
   each task ≤ ~15 min of agent work, primaries disjoint within a
   parallel wave (D4), a close task per batch.
5. Journal the regrouping (counts per task before/after). Tick batch 0.
6. Commit `docs(cdd3-b0): close batch 0 — diagnoses folded, batches 2–4 written`.

## Acceptance criteria

- Given 105 rows, when T6 commits, then each has a mechanism id and one
  owning task, or a `final` naming an owner outside this mission
- Given batches 2–4, when their overviews are read, then no two tasks in
  one parallel wave share a primary file
- Given a HIGH mechanism a fix relies on, when its probe is re-run, then it
  reproduces, or it is downgraded and journaled

## Observability · Rollback

N/A. Reversible.
