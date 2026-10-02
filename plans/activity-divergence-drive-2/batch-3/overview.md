# Batch 3 — drive round on the b2 cohort (D5)

Written at the b2 close (step 9 of the close procedure): the cohort is every
un-pinned `baseline` row with ws ≤ 150 at `measurements/b2.json`; each row's next
mechanism is named (`--dump`, `--align`, the Java) and assigned to a family task
T3a–T3n with disjoint write-sets (≤ 5 tasks per overview; split into 3a/3b
otherwise). Specs follow the batch-2 template (`../batch-2a/T2a-condition-style.md`).
Close per [close-procedure.md](../close-procedure.md) (`b3`) — pin round 2.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3a–T3n | (written at the b2 close) | typescript-pro | (disjoint, per family) | T2-close | [ ] |
| T3-close | b3, all-engine diff, re-pins, pin round 2 | orchestrator | per close-procedure | T3a–T3n | [ ] |
