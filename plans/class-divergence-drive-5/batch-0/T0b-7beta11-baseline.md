# T0b: 7beta11 baseline across every engine

**Context.** T0b and T0d run the same `src/`. The only thing that changes between
them is the oracle cache, so every T0b→T0d mover is a pure oracle effect. The
committed `parity-*.json` files are NOT a valid baseline: some engines' pins are
stale (cdd4 D7). Measure fresh.

**Task.**
1. Record `uptime`. If the 1-min load is above 8, wait (Monitor with an until-loop)
   or note it.
2. For each engine in `ls test-results/dot-cache`, run:
   `npm run svg:survey -- <e> --out plans/class-divergence-drive-5/measurements/b0-7beta11/parity-<e>.json`.
   Re-survey any engine with timeouts at load below 8. Timeouts remaining after
   that are stop 7.
3. Run `npx jiti scripts/svg-conformance-census.ts class --json .../b0-7beta11/census-class.json`.
4. Run `npx jiti plans/class-divergence-drive/tools/render-all.mts .../b0-7beta11/render-all-class.json`.
5. Write `.../b0-7beta11/SUMMARY.md` with one row per engine
   (verdict counts, `dotEqual` true count) and the unknown-bucket CLASS subset. The
   subset comes from `oracle/goldens/svg-conformance/routing-baseline.json` rows with
   `type: unknown` whose `jarType` or `ourType` is `CLASS`.
6. Journal the per-engine counts. Commit
   `chore(cdd5-T0b): measure 7beta11 baseline for every engine`.

**Write-set:** `plans/class-divergence-drive-5/measurements/b0-7beta11/**`,
`decision-journal.md`. Nothing under `tests/`: use `--out` paths only.

**Acceptance.**
- Given all 28 engines surveyed, then 0 timeouts remain (re-surveyed at load below 8).
- Given the class summary, then it reads 707 / 3 / 13, as on main.
  A difference is a measurement artifact; find it before continuing (memory:
  measurement-artifacts-outnumber-defects).

**Observability:** N/A. **Rollback:** Reversible.
