# Batch 0: baseline, hygiene, re-capture, ELK spike

The orchestrator runs these sequentially on the mission branch: they share
`fixtures.md`, `accepted-divergences.json` and the b0 measurement, so they cannot run
in parallel. T0c's verdict gates everything ELK in batches 1–3 (stop 13).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-ledger-baseline.md) | branch, ledger, b0 (all engines), retire bixogo/roxosu | orchestrator | `measurements/b0*`, `fixtures.md`, `oracle/accepted-divergences.json`, journal | — | [x] |
| [T0b](T0b-smetana-recapture.md) | re-capture the 5 Smetana rows with the pragma stripped (D7) | orchestrator | `scripts/capture-oracle-cache.ts` (+test), `test-results/dot-cache/unknown/<5>/`, goldens, acceptances | T0a | [x] |
| [T0c](T0c-elk-spike.md) | ELK spike gate: cadutu via elkjs 0.12.0 against the jar | typescript-pro (opus) | `package.json`, `package-lock.json`, `plans/class-divergence-drive-8/spike/**` | T0a | [x] |

Close batch 0 with a gates run plus a journal row. There is no survey re-pin
beyond T0b's own.
