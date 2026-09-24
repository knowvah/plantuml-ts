# Batch 0 — pre-flight + diagnosis

T0 cuts the branch and re-measures on `origin/main` (two commits past the
planning measurement, one of them in `applySeededDefIds`). T1–T5 then
diagnose the five groups in parallel, read-only on `src/`, each writing
only its own report. T6 folds the reports into `fixtures.md` and writes the
concrete write-sets for batches 1–4. No `src/` change in this batch.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Branch, re-measure, oracle record, commit brief | orchestrator | `measurements/b0.json`, `fixtures.md` (S/N cols), `decision-journal.md` | — | [ ] |
| T1 | Diagnose Q (23 qualifier/port links) | debugger | `diagnosis/Q.md` | T0 | [ ] |
| T2 | Diagnose C (7 circled-character glyph) | debugger | `diagnosis/C.md` | T0 | [ ] |
| T3 | Diagnose R (11 canvas 1 px) | debugger | `diagnosis/R.md` | T0 | [ ] |
| T4 | Diagnose D (4 dotted namespaces) | debugger | `diagnosis/D.md` | T0 | [ ] |
| T5 | Diagnose S (17 singletons) | debugger | `diagnosis/S.md` | T0 | [ ] |
| T6 | Batch-0 close: re-group, write batch 1–4 write-sets | orchestrator | `fixtures.md`, `batch-1..4/*.md`, `decision-journal.md`, `README.md` | T1–T5 | [ ] |

T1–T5 share one prompt skeleton: [`diagnosis-task.md`](diagnosis-task.md);
each task file adds only its group's context. Diagnosis agents write no
file under `src/` or `tests/` — instrumentation lives in a throwaway
script under `plans/class-divergence-drive-2/diagnosis/scratch/` (not
committed) or in `$T/render-diff.mts` output.
