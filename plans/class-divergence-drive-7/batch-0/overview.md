# Batch 0: branch, ledger, acceptances, baseline

Sequential, orchestrator. No verification task (D1). T0b is the batch's close: b0
is the reference for every later "loss".

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-ledger-acceptances.md) | branch; seed `fixtures.md`; write the 8 signed acceptances (D8); salt hand-off stub (D9) | orchestrator | `fixtures.md`, journal, `oracle/accepted-divergences.json`, `DIVERGENCES.md`, `planning/next-missions.md` | — | [ ] |
| [T0b](T0b-baseline-b0.md) | b0 on all engines; journal the D10 target | orchestrator | `measurements/b0*`, `tests/oracle/svg-conformance/parity-{class,unknown}.json`, journal | T0a | [ ] |
