# T3 — port `FtileIfWithLinks`: hexagon, two branches, merge rhombus, four connectors

**Agent:** `typescript-pro` · **Depends on:** T2

## Context

Faithful TypeScript port of PlantUML; the Java is the spec (quote
`file:line`; JSDoc `@see` on ported symbols; port arithmetic verbatim,
never fit a value). Read [`../README.md`](../README.md) (stops 4–14, red
allowance), [`../decisions.md`](../decisions.md) D1–D7, D9 (locked), and
`.agent-notes/aitp-T1.md` Q0, Q1 (`### Template: with-links`), Q2, Q4, Q5.

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

**What the jar builds** (`vcompact/cond/ConditionalBuilder.java:213-231`,
`createWithLinks`): `diamond1 = getShape1(true, tb1, tb2)` — a
`FtileDiamondInside` with `withWestAndEast(tb1, tb2)` (`:242-244`);
`diamond2 = getShape2(branch1, branch2, false)` — a `FtileDiamond` with
`withWest(tbout1).withEast(tbout2)` when both branches have a point out,
else `FtileEmpty(0, 6)` (`:285-311`); `tmp1/tmp2 = addHorizontalMargin(
FtileMinWidthCentered(branch, 30), 10)` (`:139-140,219-220`); then
`addLinks`, then `addHorizontalMargin(result, diff1, diff2)` and
`addVerticalMargin(result, suppHeight, 0)` from the label margins
(`cond/FtileIfWithDiamonds.java:250-281`).

**Geometry** (`cond/FtileIfNude.java:142-160`, `cond/FtileIfWithDiamonds
.java:72,156-193,221-248`), with `xDeltaNote = yDeltaNote = suppWidthNode =
0` (no notes, D8):
- `innerMargin = max((t1.w - t1.left) + t2.left, d1.w + 20)`
- nude: `width = t1.left + innerMargin + (t2.w - t2.left)`, `height =
  max(t1.h, t2.h)`, `left = t1.left + innerMargin/2`, `inY 0`, `outY =
  height`; `withoutPointOut` when neither branch has one (`:132-139`)
- all = `d1.appendBottom(nude).appendBottom(d2)` (`FtileGeometryMerger
  .java:44-56`: align on the larger `left`, sum heights, out state from the
  lower tile), then `.addDim(0, ydelta1a + ydelta1b)` where `ydelta1a` is
  10 (20 with > 1 lane), `ydelta1b` is `hasTwoBranches ? 6 : 0` (10 with
  > 1 lane)
- `diamond1` at `(total.left - d1.left, 0)`; `tile1` at `(0, d1.h +
  ydelta1a)`; `tile2` at `(total.w - t2.w, d1.h + ydelta1a)`; `diamond2`
  at `(total.left - d2.w/2, total.h - d2.h)`
- `FtileMinWidthCentered(_, 30)`: width at least 30, content shifted
  `(30 - w)/2`, `left` likewise (`FtileMinWidthCentered.java:68-79,99-106`)
- `FtileMarged(_, 10, 10)`: `width + 20`, `left + 10`, content at `+10`
  (`FtileMarged.java:93-110`)
- `FtileDiamondInside`: `dim = label empty ? 24x24 : max(label, 24x24) +
  (24, 0)`; `left = w/2`, `inY 0`, `outY = h`; `calculateDimensionFtile`
  adds the north label height (`vertical/FtileDiamondInside.java:104-125`)
- `FtileDiamond`: `24 x (24 + northH)`, `left 12`, `inY = northH`, `outY =
  h` (`vertical/FtileDiamond.java:108-112`)

**Connectors, in `conns` order** (`cond/FtileIfWithLinks.java:531-560`),
points from `FtileGeometry` (`FtileGeometry.java:48-82`: `pointIn = (left,
inY)`, `pointOut = (left, outY)`, `B = (w, (inY+outY)/2)`, `D = (0,
(inY+outY)/2)`):
1. `ConnectionHorizontalThenVertical(tile1)` (`:90-148`): `p1 = d1.D`,
   `p2 = tile1.pointIn`; points `(x1,y1) (x2,y1) (x2,y2)`; arrow
   `asToDown`, or NONE when `branch.isEmpty()` (`arrowhead: false`)
2. the same for `tile2` with `p1 = d1.B`
3. if both have a point out: `ConnectionVerticalThenHorizontal(tile1)`
   (`:177-231`): `p1 = tile1.pointOut`, `p2 = d2.D`; points `(x1,y1)
   (x1,y2) (x2,y2)`; arrow `asToRight` if `x2 > x1` else `asToLeft`;
   `emphasize: 'down'` when the branch is empty; then `tile2` with `p2 =
   d2.B`
4. else exactly one: `ConnectionVerticalThenHorizontalDirect` (`:288-367`)
   for the branch WITH a point out: `p2 = (total.left, total.h)`, points
   `(x1,y1) (x1,y2) (x2,y2) (x2, total.h)`, NO arrow, `emphasize: 'down'`
   when empty
   (HLINE branches `:369-470` are D8.)

**Nodes, in `drawU` order** (`cond/FtileIfWithDiamonds.java:200-218`):
`diamond1`, tile1's subtree, tile2's subtree, `diamond2`; the `if-label`
nodes for west/east (`vertical/FtileDiamondInside.java:96-101`) and the
rhombus's west/east out-labels (`vertical/FtileDiamond.java:99-105`) follow
their diamond.

