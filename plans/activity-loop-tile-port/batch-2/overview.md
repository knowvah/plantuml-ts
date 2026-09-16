# Batch 2 — while

Sequential after Batch 1; T4 after T3 (both write `walk-while-branch.ts`).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | `GtileWhile` dimension and placement per `FtileWhile.java:576-641` (gutters, spare-height centring); the walker places at the new offsets, edges still the old routes | typescript-pro | `src/diagrams/activity/tiles/gtile-while.ts`, `src/diagrams/activity/layout/walk-while-branch.ts`, tests named in the spec, `measurements/t3.json` | T2 | [x] |
| T4 | While connections `In`, `BackSimple`, `Out`, `BackEmpty`, break welding; reservations; retire `backEdgeRightX` / `GConnectionVerticalDownThenBack` | typescript-pro | `src/diagrams/activity/layout/walk-while-branch.ts`, `src/diagrams/activity/tiles/gtile-while.ts`, `src/diagrams/activity/layout/hexagon-reservations.ts`, `src/diagrams/activity/routing/gconnection-vertical-down-then-back.ts` (delete if unread), tests, `measurements/t4.json` | T3 | [x] |

Specs: [`T3-while-dimension.md`](T3-while-dimension.md),
[`T4-while-connections.md`](T4-while-connections.md). Expected movers: the
23 `while` rows of `fixtures.md` and named parent re-centres; the 43
repeat-only rows are byte-identical after both tasks.
