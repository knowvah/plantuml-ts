# T0 — branch and baseline b0

**Agent:** orchestrator.
**Writes:** `plans/component-divergence-drive/measurements/b0*`, `decision-journal.md`,
`fixtures.md` (the b0 column and the census table).

## Steps
1. Confirm `git status` is clean on main at `306a81151`, or at a later sha (journal the sha). Then
   `git switch -c feat/component-divergence-drive`, and commit the brief with
   `docs(codd): add mission brief`.
2. Run `bash measurements/gates.sh b0`. If any gate is red: stop. Record the exact failing test
   names in `decisions.md` as a known baseline, per the pre-flight rule.
3. Run `bash measurements/chain.sh b0-eng` (every `test-results/dot-cache/*` tree).
4. Census:
   - `npx tsx scripts/svg-conformance-census.ts component --json measurements/b0-census.json`
   - the same for `--per-fixture` (`b0-perfix.txt`) and `--families` (`b0-families.txt`)
   - repeat for usecase (collateral)
   - Check the result against `measurements/seed/perfix-306a81151.txt`. A difference from the
     planning numbers needs a journal row.
5. Name the instrument path behind the gevaje/kokebo/tusugu census-vs-render-diff disagreement
   (`fixtures.md`, "Instrument note"). Read `scripts/svg-conformance-census.ts` and
   `plans/class-divergence-drive/tools/render-diff.mts` to find which input or comparator differs.
   Journal it. If it is a census defect, it is a T1a input.
6. Record in the journal, per engine:
   - conformant/structural/diverged
   - the `dotEqual` and `layoutEqual` true counts
   - ratchet pin counts (`oracle/goldens/svg-*/ratchet.json`)
   - the census Σ and buckets
   Check them against `docs/parity-report.md`.
7. Fill the blank b0 cells of `fixtures.md` with `npx jiti
   plans/class-divergence-drive/tools/render-diff.mts <tree>/<slug>`.

## Acceptance
- Given main at the start sha, when the survey runs, then component reads 69/70/127 and usecase
  30/17/46, or the journal explains the difference.
- Given the four gates, then all pass, or the failures are recorded as a known baseline before
  batch 1 starts.
- Given the census, then Σ and the buckets are journaled, and the D1 60% target is computed from b0.

**Observability:** this task IS the baseline instrumentation. **Rollback:** Reversible (measurement only).
