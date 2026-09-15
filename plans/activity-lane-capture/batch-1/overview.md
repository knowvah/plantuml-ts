# Batch 1 — state the mechanisms before any `src/` edit

One task. **Stop 4 governs the whole mission from here:** no `src/` change
lands until T1's note states the `jevoce` mechanism with a `file:line`, a
causal chain and a non-empty "ruled out". T1's call-site table is what
T4–T7 implement literally (D2).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Diagnose the lane mechanisms; record the base measurement | debugger | `.agent-notes/alc-T1.md`, `plans/activity-lane-capture/measurements/base.json`, `base-lanes.txt`, `fixtures.md` (amend only), journal rows | T0a | [ ] |

Spec: [`T1-lane-mechanism-diagnosis.md`](T1-lane-mechanism-diagnosis.md).

If a finding contradicts D1 or D2, amend [`../decisions.md`](../decisions.md)
and halt (stop 3).
