# Batch 4 — `FtileIfLongHorizontal` (elseif chains)

Sequential after Batch 3. Measured against `measurements/t4.json`. Lands
the last builder, so `GtileIf` and the `'gtile-if'` walker case are deleted
here.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | `GtileIfLongHorizontal` + `walk-if-long-horizontal.ts` (VerticalIn/Out per branch, Horizontal, In, LastElseIn/Out, Hline) + dispatch; delete `GtileIf` | typescript-pro | `src/diagrams/activity/tiles/gtile-if-long-horizontal.ts`, `layout/walk-if-long-horizontal.ts` (new); `layout/conditional-builder.ts`, `layout/tile-coordinates.ts`; DELETE `tiles/gtile-if.ts` + `tests/diagrams/activity/tiles/gtile-if.test.ts`; their tests; `measurements/t5.json` | T4 | [x] |

Spec: [`T5-if-long-horizontal.md`](T5-if-long-horizontal.md).
Expected movers: `long-horizontal` rows of [`../fixtures.md`](../fixtures.md).

## Notes from T1 (read before T5)

- Two upstream quirks to PRESERVE (CLAUDE.md: never fix an apparent upstream
  bug inline): (1) `FtileDiamondInside2`'s private constructor passes
  `(north, south, EAST, WEST)` to `FtileDiamondWIP` (`vertical/
  FtileDiamondInside2.java:73` — verify the line), so `.withWest(x)` draws
  at the geometric EAST slot and vice versa; (2) its `drawU` translates
  BOTH `north` and `south` to `(4 + w/2, h)`, so the `.withNorth(tb1)`
  branch label renders BELOW the hexagon (verified on `lifeve-53-zubi598`:
  "Yes" at y=87.556 under a hexagon ending at y=79).
- T1's template table calls `ConnectionHline` "D8 out of scope". That is
  WRONG: D8 files only the HLINE `conditionEndStyle` variants; the plain
  `ConnectionHline` at `FtileIfLongHorizontal.java:253-254,476-570` (drawn
  whenever `nbOut > 0`) is in scope and in the T5 spec. Attribute
  `lifeve`'s golden lines yourself: which is the Hline and which the
  `LastElseOut`.
- Per-branch `VerticalIn`/`VerticalOut` snake-merge into one straight line
  in the jar when the branch is empty (parent D5, not ported) — journal the
  count residual, not a stop 14.
- Base `--align`: `lifeve` 5/7 6/9 1/4 0/0 5/20; `pekefu` 5/9 7/11 3/6 2/2
  5/28; `sofoje` 7/10 8/12 3/3 3/3 10/28.
