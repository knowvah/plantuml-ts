# T2 — `GtileRepeat`: align body, condition and backward body on `left`

**Agent:** `typescript-pro` · **Depends on:** T1

## Context

Faithful TypeScript port of PlantUML; the Java is the spec (quote
`file:line`; JSDoc `@see`; port arithmetic verbatim). Read
[`../README.md`](../README.md), [`../decisions.md`](../decisions.md) D1–D5,
T1's commit (the same shape on `GtileWhile`), and
`tiles/gtile-top-down.ts` (the merger precedent).

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

**The jar.** `FtileRepeat#getLeft` (`vcompact/FtileRepeat.java:767-774`):
`max(repeat.left, d1.w/2, d2.w/2)`; `getRight` (`:777-786`):
`max(repeat.w - repeat.left, d1.w/2, d2.w/2)`; `calculateDimensionInternal`
(`:701-716`): `width = max(left + right, testWidth + 24) + backward.w +
24`, heights summed `+ 8*12`; `calculateDimensionFtile` (`:696-699`):
`(dim, getLeft, 0, h)`. Placement: body at `(left - repeat.left, y)`
(`getTranslateForRepeat :730-741`), `diamond1` at `left - d1.w/2`
(`:744-748`), `diamond2` at `(left - d2.w/2, h - d2.h)` (`:759-765`),
`backward` at `(width - backward.w, (h - backward.h)/2)` (`:750-757`).

**Ours.** `GtileRepeat` (`tiles/gtile-repeat.ts:19-34`): `contentWidth =
max(body.width, condition.width)`, `width = contentWidth +
BACK_EDGE_MARGIN`, hooks at `width/2`; the walker case
(`layout/tile-coordinates.ts` `'gtile-repeat'`) places body, condition and
backward at `contentCenterX - child.width/2` with `contentCenterX = x +
width/2`. Our repeat has ONE condition diamond (the jar's `diamond1` is the
entry marker, `diamond2` the condition — our tile has no entry diamond;
treat the jar's `d1.w/2` term as absent and journal it, D3).

## Fix

1. `GtileRepeat`: `left = max(body.left, condition.width/2, backward?.left
   ?? 0)` — cite which terms the jar has (`:767-774`; backward is placed at
   the right edge in the jar, `:750-757`, so decide with the Java whether it
   joins the `left` merge or stays centred as today, and journal the
   decision); `right = max(body.width - body.left, condition.width/2, …)`;
   `contentWidth = left + right`; `width = contentWidth + BACK_EDGE_MARGIN`
   (D2); `bodyOffsetX = BACK_EDGE_MARGIN/2 + left - body.left`,
   `conditionOffsetX = BACK_EDGE_MARGIN/2 + left - condition.width/2`,
   `backwardOffsetX` likewise; hooks at `x = BACK_EDGE_MARGIN/2 + left` (for
   symmetric children this equals today's `width/2` — assert it).
2. Walker: `bodyX = x + t.bodyOffsetX`, `condX = x + t.conditionOffsetX`,
   `bwX = x + t.backwardOffsetX`; edges, lanes and order unchanged;
   `backEdgeLeftX` unchanged.

## Read-set

`tiles/gtile-repeat.ts`, `layout/tile-coordinates.ts` (repeat case),
T1's `gtile-while.ts`; tests in the write-set; Java ranges above.

## Write-set

`src/diagrams/activity/tiles/gtile-repeat.ts`,
`src/diagrams/activity/layout/tile-coordinates.ts` (repeat case only);
`tests/diagrams/activity/tiles/gtile-repeat.test.ts`,
`tests/diagrams/activity/layout/tile-coordinates.test.ts`,
`tile-layout.test.ts`, `compress/invariant.test.ts`,
`tests/unit/activity/layout.test.ts` — only assertions the geometry
changes, with a Java cite, never deleted (stop 10); `measurements/t2.json`;
journal rows; `docs/catalog.md` on drift.

## Acceptance criteria

- Given a body stub with `left` 20 px right of its `width/2`, when laid
  out, then `body.SOUTH -> condition.NORTH` and the back edge's landing on
  `body.NORTH` are axis-aligned, and `width` follows `left + right +
  BACK_EDGE_MARGIN`
- Given body `left` 10 / width 40 and a condition of width 50, then `left
  = 25`, `right = 30`, `contentWidth = 55`
- Given symmetric children, then `width`, hooks and every position are
  byte-identical to T1's
- Given the diagonal scan, then all 14 `repeat` fixtures show 0 diagonals
  (`tobajo-64-mipi810` had 3) and the whole-corpus count is 0
- Given `t2.json` vs `t1.json`, then every mover is a `repeat` fixture with
  an asymmetric body/backward; symmetric repeat fixtures are unchanged;
  every riser has a journal row

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

As T1. Stage explicit paths.

## Commit

`fix(awrl-T2): align a repeat's body, condition and backward body on left`
