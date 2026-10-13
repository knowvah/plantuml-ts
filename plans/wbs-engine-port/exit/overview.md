# Exit: final + merge

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T-exit](T-exit.md) | final measurement, ledger, next-missions, memory, merge commit into local main | orchestrator | `measurements/final*`, `fixtures.md`, `planning/next-missions.md`, `README.md`, memory | batch 5 | [x] |
| [T-next](T-next-utility-factories.md) | brief the `@startuml` utility-factory mission (`listopeniconic`, `colors`, …) — maintainer request 2026-10-13; starts the NEXT mission | orchestrator | `plans/<next>/`, `planning/{mission-index,next-missions}.md` | T-exit (merged) | [ ] |
