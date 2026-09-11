# Batch 4 — wire the pass and measure

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | Call `compressGeometry` in `assignCoordinates`; bounds from the transform; titles re-centred; re-pin the uncompressed-model tests; the invariant test; measure and journal | typescript-pro | `src/diagrams/activity/layout/tile-coordinates.ts`, `src/diagrams/activity/activity-renderer-swimlanes.ts`, `tests/diagrams/activity/layout/tile-coordinates.test.ts`, `swimlane-placement.test.ts`, `canvas-bounds.test.ts`, `tests/unit/activity/layout.test.ts`, `renderer-swimlanes.test.ts`, `tests/diagrams/activity/layout/compress/invariant.test.ts`, `plans/activity-klimt-compress/decision-journal.md` | T4 | [x] |

**Stop conditions 7, 10, 11, 12, 13 apply.** This is the mission's one
mover; every riser is journaled before the commit.
