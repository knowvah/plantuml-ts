# T5 — port `FtileIfLongHorizontal`: the elseif diamond row

**Agent:** `typescript-pro` · **Depends on:** T4

## Context

Faithful TypeScript port of PlantUML; the Java is the spec (quote
`file:line`; JSDoc `@see` on ported symbols; port arithmetic verbatim).
Read [`../README.md`](../README.md) (stops 4–14, red allowance),
[`../decisions.md`](../decisions.md) D1–D5, D7, D8 (locked),
`.agent-notes/aitp-T1.md` Q0, Q1 (`### Template: long-horizontal`), Q4,
Q5, and T3/T4's commits.

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

**Dispatch.** `thens.size() > 1` (any `elseif`) and no `useVerticalIf`
(`vcompact/FtileFactoryDelegatorIf.java:85-90`). `thens` = the `then`
branch plus every `elseif`; `branch2` = the `else`.

**What the jar builds** (`vcompact/FtileIfLongHorizontal.java:151-258`):
`tiles[i] = FtileMinWidthCentered(then_i, 30)` (`:160-163`), `tile2` the
same for the else (`:165`); per then: `diamond_i = FtileDiamondInside2
(tbTest_i)`, `.withWest(inlabel_i)` when the branch has an in-label
(`inlabelSizes[i]` = its width, else 0), `.withNorth(tb1_i)` — the positive
label goes NORTH here (`:167-192`); the LAST diamond `.withEast(tb2)`
(`:194-197`); `alignDiamonds` (`:110-121`): every diamond gets
`addVerticalMargin(missing/2, 20)` where `missing = maxOutY - outY`;
`couples[i] = addHorizontalMargin(FtileAssemblySimple(diamond_i, tiles[i]),
inlabelSizes[i], 0)` (`:91-108`; `FtileAssemblySimple.java:124-141`:
`dim1.appendBottom(dim2)`, tile2 at `(left - tile2.left, dim1.h)`).

**Geometry** (`:624-635,657-669,679-700`): `xSeparation = 20` (`:82`);
`W = Σ couples.w + (tile2.w) + 20 * n` and `H = max(Σ-merge height,
tile2.h + diamondsH/2) + max(100, maxOutY)` via `mergeLR` (`klimt/geom/
XDimension2D.java:108-112`) then `delta(20 * n, max(100, maxOutY))`; `left
= W/2`, `inY 0`, `outY = H`; couple i at `(Σ_{j<i}(couples[j].w + 20), 25)`;
`tile2` at `(W - tile2.w, (H - tile2.h)/2)`; `getTranslateDiamond1/
getTranslate1` compose the couple's translate with the assembly's
(`:637-655`). `FtileDiamondInside2.calculateDimensionFtile`: `height =
hexagon.h + north.h`, `left = w/2`, `width = north.w > left ? left +
north.w : w`, `inY 0`, `outY = hexagon.h` (`vertical/FtileDiamondInside2
.java`, the method after `calculateDimensionAlone`); north AND south labels
draw at `(4 + w/2, h)`.

**Connectors, in `conns` order** (`:203-255`), `getYdiamontOutToLeft = (inY
+ outY)/2` (`:296-298`):
1. per then i: `ConnectionVerticalIn(diamond_i, tile_i)` (`:389-436`):
   `diamond.pointOut -> tile.pointIn`, `asToDown`; then
   `ConnectionVerticalOut(tile_i)` (`:438-474`): `tile.pointOut -> (x,
   H)`, `asToDown`, skipped when no point out; `nbOut` counts branches
   with a point out (`:213-214`)
2. per adjacent pair: `ConnectionHorizontal(diamond_i, diamond_i+1)`
   (`:260-294`): `(d_i.left*2, mid) -> (0, mid)` of `d_i+1`, `asToRight`
