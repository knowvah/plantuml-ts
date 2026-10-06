# T0a — branch, b0 baseline, tmp1 retirement, ledger (orchestrator)

1. `git checkout -b feat/activity-divergence-drive-3 main`; commit the brief.
2. b0: probe/classify/elements into `measurements/b0*.json`; `measurements/survey-all.sh measurements/b0-eng`.
   Expect Σ 16937 over 126 rows (planning).
3. Retire `tmp1` (D9): remove its rows from the four activity baselines and the
   routing/refusal baselines (both trees), update every count assertion with a
   derivation comment; re-run b0 probe (Σ 16937 - 164 expected; record exact).
   Commit `chore(add3-T0a): retire tmp1, a duplicate of ruzazu-94-meso880`.
4. `fixtures.md`: one row per un-pinned baseline row: slug | ws (b0) | element
   shape (b0) | census family | task | mechanism | final. Journal row 1.
5. Launch T0c/T0d (after step 3) and T0b (any time).

Acceptance: b0 Σ recorded; tmp1 absent from every manifest; gates green.
Observability: N/A. Rollback: Reversible.
