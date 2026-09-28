# Batch 0: instruments, verification, baseline

T0a first (orchestrator). Then T0b, T0c (worktrees) and T0d (read-only, main
checkout) in parallel. T0e closes the batch: b0 is measured with the fixed
instruments and becomes the reference.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-and-ledger.md) | branch; seed `fixtures.md` from cdd5's open rows | orchestrator | `fixtures.md`, journal | — | [x] |
| [T0b](T0b-survey-harness.md) | observer scoped to the outer diagram; pragma ignores comments; newpage page-1 DOT (D9) | typescript-pro (sonnet) | `graph-layout.ts`, `EmbeddedDiagram.ts`, `svg-parity-workers.ts`, new `scripts/lib/survey-dot-equal.ts`, `svg-parity-survey.ts` (+tests) | T0a | [x] |
| [T0c](T0c-minute-guard.md) | plain-minute guard for error-page captures (D9) | typescript-pro (sonnet) | new `scripts/lib/oracle-minute-guard.ts`, `rebaseline-svg-goldens.ts`, `capture-oracle-cache.ts` (+tests) | T0a | [x] |
| [T0d](T0d-verify-doubtful-rows.md) | verify the doubtful rows (D1) | debugger (opus) | `diagnosis/verify.md` | T0a | [x] |
| [T0e](T0e-close-b0.md) | measure b0 on all engines; merge T0d verdicts; re-slot; journal target | orchestrator | `measurements/b0*`, `fixtures.md`, batch 2–3 specs, journal | T0b–T0d | [x] |

Batch 0 has no close-procedure run; T0e is its close.
