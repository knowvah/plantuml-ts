# T0e: close batch 0 and set the baseline

Agent: orchestrator.

**Task.**
1. Merge T0b and T0c (close-procedure step 1). Four gates.
2. Survey all 28 engines into `measurements/b0-eng/parity-<e>.json` (the class and
   unknown files also to `tests/oracle/svg-conformance/parity-{class,unknown}.json`),
   census class, `render-all --tree all` → `measurements/b0.json`. 0 timeouts at load < 8.
3. Diff against the committed parity files: every verdict/dotEqual change must be
   explained by T0b's instrument fixes (journal each).
4. Merge T0d's verdicts into `fixtures.md` (`cdd6 mechanism`, `task`); rows T0d sets
   `open -> cdd7` get that `final`. Amend the batch 2–3 task specs' row lists and
   write-sets where T0d names a different owner (journal each re-slot; no write-set
   collision within a batch, stop 1). File any verified dot-engine finding
   (`docs/graphviz-issues/` + TRACKER line).
5. Pin anything the fixed instruments made eligible (close-procedure step 10).
6. Journal the D10 target: b0 CLASS conformant (both trees, CLASS-routed) + rows
   scheduled in batches 1–3.
7. Commit `chore(cdd6-b0): baseline — <CLASS conformant>, target <n>`.

**Write-set:** `measurements/b0*`, `fixtures.md`, `batch-{2,3}/*.md`, journal, the
close-procedure step-10 files, `docs/graphviz-issues/**`.

**Acceptance.**
- Given b0, then survey, census and render-all agree on every CLASS row.
- Given the journal, then it holds the target and its derivation.
- Given `fixtures.md`, then every row has an owner task or a `final`.

**Observability:** N/A. **Rollback:** Reversible.
