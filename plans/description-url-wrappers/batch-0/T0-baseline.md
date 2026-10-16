# T0 — branch and baseline b0

**Agent:** orchestrator. **Writes:** `measurements/b0*`, `decision-journal.md`, `fixtures.md` (b0 column).

## Steps
1. Confirm `git status` is clean on main at `bb5b660d9` or later (journal the sha). `git switch -c
   feat/description-url-wrappers`; commit the brief: `docs(dur): add mission brief`.
2. `bash measurements/gates.sh b0`. A red gate: stop and record the exact failing test names in
   `decisions.md` as a known baseline.
3. `bash measurements/chain.sh b0-eng` (all `test-results/dot-cache/*` trees). Re-run any `timeout` rows.
4. Census: `npx tsx scripts/svg-conformance-census.ts component --json measurements/b0-census.json`,
   `… usecase --json measurements/b0-usecase-census.json`, plus `--per-fixture`/`--families` to `.txt`.
5. Render-diff every target row into `measurements/b0-rd/` and fill the b0 column of `fixtures.md`.
6. Journal per engine: conformant/structural/diverged, dotEqual/layoutEqual counts, ratchet pin counts
   (`oracle/goldens/svg-*/ratchet.json`, `layout-parity-baseline.json`), census Σ/zero-diff/buckets.

## Acceptance
- Given main at the start sha, when the survey runs, then component reads 180/12/74 and usecase 58/2/33,
  or the journal explains the difference.
- Given the four gates, then all pass, or failures are recorded as a known baseline before batch 1.
- Given the 19 target rows, then each has a b0 render-diff in `fixtures.md`.

**Observability:** this task IS the baseline. **Rollback:** Reversible (measurement only).
