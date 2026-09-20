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
