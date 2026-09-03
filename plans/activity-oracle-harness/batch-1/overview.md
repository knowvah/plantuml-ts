# Batch 1 — the gate

Two independent tasks writing different files. Run in parallel.
Both need Batch 0's cache; T2 also needs T1's helper.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Pre-chrome diff-baseline ratchet | sonnet | `tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts`, `oracle/goldens/svg-activity/{diff-baseline.json,ratchet.json,README.md}` | T0, T1 | [x] |
| T3 | Extend oracle-freshness to activity | sonnet | `tests/oracle/svg-conformance/oracle-freshness.test.ts` | T0 | [x] |

**This batch pins the PRE-chrome floor.** Nothing here fixes anything —
[D5] requires the baseline exist before T5 moves the renderer, or the
descent is unprovable.

## Executed 2026-09-02 — measured results

Serialized, not parallel (see the decision journal).

- **T2** `9524864f`. Population 268 `baseline` + 82 `error` + 23 `jar-error`
  = 373. Only `baseline` entries carry a `weightedScore`; min 166, median
  541, max 3076.
- **The brief's "diff floor is exactly 12, every fixture" premise is FALSE.**
  Measured: 238 of 268 (89%) sit at `diffCount` 12 sharing one identical path
  set; 30 do not — 9 at 10, 1 at 11, and a tail to 74. T6's census inherits
  the real distribution.
- **T3** `bc8d3478`. Sentinel `activity/movexa-27-rexe388` — median oracle by
  both byte size and line count, two swimlanes plus an if/then/else branch.
  Homogeneity scan confirmed to cover the whole tree
  (`oracle-freshness.test.ts:199` iterates `SENTINELS`, `:211` builds
  `join(CACHE, type)`, `:212` `readdirSync(dir)`), 0 offenders for activity.
