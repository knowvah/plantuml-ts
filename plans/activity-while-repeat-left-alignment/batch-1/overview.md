# Batch 1 — while

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `GtileWhile` merger left/width + per-child x offsets + hooks at `contentLeft`; `walkWhile` places header/body at the offsets | typescript-pro | `src/diagrams/activity/tiles/gtile-while.ts`, `src/diagrams/activity/layout/walk-while-branch.ts`; `tests/diagrams/activity/tiles/gtile-while.test.ts`, `tests/diagrams/activity/layout/tile-coordinates.test.ts`, `tile-layout.test.ts`, `compress/invariant.test.ts`, `tests/unit/activity/layout.test.ts` ONLY where the geometry breaks them; `measurements/t1.json` | — | [x] |

Spec: [`T1-while-left.md`](T1-while-left.md). Expected movers: the 5
`while` diagonal fixtures (`bareka-88-fusu160`, `nafaxo-62-boso912`,
`vamazo-19-tufu812`, `pixako-75-kumi821`, `ruzica-16-deli877`) plus any
`while` whose body is asymmetric without a visible diagonal (an `if` body
whose `left` happens to sit near the centre).
