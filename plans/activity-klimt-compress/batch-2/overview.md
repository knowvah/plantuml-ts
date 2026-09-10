# Batch 2 — shape adapter, `SlotFinder`, reservations

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | `shapesOf` adapter, `collectSlots`, `Out.reservations` (hexagons, dividers), the parallel-edge flag | typescript-pro | `src/diagrams/activity/layout/compress/shapes-of.ts`, `slot-finder.ts`, `src/diagrams/activity/layout/tile-coordinates.ts` (or a sibling `layout/hexagon-reservations.ts` if the 500-line cap forces it), `src/diagrams/activity/layout/walk-fork-branches.ts`, `src/diagrams/activity/layout/swimlane-placement.ts` (divider reservations only), `tests/diagrams/activity/layout/compress/shapes-of.test.ts`, `slot-finder.test.ts`, `tests/diagrams/activity/layout/tile-coordinates.test.ts` | T1, T2 | [x] |

**Stop condition 6 applies:** 42511 exactly — reservations are internal and
nothing consumes the slots yet.
