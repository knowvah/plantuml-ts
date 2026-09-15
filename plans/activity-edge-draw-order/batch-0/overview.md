# Batch 0 — state the mechanisms before any `src/` edit

One task. **Stop 4 governs the whole mission from here:** no `src/` change
lands until T1's note states where a lane-less edge belongs (D2) with a
`file:line`, a causal chain and a non-empty "ruled out". T1's re-measurement
also REPLACES [`../fixtures.md`](../fixtures.md), whose numbers came from a
scratch that permuted `edges` without `edgeMeta`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Diagnose edge draw order; record the base measurement | debugger | `.agent-notes/aedo-T1.md`, `plans/activity-edge-draw-order/fixtures.md` (rewrite), `measurements/{base,scratch-a,scratch-b,scratch-ab}.json`, journal rows | — | [x] |

Spec: [`T1-edge-order-diagnosis.md`](T1-edge-order-diagnosis.md).

If a finding contradicts D1–D7, amend [`../decisions.md`](../decisions.md)
and halt (stop 3).
