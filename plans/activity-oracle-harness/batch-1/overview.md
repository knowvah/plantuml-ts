# Batch 1 — the gate

Two independent tasks writing different files. Run in parallel.
Both need Batch 0's cache; T2 also needs T1's helper.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Pre-chrome diff-baseline ratchet | sonnet | `tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts`, `oracle/goldens/svg-activity/{diff-baseline.json,ratchet.json,README.md}` | T0, T1 | [ ] |
| T3 | Extend oracle-freshness to activity | sonnet | `tests/oracle/svg-conformance/oracle-freshness.test.ts` | T0 | [ ] |

**This batch pins the PRE-chrome floor.** Nothing here fixes anything —
[D5] requires the baseline exist before T5 moves the renderer, or the
descent is unprovable.
