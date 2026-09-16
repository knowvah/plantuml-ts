# Batch 4 — `FtileIfLongHorizontal` (elseif chains)

Sequential after Batch 3. Measured against `measurements/t4.json`. Lands
the last builder, so `GtileIf` and the `'gtile-if'` walker case are deleted
here.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | `GtileIfLongHorizontal` + `walk-if-long-horizontal.ts` (VerticalIn/Out per branch, Horizontal, In, LastElseIn/Out, Hline) + dispatch; delete `GtileIf` | typescript-pro | `src/diagrams/activity/tiles/gtile-if-long-horizontal.ts`, `layout/walk-if-long-horizontal.ts` (new); `layout/conditional-builder.ts`, `layout/tile-coordinates.ts`; DELETE `tiles/gtile-if.ts` + `tests/diagrams/activity/tiles/gtile-if.test.ts`; their tests; `measurements/t5.json` | T4 | [ ] |

Spec: [`T5-if-long-horizontal.md`](T5-if-long-horizontal.md).
Expected movers: `long-horizontal` rows of [`../fixtures.md`](../fixtures.md).
