# T11 — re-measure, re-pin, D1 check

**Agent:** orchestrator. **Write-set:** the close-procedure write-set.

## Steps
1. Run the standard close ([../close-procedure.md](../close-procedure.md)) as `b5`, diffing against
   **b0** as well as b4.
2. Re-pin:
   - the description ratchet (all four types under T1a's eligibility)
   - the layout-parity ratchet: add every newly layout-equal description-family row; additive only
   - the census pins (`census-component.json`, `census-usecase.json`): only rows that fell
   - the diff-baseline (tighten only)
   Diff every baseline JSON after writing. A pin that ROSE is stop 6.
3. Check D1 clause by clause, and journal each:
   1. component conformant ≥ 100
   2. each b0 1–3-diff row is pinned or ledgered (fill `fixtures.md`'s ledger table; one line each)
   3. census Σ ≤ 60% of b0
   4. losses = 0
   5. rises are all explained
4. If D1 is missed, list the gap per clause with mechanisms. T12 files it. Do not add tasks after
   T11 without a journaled push-forward reason that names a stated mechanism and a single-file fix.
5. Regenerate the dashboard and commit `docs/parity-report.md`.

## Acceptance
- Given the b0 → b5 diff, then every mover in every engine has a journal row with a mechanism, and
  losses = 0.
- Given D1, then each clause is journaled as met, or as missed with its gap list.

**Observability:** this is the final SLI record before exit. **Rollback:** Reversible.
