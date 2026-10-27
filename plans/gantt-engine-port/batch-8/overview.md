# Batch 8 — first conformance pass (2–4 families, decided at the batch-7 close)

Orchestrator plans this batch from the batch-7 family table (`fixtures.md`).
Only cross-cutting families — one mechanism behind many rows — qualify; a
family's task is spawned only from a diagnosis artifact (stop 16). Single-row
residues go to `planning/next-missions.md` (gantt divergence drives).

## Planning step (orchestrator, before spawning)
1. From `$M/b7-eng/parity-gantt.json`, group diverged rows by normalised
   firstDiff and rank by row count.
2. For the top families (expected candidates: root/background/chrome,
   timeline header text and lines, task bar geometry, text measurement), read
   the Java behind the first differing attribute and write
   `diagnosis/F<n>-<family>.md`: mechanism, origin `file:line`, causal chain,
   ruled out, rows affected, write-set.
3. Pick at most 4 families whose write-sets are disjoint; write one task spec
   per family as `batch-8/T8<x>-<family>.md` from
   [T8-template.md](T8-template.md); add them to the table below; journal the
   write-sets before spawning.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| (filled at the batch-7 close) | | typescript-pro (sonnet) | per diagnosis artifact | B7 | [ ] |
| close | merge, gates, chain vs b7, re-pin gantt rows that moved toward the jar | orchestrator | per close-procedure | T8* | [ ] |
