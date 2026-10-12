# Batch 0: branch, b0 baseline, harness

Orchestrator-run, sequential (they share `fixtures.md` and the b0 measurement).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-b0-ledger.md) | branch, b0 (all engines), ledger, classify error-text oracles | orchestrator | `measurements/b0*`, `fixtures.md`, journal | — | [ ] |
| [T0b](T0b-salt-harness.md) | salt harness: render helper, golden + diff-baseline ratchets, pin path | typescript-pro (opus) | `tests/oracle/svg-conformance/{render-fixture-salt.ts,salt.*.test.ts,parity-salt.json}`, `oracle/goldens/svg-salt/**`, `measurements/pin-salt.mts` | T0a | [ ] |

Close batch 0 with a gates run plus a journal row; no survey re-pin.
