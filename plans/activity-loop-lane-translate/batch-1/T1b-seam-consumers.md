# T1b — thread the seam's new outputs through their consumers

**Agent:** typescript-pro · **Depends on:** T1 · Isolated worktree ·
Added 2026-09-20 by human decision after the Batch 1 halt
([`../stop-1-edgemeta-zip.md`](../stop-1-edgemeta-zip.md)); the human
granted this write-set explicitly (stops 1 and 14 do not apply to it).
Output must be byte-identical to `b0803534` on all 268 baseline rows: no
producer of a second edge or a `midArrowAt` exists at HEAD.

## Context

Read [`../README.md`](../README.md), [`../decisions.md`](../decisions.md)
D1–D4, and the whole of [`../stop-1-edgemeta-zip.md`](../stop-1-edgemeta-zip.md)
(the two mechanisms, with `file:line`). T1 (`b0803534`) made `routeEdge`
return `{ edges, reservations }` and `placeSwimlanes` flat-map, and added
`ActivityEdgeGeo.midArrowAt`. Two consumer groups were not updated:

1. `assign-coordinates-full.ts:222,226,235` pass the WALKER's `edgeMeta` to
   `inLanePassOrder`/`compressAndAssemble`; `compress/shapes-of.ts:391-393`
   zips `edges[i]` with `edgeMeta[i]`; `edge-draw-order.ts:101-124` sizes
   its permutation by `meta.length`. A two-edge `routeEdge` return (D3)
   crashes the first and drops an edge in the third.
2. `compress/compress-geometry.ts:135-140#transformEdge` maps `edge.points`
   only, so `midArrowAt` keeps pre-compression coordinates; `shapes-of.ts`
   models the terminal (`:217`) and emphasize (`:246`) arrowheads as
   occupants but not `midArrowAt`. The jar draws the `asToUp` polygon
   through the same compressing `UGraphic` as the snake
   (`FtileWhile.java:307`; `UGraphicCompressOnXorY.java`).

## Task

1. `swimlane-placement.ts`: `PlacementResult.edgeMeta: EdgeMeta[]`, parallel
   to `edges`, built in `placeSwimlanes` by repeating each input meta once per
   edge its `routeEdge` call returned (a split edge carries the same lanes
   and `shape`; that is what `shapesForEdge` and `passRank` read). The no-lane
   early return copies the input meta.
2. `assign-coordinates-full.ts`: pass `placed.edgeMeta` at the three sites.
   `edge-draw-order.ts` needs no change once its inputs are consistent; if it
   does, say why in the journal row.
3. `compress/compress-geometry.ts#transformEdge`: transform
   `midArrowAt.x` on the X pass and `.y` on the Y pass, exactly as the points.
4. `compress/shapes-of.ts`: a `midArrowShape` occupant for `midArrowAt`,
   built like `emphasizeArrowhead` (same polygon extent for the same `dir`),
   pushed in `shapesForEdge` after the emphasize shape.
5. Tests, asserting specific values: `swimlane-placement.test.ts` — a
   `placeSwimlanes` case where a tagged cross-lane edge's route returns two
   edges yields `edgeMeta.length === edges.length` with the meta repeated
   (drive it through a real `LoopTranslate` tag if any stub returns two
   edges; otherwise test the meta-building helper as a pure function and
   the one-edge case end to end); `compress/compress-geometry.test.ts` — an
   edge with `midArrowAt` moves by the same transform as its points on each
   axis; `compress/shapes-of.test.ts` — one extra occupant with the arrow's
   extent; an `assign-coordinates-full`-level test that `edgeMeta` in the
   result has the placed length (use the existing test file for that module
   if one exists, else add it to `swimlane-placement.test.ts`).
6. render-all before/after (`.allt-tools/`), `diff -rq` empty; probe `--json`
   to `../measurements/t1b.json`, identical per-slug to `t1.json`; scan 0.

## Write-set (human grant, 2026-09-20)

`src/diagrams/activity/layout/swimlane-placement.ts`,
`src/diagrams/activity/layout/assign-coordinates-full.ts`,
`src/diagrams/activity/layout/compress/compress-geometry.ts`,
`src/diagrams/activity/layout/compress/shapes-of.ts`,
`src/diagrams/activity/layout/edge-draw-order.ts` (only if needed, journaled),
`tests/diagrams/activity/layout/swimlane-placement.test.ts`,
`tests/diagrams/activity/layout/compress/compress-geometry.test.ts`,
`tests/diagrams/activity/layout/compress/shapes-of.test.ts`,
`tests/diagrams/activity/layout/edge-draw-order.test.ts`,
`docs/catalog.md` on drift, `../measurements/t1b.json`. Journal rows are
returned as text. `swimlane-loop-translate*.ts`, the walkers, `renderer.ts`
and `layout.old.ts` are NOT in this set.

## Acceptance criteria

- Given all 268 baseline rows, then byte-identical to HEAD (stop 7 applies)
- Given a `routeEdge` result of N edges, then `PlacementResult.edgeMeta` has N
  entries for it and `shapesOf`/`applyEdgeDrawOrder` receive equal-length arrays
- Given an edge with `midArrowAt`, when compressed on X then Y, then the point
  moves exactly as a point of the edge at the same coordinate would
- Given `npm test`, then collected = on-disk and all four gates green

## Quality bar / boundaries

As every task: four gates, JSON collected count = on-disk, ONE commit
`fix(allt-T1b): …` with a body saying why, `git diff --name-only HEAD~1` =
this write-set. Never refactor while porting; never delete an assertion.
