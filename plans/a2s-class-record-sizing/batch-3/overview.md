# Batch 3 — Residual round (R1)

After Batch 2 lands and gates pass, re-measure and re-cluster the
remainder. The ~300-fixture small-delta tail is expected to collapse
substantially once the shared mechanisms land — measure, don't assume.

## Procedure (orchestrator + instantiated tasks)

1. `npx tsx scripts/measure-class-size-deltas.ts` → capture the new
   summary and per-fixture lines to the decision journal.
2. Re-cluster the remaining non-conformant entries by identical delta
   (same python as batch-1/clusters.md; regenerate that file in place with
   a dated heading).
3. For clusters of ≥3 fixtures: instantiate new D-tasks (same template as
   Batch 1, same output schema) and then F-tasks (same ownership map as
   Batch 2). Run as many D→F rounds as productive.
4. For clusters of 1-2 fixtures: diagnose the cheapest first (probe reuse
   from earlier rounds); anything still open after a bounded attempt gets
   a ledger.md entry naming its mechanism hypothesis and evidence so far.
5. Stop the loop when a full round closes <5 fixtures AND every remaining
   non-conformant fixture has either an active diagnosis or a ledger
   entry. That is the ADR-3 exit state.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|------------|------|
| R1 | Re-measure + re-cluster + instantiate follow-on D/F rounds | orchestrator (+ spawned tasks per template) | batch-1/clusters.md (regenerated), decision-journal.md; spawned tasks per Batch-1/2 write-sets | F1–F4 | [ ] |

Same stop conditions as the README. Every round's gate pass = the full
four gates + all four ratchet commands.
