# add4-T3c: GROUP-INK, HRULE-INK, SVG-ZERO-STROKE, lane node-aware ink

Branch `add4/T3c`, base `dc20ac952`. No Serena, no stash, no `&`. No golden or baseline edits.

## Commits (probe Σ over the 31 baseline rows; base 1385)
| sha | subject | Σ |
|---|---|---|
| 6566fb60e | fix(activity): widen a group frame by its inner tile's ink overrun | 1381 |
| 06040420c | fix(activity): ink a ruled action box to its full width | 1346 |
| 455418637 | test(activity): pin node-aware lane ink and three lane fixtures | 1346 |
| 4f205ae22 | fix(svg): write no stroke style for a zero-width stroke | 1340 |
| (this) | docs(add4-T3c): report and regenerate the module catalog | 1340 |

## Java -> ours
- GROUP-INK: `FtileGroup#getInnerMinMax` (`FtileGroup.java:150-158`, a LimitFinder inside a fresh UGraphicForSnake) and `getInnerDimensionSlow` (`:178-186`, `orig.addDim(missingWidth + 5, 0)`; `addDim` keeps `left`, `FtileGeometry.java:174-176`). Ours: `layout/canvas-origin-group-ink.ts#groupInnerInkMaxX` walks the body alone at (0,0) with `walkTile`, runs `mergeSnakes`, then `inkBoundsOf` (new export in `canvas-origin.ts`, shared with the root scan). `tiles/gtile-group.ts#innerDimensionWidth` adds the `FtileMarged` 10 (`FtileGroup.java:97`) and widens. `layout/tile-layout-structural.ts#groupOptions` passes `innerInkMaxX`.
  - The +1 that T2g could not derive is wrong. The while's ink is `width + 14`: the `ConnectionBackSimple` vertical sits at `xx = dimTotal.getWidth()` (`FtileWhile.java:266-268`), `.emphasizeDirection(UP)` (`:262`) draws `asToUp` mid-segment (`Worm.java:138-139,178-181`), and that polygon spans `+-4` (`ArrowsRegular.java:42-53`). `HACK_X_FOR_POLYGON = 10` is added on top (`LimitFinder.java:169-177`). So missing = 4 and the frame is orig + 9 before compression. The jar's "orig + 6" is what is left after compression: the frame rect is `ignoreForCompressionOnX` (`USymbolFrame.java:70-71`) and draws 2 px UEmpty edges (`URectangle.java:193-199`), so the free gap of 13 shrinks to 10 under `smaller(5)` (`CompressionXorYBuilder.java:66`). Verified with 5 authored jar fixtures, all 0 diffs.
- HRULE-INK: `FtileBox.MyStencil` (`FtileBox.java:125-135,180-181`) + `UGraphicStencil#drawHline` (`UGraphicStencil.java:83-84`) + `UHorizontalLine.java:87-96,111-152` (double rule, titled halves) -> a full-width ULine, recorded exactly (`LimitFinder.java:179-182`). Ours: `layout/canvas-origin-fudge.ts#nodeFudge` (an action with a `HORIZONTAL_LINE` or titled separator gets far X 0). The fudge table moved there unchanged from `canvas-origin.ts`, which was at 497 lines.
- Lane extents: `Swimlanes#computeDrawingWidths` (`Swimlanes.java:379-395`) uses the same LimitFinder. `swimlane-context.ts#itemsExtentOf` now calls `nodeFudge`, and `LaneItem` gains `usymbol?`/`label?`.
- SVG-ZERO-STROKE: `SvgGraphics#styleMe` (`SvgGraphics.java:624-626`) skips every stroke style when the width formats to `"0"`, for rect/line/polygon/path (`:571-616,645-660,825-865`). Ours: `src/core/svg-shapes.ts#strokeAttrsOf`. The klimt port already did this (`svg-graphics-core.ts:325`).

## Rows before -> after (probe score; element census unchanged on every row vs b2-elements.json)
| row | before | after |
|---|---|---|
| lebile-91-veto202 | 64 | 60 (geometry exact; residual named below) |
| bigide-91-bise382 | 35 | 0 |
| cemipu-87-dinu624 | 6 | 0 (all-engine survey: diverged -> conformant) |
Every other row is unchanged after every commit.

## Risers
None. No row rose after any commit, and no element count moved.

## Census movers (ratchet 381, harness-parity, compress invariant, text and swimlane census all green)
- lebile style: w 524 -> 530, which equals the pin's `jar` column.
- cemipu style: strokeWidth {0: 3 -> 0, (absent): 0 -> 3}, which equals `jar`.
- No text or swimlane census mover. These two style pins need the orchestrator re-pin.
- `src/core` edit: all 27 engines surveyed before and after, `engdiff.py`: movers=1 (activity cemipu -> conformant), conformant-losses=0.

## Fixtures / tests (jar renders via scripts/oracle-render.sh)
- `tests/fixtures/activity/add4-T3c/{partition-while,group-while-labels,partition-while-backward,partition-while-wide-title,partition-repeat}` are covered by `tests/diagrams/activity/group-inner-ink.test.ts`, which also has a unit case for `width + 14` and the empty-body case.
- `{action-hrule-single,action-hrule-dotted}` and the `nodeFudge` unit cases are in `tests/diagrams/activity/layout/canvas-origin-fudge.test.ts`. Both fixtures had 5 and 2 diffs before the fix.
- `{lane-package,lane-card,lane-hrule}` are `it.fails` in the same file (see the STOP hunk below).
- `swimlane-context.test.ts` has a node-aware `measureLaneExtents` case. `tests/unit/core/svg-zero-stroke.test.ts` has 6 cases.

