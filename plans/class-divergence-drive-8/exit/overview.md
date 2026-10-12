# Exit: close + salt hand-off

Orchestrator, sequential.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T-exit](T-exit-close.md) | final measurement, ledger, next-missions, memory, merge commit | orchestrator | `measurements/final*`, `fixtures.md`, `planning/next-missions.md`, `README.md`, memory, `.agent-notes/` | batch 3 | [ ] |
| [T-salt](T-salt-handoff.md) | immediately run `/plan-mission salt-engine-port` (D10) | orchestrator | (the new brief's own files) | T-exit | [ ] |
