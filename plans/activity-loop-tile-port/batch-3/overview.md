# Batch 3 — repeat

Sequential after Batch 2; T6 after T5 (both write `walk-repeat.ts`).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | Pure-move the `'gtile-repeat'` case to `walk-repeat.ts` (own commit), then the entry tile (D2) and `GtileRepeat` dimension/placement per `FtileRepeat.java:696-786` | typescript-pro | `src/diagrams/activity/layout/walk-repeat.ts` (new), `src/diagrams/activity/layout/tile-coordinates.ts` (the case delegates), `src/diagrams/activity/tiles/gtile-repeat-entry.ts` (new), `src/diagrams/activity/tiles/gtile-repeat.ts`, `src/diagrams/activity/layout/tile-layout.ts` (`tileRepeat`), tests named in the spec, `measurements/t5.json` | T4 | [x] |
| T6 | Repeat connections `In`, `Out`, `BackSimple2`, `BackSimple1` with the lane predicate; reservations; retirements (D8) | typescript-pro | `src/diagrams/activity/layout/walk-repeat.ts`, `src/diagrams/activity/tiles/gtile-repeat.ts`, `src/diagrams/activity/layout/conditional-builder.ts` (export the predicate), `src/diagrams/activity/layout/hexagon-reservations.ts`, `src/diagrams/activity/activity-layout-constants.ts`, `src/diagrams/activity/routing/gconnection-down-then-up.ts` (delete if unread), tests, `measurements/t6.json` | T5 | [x] |

Specs: [`T5-repeat-dimension.md`](T5-repeat-dimension.md),
[`T6-repeat-connections.md`](T6-repeat-connections.md). Expected movers: the
43 `repeat` rows of `fixtures.md` and named parent re-centres; while-only
rows byte-identical. T5's pure-move commit moves zero output.
