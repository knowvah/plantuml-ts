# Stop 1 filing — D3's split breaks the `edges`/`edgeMeta` positional zip downstream

Filed 2026-09-19 during Batch 1 by T3 (`typescript-pro`, worktree `allt-t3`);
mechanism re-verified by the orchestrator in the main tree at `db5c8302`.

## Finding

D3 makes `routeEdge` return an array and `placeSwimlanes` flat-map it, so
for a cross-lane `repeat-out` (`FtileRepeat.ConnectionOut#drawTranslate`,
`FtileRepeat.java:309-331`, two snakes) `PlacementResult.edges.length`
exceeds the walker's `edges.length`. D3's Consequences foresaw this for
tests ("tests that indexed edges positionally must key by endpoint") but
not for production consumers. Three of them zip `edges[i]` with the
**pre-split** `edgeMeta[i]`:

- `assign-coordinates-full.ts:216` calls `placeSwimlanes`, then `:222`
  (`inLanePassOrder(result, edgeMeta, …)`, the `compress: false` path),
  `:226` (`compressAndAssemble({ placed, edgeMeta, … })`) and `:235`
  (`inLanePassOrder(result, edgeMeta, …)`) all pass the walker's
  `edgeMeta` closure variable, never one derived from `placed`.
- `compress/shapes-of.ts:391-393` — `shapesForEdge(input.edges[i]!,
  input.edgeMeta[i]!, …)`; `edgeMeta[7]` is `undefined` on
  `becanu-19-diti597` (7 walker edges, 8 placed) and `terminalArrowhead`
  (`shapes-of.ts:236`) throws reading `.shape`.
- `edge-draw-order.ts:101-124` — `lanePassOrder(meta, …)` builds the
  permutation over `meta.length`, and `applyEdgeDrawOrder` emits
  `order.map(i => edges[i])`, so on the `compress: false` path the split's
  second edge is silently dropped rather than crashing.

T1's stubs return exactly one edge, which is why Batch 0's byte-identical
gate (stop 7) could not surface this; T3's `routeRepeatOut` is the first
real two-edge return.

## Blast radius

Crash (hard throw inside `renderFixtureActivity`, so every corpus suite in
`npm test` fails): `becanu-19-diti597`, `rujuxa-07-neco067`,
`megara-21-rumi574` — T0's three `repeat-out` rows. Not affected: the five
`complex1`-only rows and every same-lane row (no split occurs).

None of the three files is in any task's write-set (T1 owned
`swimlane-placement.ts`, which is where the parallel meta would be built,
but T1 is closed). The README pre-authorises only "a 500-line split
re-export, and the test files named per task", so this is stop 1, not a
push-forward.

## Options for the human

1. **Thread a per-output-edge `edgeMeta` (recommended).** `PlacementResult`
   gains `edgeMeta: EdgeMeta[]` parallel to its `edges`; `placeSwimlanes`
   builds it by repeating the source meta once per edge `routeEdge`
   returned (the second `repeat-out` edge carries the same lanes and
   `shape`, which is what `shapesForEdge`/`passRank` read).
   `assignCoordinatesFull` passes `placed.edgeMeta` at `:222,:226,:235`.
   Files: `swimlane-placement.ts`, `assign-coordinates-full.ts`,
   `tests/diagrams/activity/layout/swimlane-placement.test.ts`. About 15
   lines; `edge-draw-order.ts` and `shapes-of.ts` need no change once
   their inputs are consistent. Dispatched as a fix task **T3a** (its own
   commit, `fix(allt-T3a)`), cherry-picked into `allt-t3` before T3 resumes;
   T2 is unaffected (one edge plus a reservation).
2. **Amend D3 to one edge** (stop 3: unlock `decisions.md`): merge
   `ConnectionOut`'s two snakes into a single five-point `ActivityEdgeGeo`.
   Byte-identical today only because `tbout` is null in every corpus row;
   diverges from the Java object model the moment a fixture labels a
   repeat exit, and the second snake's own `asToDown` arrowhead and label
   anchor would have to be faked. Not recommended.
3. **Halt Batch 1 at T2**; land T2 alone and re-plan T3 as its own mission.

