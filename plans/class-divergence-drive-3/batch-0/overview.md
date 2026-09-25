# Batch 0 — pre-flight, diagnosis, dot-engine verification

T0 cuts the branch, measures, takes the all-engine baseline and promotes
the pin tool. T1–T5 run in parallel, read-only on `src/`, each writing only
its report (T5 may also refresh `docs/graphviz-issues/`). T6 folds the
reports and writes batches 2–4. Workstream A (batch 1) needs no diagnosis.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0](T0-preflight.md) | Branch, gates, b0, engine baseline, `pin-goldens.mts` | orchestrator | `measurements/b0.json`, tools `pin-goldens.mts` + test, journal | — | [x] |
| [T1](T1-diagnose-E1.md) | Diagnose E numeric part A (13) | debugger (opus) | `diagnosis/E1.md` | T0 | [ ] |
| [T2](T2-diagnose-E2.md) | Diagnose E numeric part B + canvas items (12) | debugger (opus) | `diagnosis/E2.md` | T0 | [ ] |
| [T3](T3-diagnose-E3.md) | Diagnose E diverged (18) | debugger (opus) | `diagnosis/E3.md` | T0 | [ ] |
| [T4](T4-diagnose-C.md) | Diagnose C named + stretch pairs (23) | debugger (opus) | `diagnosis/C.md` | T0 | [ ] |
| [T5](T5-diagnose-B.md) | Verify B dot-engine attributions (16) | debugger (opus) | `diagnosis/B.md`, `docs/graphviz-issues/` | T0 | [ ] |
| [T6](T6-close.md) | Fold, re-probe HIGH claims, write batches 2–4 | orchestrator | `fixtures.md`, `batch-2..4/*.md`, journal, README | T1–T5 | [ ] |

Batch 1 may start right after T0 (it does not depend on the diagnoses);
T6 then folds any E row that turns out to share an A mechanism.
