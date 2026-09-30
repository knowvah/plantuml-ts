# Batch 7: exit and close-out

Sequential, orchestrator.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T-exit](T-exit.md) | full four gates, 28-engine survey vs b0, D9 exit bar | orchestrator | `measurements/exit*`, journal | b6 close | [x] |
| [T-close-out](T-close-out.md) | ledger, dashboard, DIVERGENCES.md, next-missions, memory, merge commit (no push) | orchestrator | `fixtures.md`, `docs/parity-report.md`, `DIVERGENCES.md`, `plans/next-missions.md`, README | T-exit | [ ] |
