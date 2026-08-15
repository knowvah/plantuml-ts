# Batch 4 — disarm the collisions, then close

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T4 | Rename the six same-name-different-value collisions | typescript-pro | the colliding modules + their references | B2, B3 | [ ] |
| T5 | Sweep, ledger, close | typescript-pro | brief + `.agent-notes/` | T4 | [ ] |

Serial. T5 writes no `src/`.

Runs LAST on purpose: Batches 2 and 3 may resolve part of a collision by
consolidating one side of it. `MARGIN`'s three state 5s, for instance, may
become one `IEntityImage.MARGIN` owner in Batch 2, leaving a smaller and
clearer collision to rename here.

## Batch exit bar

1. No name in `src/` holds two different numeric values (excluding
   `known-exception` rows).
2. Each rename is behaviour-neutral: same value at every site, only the
   identifier changed.
3. **`shape-match-report.ts` reports 776 / 25695 EXACTLY.**
4. Final inventory recorded against the Batch 1 baseline, with every
   remaining duplicate explained.
5. All four gates green.
