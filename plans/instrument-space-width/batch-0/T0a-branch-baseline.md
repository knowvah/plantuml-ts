# T0a — branch and b0 baseline (orchestrator)

1. `git checkout -b feat/instrument-space-width main` (main carries the brief
   commit). Journal the SHA.
2. `measurements/survey-all.sh measurements/b0-eng` (28 engines, sequential,
   no agents surveying). Re-survey any engine with a timeout.
3. `seq-scores.mts` → `measurements/b0-seq.json`; record Σ.
4. `elements.mts` → `measurements/b0-elements.json` for class object state
   component usecase sequence unknown activity mindmap.
5. Pin snapshot: copy every pin file into `measurements/b0-pins/`
   (`oracle/goldens/**/*.json`, `tests/oracle/svg-conformance/{parity,census}-*.json`,
   `oracle/goldens/**/ratchet.json`, `oracle/accepted-divergences.json`).
6. Write `measurements/production-manifest.mts`: render every
   `test-results/dot-cache/*/*/in.puml` through `renderSync` with the DEFAULT
   options (production `jarMeasurer`, the survey's asset/include stores) and
   write `{ "<engine>/<slug>": sha256(svg) | { err } }`; `--diff <prev.json>`
   prints changed keys and exits non-zero on any. Run → `measurements/b0-prod.json`.
7. Instrument probes into `fixtures.md` b0: `DeterministicMeasurer.measure(" ")`
   at 12 pt; `"a b"` ours vs a fresh old-jar `textLength`.
8. Fill `fixtures.md` b0; journal row 1 (SHAs, Σ, counts).

**Acceptance:** branch exists; `b0-eng` has 28 engines, 0 timeouts;
`b0-prod.json` has one row per corpus fixture; `fixtures.md` b0 column full.
**Observability:** N/A — measurement only. **Rollback:** reversible (measurement files).
