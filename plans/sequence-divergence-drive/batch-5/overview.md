# Batch 5 — exit and close-out

Sequential, orchestrator-only.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T-exit](T-exit.md) | final measurements; D10 status; ledger finals | orchestrator | `README.md`, `measurements/final*`, `fixtures.md`, `docs/parity-report.md`, `docs/catalog.md` | b4 close | [x] |
| [T-close-out](T-close-out.md) | sdd2 filing; planning docs; memory; hand-off for signing + PR | orchestrator | `planning/*.md`, `oracle/goldens/svg-sequence/README.md`, memory | T-exit | [x] |
