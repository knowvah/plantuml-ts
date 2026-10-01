# Batch 3 — drive round 2 (D6)

After the b2 close. Same shape as batch 2: the close's step 9 re-cuts the
cohort (un-pinned `baseline` rows with ws ≤ 100 at b2), names each row's next
mechanism, and writes this table — families T3a–T3n with disjoint write-sets
(the batch-2 partition is the default: layout walkers / tile-layout+dispatch /
renderer / tiles). Task specs follow the batch-2 templates (`T2a`–`T2d`) with
the rows substituted. Close per [close-procedure.md](../close-procedure.md)
(`b3`) — pin round 2.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3a–T3n | (written at the b2 close) | typescript-pro | (disjoint, per family) | T2-close | [ ] |
| T3-close | b3, all-engine diff, re-pins, pin round 2, re-cut cohort | orchestrator | per close-procedure | T3a–T3n | [ ] |

If the b2 cohort is empty of un-mechanised rows under ws ≤ 100, raise the cut
to ≤ 150 (push-forward, journaled) rather than skipping the round.
