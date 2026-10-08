# T0a — branch and baseline (orchestrator)

1. `git checkout -b feat/large-group-mirror main` (main carries the brief commit
   on top of `b46435b10`; journal the SHA).
2. `measurements/survey-all.sh plans/large-group-mirror/measurements/b0-eng`
   (all 28 engines, sequential). Re-survey any engine with a timeout.
3. Sequence: score every `oracle/goldens/svg-sequence/diff-baseline.json` row
   with `measurements/seq-scores.mts` into `measurements/b0-seq.json`; record Σ.
4. Element counts (write `measurements/elements.mts`, modelled on
   `seq-scores.mts`, rendering through each engine's `render-fixture-*.ts`
   harness or `renderSync`): per-tag counts ours vs jar for every class, object, state,
   component, usecase, sequence, unknown fixture into
   `measurements/b0-elements.json` (the D5 reference).
5. Fill the `b0` column of `fixtures.md` (verdict / ws / diff count) and
   journal row 1 with the SHAs and Σ.
