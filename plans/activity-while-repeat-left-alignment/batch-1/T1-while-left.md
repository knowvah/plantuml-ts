# T1 — `GtileWhile`: align header and body on `left`

**Agent:** `typescript-pro` · **Depends on:** —

## Context

Faithful TypeScript port of PlantUML; the Java is the spec (quote
`file:line`; JSDoc `@see`; port arithmetic verbatim, never fit a value).
Read [`../README.md`](../README.md) (stops, red allowance, gates),
[`../decisions.md`](../decisions.md) D1–D5, and the precedent this task
copies: `plans/activity-if-tile-port/batch-5b/T6b-topdown-left-alignment.md`
plus its implementation in `src/diagrams/activity/tiles/gtile-top-down.ts`
(`left`, `childOffsetsX`, hooks at `left`; cites
`FtileGeometryMerger.java:44-56`).

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

**The jar.** `FtileWhile#calculateDimensionFtile` (`vcompact/FtileWhile.java:
576-593`): `geo = geoDiamond1.appendBottom(geoWhile)` — `FtileGeometryMerger`
(`FtileGeometryMerger.java:44-56`): `left = max(l1, l2)`, `width = max(w1 +
(left - l1), w2 + (left - l2))`, heights summed. `getTranslateForWhile`
(`:621-632`): `x = total.left - while.left`; `getTranslateDiamond1`
(`:635-641`): `x = total.left - d1.left`. Every tile's `left` is its
`getCoord(NORTH_HOOK).x`.

**Ours.** `GtileWhile` (`tiles/gtile-while.ts:18-33`): `contentWidth =
max(header.width, body.width)`, `width = contentWidth + BACK_EDGE_MARGIN`,
hooks at `cx = (width - BACK_EDGE_MARGIN)/2`; `walkWhile`
(`layout/walk-while-branch.ts:30-45`) places header and body at
`contentCenterX - child.width/2`. With an asymmetric body (an `if`), the
forward edge `header.SOUTH -> body.NORTH` and the back edge's landing slant.

## Fix

1. `GtileWhile`: `contentLeft = max(header.left, body.left)` where a
   child's `left` is `getCoord(NORTH_HOOK).x`; `contentWidth =
   max(contentLeft - header.left + header.width, contentLeft - body.left +
   body.width)`; `width = contentWidth + BACK_EDGE_MARGIN` (D2);
   `headerOffsetX = contentLeft - header.left`, `bodyOffsetX = contentLeft -
   body.left` (new readonly fields); `NORTH_HOOK`/`SOUTH_HOOK` x =
   `contentLeft` (for symmetric children this equals today's `(width -
   BACK_EDGE_MARGIN)/2` — assert it in a test); `backEdgeRightX` unchanged.
2. `walkWhile`: `hX = x + t.headerOffsetX`, `bX = x + t.bodyOffsetX`;
   everything else (edges, reservation, lanes, T6's order) unchanged.

## Read-set

`tiles/gtile-while.ts`, `layout/walk-while-branch.ts`,
`tiles/gtile-top-down.ts` (the pattern), `tiles/points.ts`; tests named in
the write-set; Java ranges above.

## Write-set

`src/diagrams/activity/tiles/gtile-while.ts`,
`src/diagrams/activity/layout/walk-while-branch.ts`;
`tests/diagrams/activity/tiles/gtile-while.test.ts`,
`tests/diagrams/activity/layout/tile-coordinates.test.ts`,
`tile-layout.test.ts`, `compress/invariant.test.ts`, `tests/unit/activity/
layout.test.ts` — only assertions the geometry changes, re-asserted with a
Java cite, never deleted (stop 10); `measurements/t1.json`; journal rows;
`docs/catalog.md` on drift.

## Acceptance criteria

- Given a body stub with `left` 20 px right of its `width/2`, when laid
  out, then `header.SOUTH -> body.NORTH` is a single vertical segment and
  the tile's `width` equals `contentLeft - body.left + body.width +
  BACK_EDGE_MARGIN` per the merger
- Given header `left` 30 and body `left` 10 (widths 60, 40), then
  `contentLeft = 30`, `contentWidth = max(60, 30-10+40) = 60`
- Given symmetric children, then `width`, hooks and every position are
  byte-identical to before
- Given the diagonal scan, then the 5 `while` fixtures show 0 diagonals
  and the 14 `repeat` ones are unchanged
- Given `t1.json` vs `base.json`, then every mover is a `while` fixture
  with an asymmetric body; symmetric while fixtures are unchanged; every
  riser has a journal row

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

Targeted tests green; `typecheck`, `lint`, `build` exit 0; the
orchestrator runs `npm test` (red only on the four activity oracle gates,
on journaled movers) and the probe, then resumes you to commit. Stage
explicit paths.

## Commit

`fix(awrl-T1): align a while's header and body on left`
