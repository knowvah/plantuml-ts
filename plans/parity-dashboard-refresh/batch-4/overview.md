# Batch 4 — regenerate everything, then record it

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T7 | run every producer over every cached type; regenerate both dashboards | orchestrator | `tests/oracle/svg-conformance/parity*.json`, `tests/oracle/svg-conformance/census-*.json`, `tests/oracle/svg-conformance/PARITY-SVG.md`, `docs/parity-report.md` | T5, T6 | [x] |
| T8 | bookkeeping: planning docs, README support table → pointer, svg-conformance status section | technical-writer (sonnet) | `planning/next-missions.md`, `planning/mission-index.md`, `README.md`, `docs/svg-conformance.md` | T7 | [ ] |
