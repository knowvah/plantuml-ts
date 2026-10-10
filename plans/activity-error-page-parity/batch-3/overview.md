# Batch 3 — exit + close (orchestrator, sequential)

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T-exit | Final survey/census, re-pin, dashboard, catalog, gates, merge | orchestrator | `tests/oracle/svg-conformance/parity-*.json`, `docs/parity-report.md`, `docs/catalog.md`, activity goldens, `fixtures.md` `final` column | T2a, T2b | [ ] |
| T-close | next-missions entry, memory, cleanup | orchestrator | `planning/next-missions.md`, memory | T-exit | [ ] |
