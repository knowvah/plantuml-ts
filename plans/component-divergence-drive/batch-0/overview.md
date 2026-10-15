# Batch 0 — branch, baseline b0, TRACKER ledger

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Branch, b0 gates, survey, census, families, named-fixture b0 column | orchestrator | `measurements/b0*`, `decision-journal.md`, `fixtures.md` | — | [x] |
| T0b | TRACKER verification ledger (read-only) | debugger | none (reports; orchestrator writes `measurements/tracker-ledger.md`) | — | [x] |

Specs: [T0-baseline.md](T0-baseline.md), [T0b-tracker-ledger.md](T0b-tracker-ledger.md).
Close: no standard close. T0 is the baseline. Batch 1 may start once T0 step 3 (gates) is green and
T0b is in. The b0 survey may still be running (push-forward: the dependencies are code-only).
