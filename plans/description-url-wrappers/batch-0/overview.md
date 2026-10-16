# Batch 0 — branch, baseline b0, class/state anchor check

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Branch, brief commit, b0 gates, survey, census, target-row b0 column | orchestrator | `measurements/b0*`, `decision-journal.md`, `fixtures.md` | — | [x] |
| T0b | Class/state `[[` anchor check; sprite-in-url atom order (read-only) | debugger | none (orchestrator writes `measurements/T0b-anchors.md`) | — | [x] |

Specs: [T0-baseline.md](T0-baseline.md), [T0b-anchor-check.md](T0b-anchor-check.md).
No standard close. Batch 1 starts once T0's gates are green and T0b is in (the b0 survey may still run:
batch-1 dependencies are code-only).
