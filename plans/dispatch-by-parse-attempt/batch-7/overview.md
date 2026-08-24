# Batch 7 — remove the heuristics, close out

Sequential: T22 reads what T21 leaves behind.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T21 | delete the heuristic layer | refactoring-specialist | `src/core/descriptive-keywords.ts`, `src/diagrams/class/class-dispatch.ts`, dead tests, `docs/catalog.md` | T13–T20 | [ ] |
| T22 | re-pin baselines, divergences, close-out | typescript-pro | baseline JSONs, `DIVERGENCES.md`, `README.md`, `decision-journal.md` | T21 | [ ] |

**Gate at close:** all four, plus routing and refusal gates, plus the final
mission summary appended to [../README.md](../README.md).