3. `ConnectionIn` (`:300-321`): `p1 = (W/2, 0)` (the tile's own pointIn),
   `p2 = diamond_0.pointIn`; points `p1, (p2.x, p1.y), p2`; `asToDown`
4. `ConnectionLastElseIn` (`:323-350`): last diamond east-mid `->` `tile2
   .pointIn` via `(p2.x, p1.y)`; `asToDown`
5. `ConnectionLastElseOut` (`:352-387`): `tile2.pointOut -> (x, H)`,
   `asToDown`; when `nbOut == 0` a third point `(W/2, H)`; skipped when
   tile2 has no point out
6. `ConnectionHline` when `nbOut > 0` (`:476-570`): `(minX, H) -> (maxX, H)`
   with NO arrow; unlaned: `minX/maxX` = the tile's own `left` and every
   out point's x across `couples + tile2` (`getMinmaxSimple`); laned: the
   pass-aware variant (`getMinmax`, `:520-560`) — port the unlaned rule and
   the laned one as Q4 directs; if the laned one needs the current lane
   pass, journal it and emit the unlaned extent (stop 10 does not apply:
   it is not a D8 item, but say what is approximated)

**Nodes, in `drawU` order** (`:671-677`): couple 0 (diamond, its north/
west/east `if-label`s, then tile 0's subtree), couple 1, …, then tile2's
subtree. Note `y = 25` for every couple.

**Delete.** `tiles/gtile-if.ts`, its test, and the `'gtile-if'` case in
`tile-coordinates.ts`; `conditional-builder.ts` no longer imports `GtileIf`.
`GConnectionSideThenVerticalThenSide` stays (switch uses it).

## Read-set

- `.agent-notes/aitp-T1.md` Q0, Q1 (long template), Q4, Q5
- T3's and T4's modules (walker shape, `GtileDiamondInside` API)
- `src/diagrams/activity/layout/tile-coordinates.ts:158-232`
- `src/diagrams/activity/layout/edge-draw-order.ts:65-107` (lane pass
  ranks, for the Hline question)
- Java: every range cited above; `FtileAssemblySimple.java:56-141`;
  `vertical/FtileDiamondInside2.java` (whole)

## Write-set

New: `src/diagrams/activity/tiles/gtile-if-long-horizontal.ts`,
`layout/walk-if-long-horizontal.ts`. Modify: `layout/conditional-builder
.ts`, `layout/tile-coordinates.ts`. Delete: `tiles/gtile-if.ts`,
`tests/diagrams/activity/tiles/gtile-if.test.ts`. Tests: new
`tests/diagrams/activity/tiles/gtile-if-long-horizontal.test.ts`,
`layout/walk-if-long-horizontal.test.ts`; modify `conditional-builder
.test.ts`, `tile-layout.test.ts`, `tile-coordinates.test.ts`, `tests/unit/
activity/layout.test.ts` — only what changes (stop 12). `measurements/
t5.json`; journal rows; `docs/catalog.md` (regenerate: a module is deleted).

## Acceptance criteria

- Given `if (c1) then (1) :a; elseif (c2) then (2) :b; else (3) :d; endif`,
  when laid out, then nodes read hexagon c1 (+ north label 1), `a`, hexagon
  c2 (+ north 2, east 3), `b`, `d`, and edges read VerticalIn a,
  VerticalOut a, VerticalIn b, VerticalOut b, Horizontal c1->c2, In,
  LastElseIn, LastElseOut, Hline (no arrow)
- Given every branch ending in `stop`, then no VerticalOut, no Hline, and
  LastElseOut carries its third point `(W/2, H)` only when tile2 has a
  point out — else it is absent and the tile has no point out
- Given the three long template slugs, when `--align` runs, then per-tag
  counts equal the jar's and alignment ≥ the Q1 base
- Given `measurements/t5.json` vs `t4.json`, then every mover's `builders`
  includes `long-horizontal`, every riser has a journal row
- Given `grep -rn GtileIf src tests`, then only `GtileIfDown`,
  `GtileIfWithLinks`, `GtileIfLongHorizontal` remain

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint`, `build` exit 0. `npm test` green except the four
activity oracle gates on journaled `fixtures.md` slugs — report each red
file with its slug count. `git diff --name-only HEAD~1` = write-set only.

## Commit

`feat(aitp-T5): port FtileIfLongHorizontal and retire GtileIf`
