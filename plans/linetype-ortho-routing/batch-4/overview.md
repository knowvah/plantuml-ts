# Batch 4 — measure and close

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T8 | Re-measure all 8, re-pin, name every mover | orchestrator | `oracle/goldens/svg-conformance/splines-baseline.json`, `tests/oracle/svg-conformance/parity-{class,state}.json`, `parity.json`, `oracle/goldens/state/size-backlog.json`, `tests/visual/data/*.json` (only if moved), `.agent-notes/lor-T8.md` | T7 | [ ] |

**Orchestrator-executed** — baseline JSON writes are reserved to the
orchestrator (`scripts/repin-sequence-baselines.ts:3-8`).

Converts the gap between T0's pin and the current tree into a recorded
result. Every fixture that moved is named **with a mechanism**; a mover
outside the 8 is stop condition 1, and a `size-backlog.json` entry that
would LOOSEN is stop condition 4.