**Lanes.** `EdgeMeta` per D7: in-connectors `laneOut(diamond1) ->
laneIn(branch)`, out-connectors `laneOut(branch) -> laneIn(diamond2)`;
diamond1/diamond2 carry the if's own lane. Cross-lane middle rule per Q4
(`EdgeShape` tag).

**Dispatch.** New `layout/conditional-builder.ts` exports `ifBuilderOf`
(T1 Q0's contract) and `buildIf(node, bounder, theme)`: `'with-links'` ->
`GtileIfWithLinks`; every other answer -> the legacy `GtileIf` UNTIL T4/T5
replace it. `tile-layout.ts#tileIf` becomes a call to `buildIf`.
`tile-coordinates.ts` gains a `'gtile-if-with-links'` case delegating to
`walkIfWithLinks`.

## Read-set

- `.agent-notes/aitp-T1.md` Q0, Q1 (with-links template), Q2, Q4, Q5
- `src/diagrams/activity/tiles/gtile-if.ts`, `gtile-diamond.ts`,
  `gtile-top-down.ts`, `tile.ts`, `points.ts`
- `src/diagrams/activity/layout/tile-layout.ts:40-66,115-136,248-258`
- `src/diagrams/activity/layout/tile-coordinates.ts:48-75,184-232`
- `src/diagrams/activity/layout/walk-fork-branches.ts` (module shape,
  `@see` style), `walk-while-branch.ts:1-30` (circular-import note)
- `src/diagrams/activity/layout/swimlane-placement.ts:63-74,348-389`
- `src/diagrams/activity/layout/swimlane-lanes.ts`
- Java: every range cited above; `Branch.java:210-240`

## Write-set

New: `src/diagrams/activity/tiles/gtile-diamond-inside.ts`,
`tiles/gtile-if-with-links.ts`, `layout/conditional-builder.ts`,
`layout/walk-if-with-links.ts`. Modify: `layout/tile-layout.ts`,
`layout/tile-coordinates.ts` (dispatch case only),
`layout/swimlane-placement.ts` (only the `EdgeShape` tags Q4 named).
Tests: new `tests/diagrams/activity/tiles/gtile-diamond-inside.test.ts`,
`gtile-if-with-links.test.ts`, `tests/diagrams/activity/layout/
conditional-builder.test.ts`, `walk-if-with-links.test.ts`; modify
`tile-layout.test.ts`, `tile-coordinates.test.ts`, `tests/unit/activity/
layout.test.ts` (if cases `:135-181,543-575`), `compress/invariant.test.ts`
— ONLY assertions the new geometry changes, re-asserted against the Java
(stop 12). `plans/activity-if-tile-port/measurements/t3.json`; journal
rows; `docs/catalog.md` on drift.

## Interface contract (consumed by T4, T5)

`conditional-builder.ts`:
```ts
export type IfBuilder = 'down' | 'with-links' | 'long-horizontal';
export function ifBuilderOf(node: ActivityIf): { builder: IfBuilder; swapped?: boolean; optionalStop?: boolean };
export function buildIf(node: ActivityIf, bounder: StringBounder, theme: Theme): Tile;
```
`gtile-diamond-inside.ts`: `new GtileDiamondInside(label, { north?, south?,
west?, east? }, bounder, theme)` with `.width/.height` per
`calculateDimensionFtile`, `getCoord` (`NORTH_HOOK = (w/2, 0)`, `SOUTH_HOOK
= (w/2, h)`, `EAST_HOOK = (w, h/2)`, `WEST_HOOK = (0, h/2)` of the hexagon
alone), `labelAt(side)` -> `{ x, y, width, height }` in tile-local
coordinates, `swapEastWest()`.

## Acceptance criteria

- Given `if (c) then (yes) :a; else (no) :b; endif`, when laid out, then
  the nodes read `if-split` (hexagon `max(label,24x24)+(24,0)`), `if-label`
  yes, `if-label` no, `a`, `b`, `if-merge`, and the edges read in1, in2,
  out1, out2 with the point shapes above and `asToDown`/`asToRight`/
  `asToLeft` tips
- Given the same with `else` empty of content but not a lone stop
  (`isEmpty()`), then in2 has `arrowhead: false` and out2 has `emphasize:
  'down'`
- Given `then` ending in `stop`, then only out2 exists, as the `Direct`
  shape with no arrow, and the tile has no point out iff both end
- Given the three with-links template slugs, when `--align` runs, then
  per-tag counts equal the jar's and alignment ≥ the Q1 base
- Given `measurements/t3.json` vs `t2.json`, then every mover's `builders`
  includes `with-links`, and every riser has a journal row before the commit
- Given `GtileIf`, then `down` and `long-horizontal` answers still build it
  and their fixtures are byte-identical to `t2.json`

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint`, `build` exit 0. `npm test` green except the four
activity oracle gates on journaled with-links slugs — report each red file
with its slug count. `git diff --name-only HEAD~1` = write-set only. Stage
explicit paths; never `git add -A`.

## Commit

`feat(aitp-T3): port FtileIfWithLinks as GtileIfWithLinks`
