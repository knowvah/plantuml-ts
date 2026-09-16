# Batch 3 — `FtileIfDown` (one branch empty or a lone stop)

Sequential after Batch 2. Measured against `measurements/t3.json`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | `GtileIfDown` + `walk-if-down.ts` (In, Else1/Else2/ElseNoDiamond, Horizontal + optionalStop, Out) + dispatch (`down` cases) | typescript-pro | `src/diagrams/activity/tiles/gtile-if-down.ts`, `layout/walk-if-down.ts` (new); `layout/conditional-builder.ts`, `layout/tile-coordinates.ts` (dispatch), `layout/hexagon-reservations.ts` (the `UEmpty(5, 12)` beside the Else elbow); their tests; `measurements/t4.json` | T3 | [ ] |

Spec: [`T4-if-down.md`](T4-if-down.md).
Expected movers: `down` rows of [`../fixtures.md`](../fixtures.md).
