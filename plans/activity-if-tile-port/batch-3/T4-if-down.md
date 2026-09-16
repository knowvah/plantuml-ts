# T4 — port `FtileIfDown`: the single-branch if with its Else loop

**Agent:** `typescript-pro` · **Depends on:** T3

## Context

Faithful TypeScript port of PlantUML; the Java is the spec (quote
`file:line`; JSDoc `@see` on ported symbols; port arithmetic verbatim).
Read [`../README.md`](../README.md) (stops 4–14, red allowance),
[`../decisions.md`](../decisions.md) D1–D5, D7, D8 (locked),
`.agent-notes/aitp-T1.md` Q0, Q1 (`### Template: down`), Q4, and T3's
commit (`conditional-builder.ts`, `GtileDiamondInside`, the walker shape).

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

**Dispatch** (`vcompact/cond/ConditionalBuilder.java:144-191`): `createDown
(b1, b2)` when `b2` is empty-or-lone-stop and `b1` is not; `(b1, b2)` when
`b1` empty and `b2` lone stop; `(b2, b1)` when `b1` is empty-or-lone-stop
and `b2` is not; `(b2, b1)` when `b2` empty and `b1` lone stop
(T1's `ifBuilderOf` gives `swapped` and `optionalStop`). `createDown`:
`diamond1 = getShape1(false, tb1, tb2)` = `FtileDiamondInside.withSouth(tb1)
.withEast(tb2)` (`:245-248`); `diamond2 = getShape2(b1, b2, true)` =
`FtileDiamond.withNorth(tbout1).withEast(tbout2)` when both have a point
out, else `FtileEmpty(0, 6)` (`:285-311`); then-block =
`addHorizontalMargin(FtileMinWidthCentered(branch, 30), 10)`; when the
other branch is a lone stop it becomes `optionalStop` and `diamond2` is
replaced by `FtileEmpty` (`vcompact/FtileIfDown.java:130-132`).

**Geometry** (`vcompact/FtileIfDown.java:543-578,624-665`, `opale` empty,
D8): `geo = d1.appendBottom(then).appendBottom(d2)`; `height = geo.h + 36 +
max(12, southLabelH)`; `width = geo.w + 12` (+ `stop.w + getAdditionalWidth`
= `max(stop.w, eastLabelW + stop.w/2)` when `optionalStop`, `:580-585`);
result `(width, height, geo.left, d1.inY, height)`, `withoutPointOut` when
the then-block has none AND there is an `optionalStop`. `diamond1` at
`(total.left - d1.left, 0)`; then-block at `(total.left - then.left, d1.h +
(total.h - d1.h - d2.h - then.h)/2)`; `diamond2` at `(total.left - d2.left,
total.h - d2.h)`; `optionalStop` at `(total.left - d1.left + d1.w +
additionalWidth, d1.inY + (d1.h - d1.inY - stop.h)/2)`.

**Connectors, in `conns` order** (`:135-157`):
1. `ConnectionIn` (`:196-239`): `d1.pointOut -> then.pointIn`, two points,
   `asToDown`
2. one of: `ConnectionElse1` (`:304-354`) when the diagram has lanes AND
   the if's lane `isSmallerThanAllOthers(thenBlock.getSwimlanes())`
   (`Swimlane.java:130-137` — strictly left of every lane the then-block
   touches, and not the only one), with `diamond1.swapEastWest()`
   (`:141-143`): `p1 = d1 west-mid (0, inY + (outY-inY)/2)`, `p2 = d2
   west-mid`, `xmin = min(x1 - 12, thenX)`, points `(x1,y1) (xmin,y1)
   (xmin,y2) (x2,y2)`, `asToRight`, `emphasize: 'down'`, plus a
   reservation `UEmpty(5, 12)` at `(x2, y2 - 12)`; else `ConnectionElse2`
   (`:356-406`): `p1 = d1 east-mid (w, …)`, `p2 = d2 east-mid`, `xmax =
   max(x1 + 12, thenX + then.w)`, points `(x1,y1) (xmax,y1) (xmax,y2)
   (x2,y2)`, `asToLeft`, `emphasize: 'down'`, same reservation; BOTH return
   early when the whole tile has no point out. When the then-block has no
   point out: `ConnectionElseNoDiamond` (`:447-458`, Else2 with `p2 =
   tile.pointOut`). When `optionalStop`: `ConnectionHorizontal` (`:161-194`):
   `d1 east-mid -> stop (0, stop.h/2)`, `asToRight`.
   (HLINE variants `:409-445,461-520` are D8.)
3. `ConnectionOut` (`:241-302`): `then.pointOut -> d2.pointIn`, `asToDown`,
   skipped when the then-block has no point out.

**Nodes, in `drawU` order** (`:524-537`): the then-block's subtree,
`diamond1` (+ its south/east `if-label`s), then `diamond2` or the
`optionalStop` tile.

**Lanes.** D7; `getSwimlaneOut` is the then-block's when `optionalStop`,
else `getSwimlaneIn` (`:102-106`). Else1/Else2 and Out are `laneOut/laneIn`
of their endpoints; cross-lane middle rule per Q4.

## Read-set

- `.agent-notes/aitp-T1.md` Q0, Q1 (down template), Q4
- T3's four new modules and `tile-coordinates.ts` dispatch
- `src/diagrams/activity/layout/hexagon-reservations.ts` (`Reservation`,
  the while reservation as the pattern)
- `src/diagrams/activity/layout/swimlane-lanes.ts`; `swimlane-placement.ts:
  63-74,348-389`; how `ast.swimlanes` order reaches the walker (for
  `isSmallerThanAllOthers` — declaration order, parent D3)
- Java: every range cited above; `FtileGeometry.java:48-82`

## Write-set

New: `src/diagrams/activity/tiles/gtile-if-down.ts`,
`layout/walk-if-down.ts`. Modify: `layout/conditional-builder.ts` (`down`
-> `GtileIfDown`), `layout/tile-coordinates.ts` (dispatch case),
`layout/hexagon-reservations.ts` (add `ifElseHexagonReservation` with the
`FtileIfDown.java:349,401` cite). Tests: new `tests/diagrams/activity/
tiles/gtile-if-down.test.ts`, `layout/walk-if-down.test.ts`; modify
`conditional-builder.test.ts`, `tile-layout.test.ts`, `tests/unit/activity/
layout.test.ts` (`:498-525` "if node with empty branches"),
`compress/invariant.test.ts` — only what the new geometry changes (stop
12). `measurements/t4.json`; journal rows; `docs/catalog.md` on drift.

## Acceptance criteria

- Given `if (c) then (yes) :a; endif`, when laid out, then nodes read `a`,
  `if-split`, `if-label` yes (south), `if-merge`, and edges read In, Else2
  (4 points, `asToLeft`, `emphasize: 'down'`), Out, with one reservation
  `(x2, y2 - 12, 5, 12)`
- Given `if (c) then (yes) :a; else (no) stop endif`, then the stop sits
  east of the hexagon, edges read In, Horizontal (`asToRight`), Out, and no
  `if-merge` node exists
- Given the then-branch ending in `stop`, then the else connector is
  `ConnectionElseNoDiamond` ending at the tile's out point and there is no
  Out edge
- Given lanes `|A| |B|` with the if in `A` and its body in `B`, then Else1
  is drawn on the left with the labels swapped
- Given the three down template slugs (including `cemipu-87-dinu624`'s
  lane-1 run `In, Else2, Out`), when `--align` runs, then per-tag counts
  equal the jar's and alignment ≥ the Q1 base
- Given `measurements/t4.json` vs `t3.json`, then every mover's `builders`
  includes `down`, every riser has a journal row before the commit

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint`, `build` exit 0. `npm test` green except the four
activity oracle gates on journaled with-links/down slugs — report each red
file with its slug count. `git diff --name-only HEAD~1` = write-set only.

## Commit

`feat(aitp-T4): port FtileIfDown as GtileIfDown`
