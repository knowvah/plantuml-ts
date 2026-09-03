# Batch 2 — measure

One task. Converts the gap between T0's pin and the current tree into a
recorded result.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Re-pin, re-census, name every riser | orchestrator | `oracle/goldens/svg-activity/{diff-baseline,diff-census,element-baseline}.json`, `README.md`, `.agent-notes/aeg-T4.md` | T1, T2, T3 | [ ] |

**Orchestrator-executed** — baseline JSON writes are reserved to the
orchestrator (`scripts/repin-sequence-baselines.ts:3-8`).

Runs even if T3 halted. In that case it measures T1+T2 only and records the
halt.
