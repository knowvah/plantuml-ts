# T0a: branch, b0, ledger

Agent: orchestrator.

## Task
1. `git checkout -b feat/utility-factories-port` off a clean main; commit the brief. Copy
   `settings.autonomous.json` to `.claude/settings.autonomous.json` if absent.
2. Four gates → `measurements/b0-{vitest.json,npm-test.log,typecheck.log,lint.log,build.log}`
   (collected = on-disk). Record `npm run build` output size (`du -sk dist`, plus the main bundle
   file sizes) in `measurements/b0-size.txt` — stop 12's baseline.
3. Surveys of every engine → `measurements/b0-eng/parity-<e>.json` via `chain.sh b0-eng`;
   `render-diff` on the 17 rows → `measurements/b0-rd/`.
4. Fill `fixtures.md`: verdict, S/N, routing/refusal status per row. Confirm the count of 17 by
   grepping every `test-results/dot-cache/*/*/in.puml` for each in-scope literal on the first
   content line (a different count is journaled and the ledger corrected).
5. Record checks (`fixtures.md` "Record checks"): measure the creole/math/latex/def `ok` rows and
   `vesuzo-97-jelo022` with the refusal gate's own `measure`; journal what they really measure.
   They are OUT of scope — journal, do not fix.
6. Journal: the 17-row correction (the planning chat said 18), b0 numbers, record checks.
7. Commit `chore(ufp-b0): branch, b0 baseline, ledger`.

## Acceptance
- Given b0, then the 17 rows read non-conformant (or the difference is journaled).
- Given `fixtures.md`, then every row has a b0 verdict, S/N and baseline status.

**Observability:** N/A. **Rollback:** Reversible.
