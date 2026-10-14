# T0 — branch and baseline b0

**Agent:** orchestrator. **Writes:** `plans/description-svek-wrappers/measurements/**`,
`decision-journal.md`, `fixtures.md` (b0 column).

## Steps
1. `git status` clean on main at `650f08bcc` (or later, journal the sha);
   `git switch -c feat/description-svek-wrappers`.
2. Write `measurements/chain.sh`, copied from `plans/utility-factories-port/measurements/chain.sh`
   with `M=plans/description-svek-wrappers/measurements/${1:?bN-eng}`. Commit it with the brief.
3. Run the four gates on the branch (background, JSON reporter). Record pass/fail and the collected
   count. If any is red: stop and record the exact failing test names in `decisions.md` as a known
   baseline, per the pre-flight rule.
4. `bash measurements/chain.sh b0-eng` (every `test-results/dot-cache/*` tree).
5. Record in the journal, per engine: conformant/structural/diverged, `dotEqual` true count, ratchet
   pin counts (`oracle/goldens/svg-*/ratchet.json`), census 0-diff counts
   (`tests/oracle/svg-conformance/census-*.json`). Check them against `docs/parity-report.md`.
6. Fill the b0 column of `fixtures.md`: render-diff counts per named fixture
   (`npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree>/<slug>`).
7. Dev-box cross-check of the gate premise: for bamami and xenusu, run native
   `dot -Tdot test-results/dot-cache/<tree>/<slug>/svek-1.dot` and keep the output in
   `measurements/b0-native/` for T1a's stop-8 check.

## Acceptance
- Given main at the start sha, when the survey runs, then component reads 0/13/253 and usecase
  2/2/89, or the journal explains the difference.
- Given the four gates, then all pass, or the failures are recorded as a known baseline before
  batch 1 starts.

**Observability:** this task IS the baseline instrumentation. **Rollback:** Reversible (measurement only).
