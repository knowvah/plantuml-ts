# Batch 1 — swimlane pass order (rule b)

Sequential after Batch 0: T2 needs T1's pass-membership rule (D2) and its
`measurements/base.json`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Emit edges in lane-pass order, after compression | typescript-pro | `src/diagrams/activity/layout/edge-draw-order.ts` (new), `layout/assign-coordinates-full.ts`, `tests/diagrams/activity/layout/edge-draw-order.test.ts` (new), `tests/diagrams/activity/layout/compress/invariant.test.ts`, and `tile-coordinates.test.ts` / `tests/unit/activity/layout.test.ts` ONLY where the new order breaks them, `measurements/t2.json` | T1 | [ ] |

Spec: [`T2-lane-pass-order.md`](T2-lane-pass-order.md). Expected movers: the
`b` column of [`../fixtures.md`](../fixtures.md) as T1 rewrote it — laned
fixtures only.

**Red allowance** (README): after T2, only the four activity oracle gates may
be red, only on journaled `fixtures.md` slugs.
