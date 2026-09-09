# Batch 3 — lane assignment

One task, and it is deliberately a **no-op on rendered output**. Threading
the lane onto the tiles is separated from using it (T4/T5) so that when the
geometry does move, the move is attributable to the task that caused it.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Thread `swimlane` from the AST onto the tiles | typescript-pro | `src/diagrams/activity/tiles/tile.ts`, `src/diagrams/activity/layout/tile-layout.ts`, `tests/diagrams/activity/layout/tile-layout.test.ts` | — | [ ] |

**Stop condition 6 applies to this task specifically:** if the aggregate
`weightedScore` moves at all, T3 changed geometry it should not have.
