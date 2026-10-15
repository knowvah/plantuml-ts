# Batch 1 — ratchet eligibility; cluster-box diagnosis; colour singletons

Starts once T0's gates are green and T0b's ledger has been written (the b0 survey may still be running).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1a | Ratchet eligibility from per-type survey files; extend to unknown-DESCRIPTION + c4 (D4) | test-automator | description ratchet test + README, `measurements/pin-description.mts`, its unit test | T0 | [x] |
| T1b | Cluster-box diagnosis (read-only, D6) | debugger | none (report → `measurements/T1b-diagnosis.md`, written by orchestrator) | T0, T0b | [x] |
| T1c | Colour singletons (fill/stroke precedence) | typescript-pro | `renderer-entity.ts`, colour/stereotype resolution files (see spec); never `renderer-cluster.ts`/`layout.ts` | T0 | [x] |

T1a, T1b and T1c run in parallel: their write-sets are disjoint and T1b writes nothing.
Close: [../close-procedure.md](../close-procedure.md). Step 9 (pins) runs here for the first time,
with T1a's eligibility.
