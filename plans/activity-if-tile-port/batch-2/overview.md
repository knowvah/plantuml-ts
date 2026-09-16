# Batch 2 — `FtileIfWithLinks` (two branches, both with content)

Sequential after Batch 1. Measured against `measurements/t2.json`, so every
move is attributable to this builder alone. From this task until T7 the
four activity oracle gates may be red on `fixtures.md` slugs whose
`builders` column includes `with-links` (README red allowance).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | `GtileDiamondInside`, `GtileIfWithLinks`, `walk-if-with-links.ts`, `conditional-builder.ts` dispatch (with-links cases only) | typescript-pro | `src/diagrams/activity/tiles/gtile-diamond-inside.ts`, `tiles/gtile-if-with-links.ts`, `layout/conditional-builder.ts`, `layout/walk-if-with-links.ts` (new); `layout/tile-layout.ts`, `layout/tile-coordinates.ts` (dispatch lines), `layout/swimlane-placement.ts` (`EdgeShape` tags Q4 named); their tests; `measurements/t3.json` | T2 | [ ] |

Spec: [`T3-if-with-links.md`](T3-if-with-links.md).
Expected movers: `with-links` rows of [`../fixtures.md`](../fixtures.md).
