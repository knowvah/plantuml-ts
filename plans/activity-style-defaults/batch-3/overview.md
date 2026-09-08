# Batch 3 — the sizer

Two tasks, **parallel** — disjoint write-sets, no shared file.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Per-element font in the measurement helpers; delete the 1.4x advance | typescript-pro | `src/diagrams/activity/activity-layout-helpers.ts`, `tests/unit/activity/tile-sizing.test.ts` (re-targeted at the LIVE `tiles/` path; see the journal) | T2 | [x] |
| T4 | Derive the box constants from resolved font + padding | typescript-pro | `src/diagrams/activity/activity-layout-constants.ts`, `src/diagrams/activity/activity-layout-leaf.ts`, `tests/unit/activity/activity-box-derivation.test.ts` (re-targeted; see the journal) | T2 | [x] |

**Write-set check:** T3 owns `activity-layout-helpers.ts`; T4 owns
`activity-layout-constants.ts` and `activity-layout-leaf.ts`. No overlap.
T3 imports from T4's constants module but does not write it.

**Expect the ratchet to move a lot here** and not necessarily monotonically
per fixture — two geometric changes land in this batch. T0's histogram is
what makes them separable; use it.
