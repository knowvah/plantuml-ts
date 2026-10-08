# Batch 0 — branch, baseline, A1 audit

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-baseline.md) | branch, b0 all-engine survey, sequence scores, element counts, ledger b0 column | orchestrator | `plans/large-group-mirror/measurements/b0*`, `fixtures.md` | — | [ ] |
| [T0b](T0b-a1-svek-read-audit.md) | audit every dot-engine read against the jar's `-Tsvg` parse; fix gaps; evidence table | typescript-pro | `src/core/graph-layout*.ts`, `src/core/svek-dot-lines0.ts`, `src/diagrams/dot/layout.ts`, consumers it names in its report, `tests/unit/core/lgm-T0b*.test.ts`, `tests/fixtures/lgm-T0b/` | T0a | [ ] |

Close per [close-procedure.md](../close-procedure.md) (`b0` = T0a's survey;
T0b's merge is measured against it as `b0b`).
