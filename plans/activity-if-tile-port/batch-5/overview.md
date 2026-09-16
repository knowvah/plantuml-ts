# Batch 5 — sibling links after both endpoints (D7)

Sequential after Batch 4 so the move is measured alone against
`measurements/t5.json`. This rule is generic: its movers are fixtures with
ANY compound child that has internal edges, inside `fixtures.md` or not
(README stop 6 exempts this task for the list it journals).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6 | `gtile-top-down`: walk child i+1, THEN push link i->i+1 | typescript-pro | `src/diagrams/activity/layout/tile-coordinates.ts` (top-down case only), `tests/diagrams/activity/layout/tile-coordinates.test.ts`, `tile-layout.test.ts`, `swimlane-placement.test.ts`, `compress/{compress-geometry,invariant}.test.ts` ONLY where order breaks them; `measurements/t6.json` | T5 | [ ] |

Spec: [`T6-sibling-link-order.md`](T6-sibling-link-order.md).