## STOP: hunks outside the write-set (not applied; sandbox-measured, then reverted)
1. **lebile 60 = GROUP-SNAKE-SCOPE.** The geometry is now exact, and every remaining diff is draw order. The jar merges the inner while's out snake, which ends at (411.244,195.056), with the if's then-out connection that starts there (one worm, jar elements 32-34, drawn before the if's in-connection). Ours draws the out connection last. Mechanism: `FtileGroup#drawU` (`FtileGroup.java:209-227`) has NO UGraphicForSnake. The only ones are per lane (`Swimlanes.java:252,274,386`) plus the measuring one in `getInnerMinMax:152`. The `groupScope` push/pop in `layout/tile-coordinates-group.ts:94-97` ("D1/T1b: FtileGroup opens its own nested UGraphicForSnake") is a premise that was never verified: `connection-census.md` §3 case F says so itself. Sandbox with the push/pop removed: lebile 60 -> 0, Σ 1381 -> 1321, 0 risers, golden ratchet / parity / census green. It also needs `tests/diagrams/activity/layout/snake-merge-group-scope.test.ts` and the `snake-merge.test.ts` "FtileGroup/partition scope isolation" block retired. Owner: whoever owns tile-coordinates-group.ts / snake-merge (T3a's or a new task).
2. **Lane node-aware ink needs `swimlane-placement.ts#laneItemsOf` (~:380-386)** to copy `usymbol`/`label` onto the LaneItem:
   ```
   +    const ink = { ...(node.usymbol !== undefined ? { usymbol: node.usymbol } : {}), ...(node.label !== undefined ? { label: node.label } : {}) };
   -        ? { swimlane: node.swimlane, kind: node.kind, x: node.x, width: node.width }
   -        : { kind: node.kind, x: node.x, width: node.width },
   +        ? { swimlane: node.swimlane, kind: node.kind, x: node.x, width: node.width, ...ink }
   +        : { kind: node.kind, x: node.x, width: node.width, ...ink },
   ```
   Sandbox: the 3 lane fixtures go 40/18/18 diffs -> 0, all 31 rows unchanged, and the gates stay green. After it lands, flip `it.fails` to `it` in `canvas-origin-fudge.test.ts`.

## Not done + why
- cemipu "x off by 0.001" (338.863 vs jar 338.862 on lane 2's centre column, 28 values). This is below compareSvg tolerance, 0 score units. Mechanism so far: ours computes 338.86250000000006821, which `%.3f` HALF_UP (`SvgGraphics.java:473`) rounds up. The jar's double must sit below 338.8625. That is a floating-point accumulation-order difference somewhere in the text-width -> lane -> compress -> Recentred chain. Ruled out: the lane-translate summation order (`Swimlanes.java:426-427` vs `swimlane-lane-origins.ts:102,119`). A sandbox with the jar's order changed the delta by 3e-14 and left the output value identical. Ours already carries error upstream of that (contentMinX 66.31250000000001, width 239.45000000000002 from the measurer). Not isolated further: that needs per-op instrumentation of the jar.
- Titled separators: `-- t --` in an action crashes our renderer (`No driver registered for shape UHorizontalLine`, `AbstractCommonUGraphic.ts:140`). `classifyStripeLine` returns LITERAL+titledHorizontalLine, so `isActionSheetEligible` routes it to the sheet path. Pre-existing, in `activity-creole-sheet.ts` (T3-gates). `nodeFudge` still treats it as full width per `UHorizontalLine.java:87-96`. That is not oracle-verified because ours cannot render it.

## Out-of-write-set edits
- `docs/catalog.md`: regenerated (`npm run catalog`), two new modules.

## Observation: FtileGroup is not a snake scope
- **Context**: lebile residual after GROUP-INK.
- **Finding**: `new UGraphicForSnake` appears only in `Swimlanes.java:252,274,386` and `FtileGroup.java:152` (measurement only). A snake inside a group merges with one outside it.
- **Impact**: the `groupScope` gate in our snake merge is a structural divergence. Any group/partition row with a connector at the group out point can carry draw-order diffs.
- **Confidence**: High (Java grep + lebile sandbox 60 -> 0, 0 risers)

## Observation: a while overruns its own width by 14 px of LimitFinder ink
- **Context**: GROUP-INK derivation.
- **Finding**: the emphasized `asToUp` arrowhead on the loop-back vertical at `x = width`, padded by HACK_X_FOR_POLYGON, gives a group frame orig + 9 before compression. The post-compression "+6" T2g measured is the compressor at work, not the ink.
- **Impact**: when a jar measurement is read off a compressed SVG, check `smaller(5)` before deriving a constant.
- **Confidence**: High

## Resume (after merge 1d2fb519d; write-set extended)
| sha | subject | Σ (20 rows, pinned 1174) |
|---|---|---|
| a0bd40192 | fix(activity): let snakes merge across a group frame | 1114 |
| e243d6ac2 | fix(activity): measure a lane with node-aware ink | 1114 |
- lebile-91-veto202 60 -> 0. 0 risers. Element census unchanged. Ratchet (392), parity, invariant, style/text/swimlane census, diff-baseline ratchet and tests/diagrams/activity + tests/unit/activity are all green. No census mover.
- Retired: snake-merge-group-scope.test.ts and snake-merge.test.ts's scope-isolation block. The Java quote (FtileGroup.java:209-227 has no UGraphicForSnake) is in the replacement test comment.
- Not done: `EdgeMeta.scope` (swimlane-placement.ts) and its producer `tile-coordinates.ts:164` plus `Out.groupScope` (:78) are now dead. tile-coordinates.ts is outside the write-set, so they are left for its owner.