T3's two write-set files are edited but uncommitted in `allt-t3` (typecheck
and lint green; `npm test` unrunnable until the zip is fixed). T3 also left
two `--align` fallers open (`kudedo-31-pafi082` 35/37 -> 34/37,
`mafete-03-rapa918` 30/33 -> 29/33) with no mechanism yet; they are T3/T4
work once it resumes, not part of this stop.

## Addendum (same session): D4's `midArrowAt` is not carried through compression — stop 14

Found by the orchestrator while verifying T2's uncommitted work in `allt-t2`
(the T2 agent stalled twice on the harness watchdog and never reported).
On `kijazo-83-kipu485` T2's back edge now has the jar's four segments and
its vertical run at x = 431.828 (golden 537.056 before canvas offset, same
relative position), but the D4 mid-arrow polygon renders at x = 477.431:
45.6 px off its own edge. `compress/compress-geometry.ts:135-140`
(`transformEdge`) maps `edge.points` through the piecewise-affine
compression transform and returns `{ ...edge, points }`, so the absolute
`midArrowAt` point keeps its PRE-compression coordinates. In the jar the
`asToUp` polygon is drawn through the same compressing `UGraphic` as the
snake (`ug.apply(new UTranslate(xx, (y1 + y2) / 2)).draw(asToUp)`,
`FtileWhile.java:307`), so it moves with it. `shapes-of.ts` likewise knows
nothing of the polygon, so the compressor cannot see it as an occupant.

The fix site is `compress/compress-geometry.ts` — the file stop 14 names
verbatim — plus `compress/shapes-of.ts` if the polygon is to occupy a slot.
About four lines in `transformEdge` (transform `midArrowAt.x`/`.y` on the
matching axis) and one shape in `shapesForEdge`.

### T2 state left in `allt-t2` (uncommitted, gates NOT green)

`swimlane-loop-translate-while.ts` and `walk-while-branch.ts` edited,
`swimlane-loop-translate-while.test.ts` new, `docs/catalog.md` regenerated,
`measurements/t2.json` written. Arithmetic checked against
`FtileWhile.java:277-308` by the orchestrator: correct. Measured on the
worktree: movers exactly `kijazo` and `ruzica` (stop 5 clean); scan 0;
typecheck/lint/build 0; `npm test` 7 failures, all on those two rows:

- `--align` kijazo 21/41 -> 21/42, lines 18 -> 19 (jar 17); ruzica 35/95 ->
  36/97, polygons 27 (jar 25), lines 49 -> 51 (jar 45). The +1 line per back
  edge IS the jar's shape (three-segment generic elbow -> four segments);
  kijazo's remaining +2 lines are the while EXIT edge's pre-existing dog-leg
  (`(56.631,287)->(56.631,297)->(299.616,297)` where the golden runs straight
  at y = 312.306), present in `base-svg` too, not this mission's shape.
- Ratchet: kijazo 208 -> 211, ruzica 545 -> 559 (rises; the T2 stub tests in
  `swimlane-placement.test.ts` that asserted the 4-point stub also fail, as
  expected). Candidate classes: element growth under positional pairing
  (+1 line) and the misplaced mid-arrow polygon; NOT adjudicated per slug.
- Style census: strokeWidth 1 count +1 (kijazo), +2 (ruzica) — the added
  segments. Swimlane census ruzica: `dividerXs` [17,235.281,411.213] ->
  [17,235.281,417.213], canvas width 423 -> 452 — the translated snake's
  `xx = max(dx1,dx2) + dimTotal.width` run or its `UEmpty` reservation now
  blocks X compression the stub's elbow did not; whether the jar's canvas
  shows the same width is unmeasured.

## Recommendation (amended)

One fix task, **T1b "seam consumers"**, before either Batch 1 task resumes,
with an explicit human write-set grant for `assign-coordinates-full.ts`,
`compress/compress-geometry.ts`, `compress/shapes-of.ts`,
`swimlane-placement.ts` and their tests: (a) `PlacementResult.edgeMeta`
parallel to the flat-mapped edges, threaded at
`assign-coordinates-full.ts:222,226,235`; (b) `transformEdge` moves
`midArrowAt` with the points and `shapesForEdge` emits its polygon. Both
gaps have the same cause: the seam added outputs (a second edge, an
absolute point) that Batch 0's byte-identical gate could not exercise
because T1's stubs never produce them. Then T2 and T3 resume in their
worktrees on top of T1b, and T4 adjudicates the rises.
