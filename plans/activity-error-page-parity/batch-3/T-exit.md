# T-exit (orchestrator)

1. Clean checkout; all batch-2 branches merged.
2. `measurements/survey-all.sh measurements/final-eng`;
   `python3 measurements/engdiff.py measurements/b0-eng measurements/final-eng`.
   - Activity non-conformant must be exactly {bozido-07-geze049}.
   - 0 conformant losses (stop 4); list every non-activity error-conformant
     gain by name in the journal (stop 6 if > 10 in one bucket).
3. Copy the final survey files over `tests/oracle/svg-conformance/parity-*.json`
   (every engine — the committed files are what the dashboard reads).
4. Re-pin activity baselines if any batch moved bytes (close-procedure step 4)
   and run `census-away.py` against `measurements/b0-census/` (stop 5).
5. Regenerate the dashboard (`scripts/parity-dashboard.ts`) and
   `npm run catalog`; both drift gates green.
6. Four gates + full conformance/activity/architecture set + typecheck;
   collected = on-disk.
7. Fill `fixtures.md` `final`; journal the `close` row (b0 → final per engine).
8. Merge `feat/activity-error-page-parity` into main with a merge commit
   (`merge(aepp): activity error-page parity …`). Do not push.

## Acceptance
- Given final, then activity's only non-conformant row is bozido, 0
  conformant losses in any engine, 0 census attributes away from the jar.
- Given the dashboard, then activity shows the error-conformant count.

## Observability / Rollback
Dashboard regenerated. Reversible (revert the merge commit).
