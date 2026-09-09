# Batch 1 — the unconsumed resolvers

One task, deliberately a **no-op on rendered output**: the three resolvers
T2/T4/T5 consume are added first so that when each consumer lands, the
move is attributable to it alone (the shape `asr-T3` used).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `activityMinimumWidth`, `activityFontColor`, `activityHorizontalAlignment` | typescript-pro | `src/diagrams/activity/activity-style-defaults.ts`, `tests/unit/activity/activity-style-defaults.test.ts` | — | [x] |

**Stop condition 6 applies:** the aggregate must be EXACTLY 48291 after T1.
