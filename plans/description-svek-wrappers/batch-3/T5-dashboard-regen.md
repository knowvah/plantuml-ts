# T5 — dashboard `layoutEqual` column; regenerate dotEqual

Prepend [../task-preamble.md](../task-preamble.md).

## Task
Surface the two instruments on the generated parity dashboard (decisions.md D3, D4):
- a `layoutEqual` column
- the tightened `dotEqual` in `tests/oracle/svg-conformance/dot-parity.json` and `docs/parity-report.md`

## Write-set
- `scripts/parity-dashboard.ts`, `scripts/parity-dashboard-*.ts` (whichever hold the column model and
  inputs; read them first)
- `scripts/dot-parity-rows.ts` (the `dot-parity.json` writer, `:150`)
- `tests/unit/scripts/parity-dashboard.test.ts` (drift gate + column tests)
- `tests/oracle/svg-conformance/dot-parity.json` (regenerated)
- `docs/parity-report.md` (regenerated, `npm run parity:dashboard`)

## Read-set
- `decisions.md#d3`, `#d4`
- `scripts/dot-sync-report.ts:1-40` (modes; `--markdown`), `scripts/dot-parity-rows.ts`
- `scripts/parity-dashboard-inputs.ts:110-140` (how `dot-parity.json` is read)
- `plans/description-svek-wrappers/measurements/b2-eng/parity-*.json` (batch-2 close survey,
  carrying `layoutEqual`)
- `plans/parity-dashboard-refresh/decisions.md` D7/D8 (column vocabulary; every empty cell names why)

## Acceptance
- Given the batch-2 survey outputs, when the dashboard regenerates, then each svek row shows
  `layoutEqual n/m`. Non-svek rows carry a D8-vocabulary reason (e.g. `n/a (no DOT stage (non-svek))`).
- Given the regenerated `dot-parity.json`, then the component/usecase/unknown/c4 `dotEqual` counts
  reflect the tightened check, and class/object/state counts equal b0's (stop 5 otherwise).
- Given the drift gate, then `renderReport(buildReportModel(loadInputs()))` equals the committed report.
- Given the commit body, then every flipped row family is named with its check (`clusterNesting` /
  `titleTable`) and its count.

**Observability:** updates the dashboard (the mission's SLI surface). **Rollback:** Reversible.
