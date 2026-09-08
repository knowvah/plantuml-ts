# Batch 2 — the resolution module

One task. Every later task consumes it, so it is serial and alone.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | The activity style-default table and its resolvers | typescript-pro | `src/diagrams/activity/activity-style-defaults.ts`, `tests/unit/activity/activity-style-defaults.test.ts` | T1 | [ ] |

This module is the **only** place a `plantuml.skin` activity number is
written. T3–T6 call it; none of them may re-declare a value.
