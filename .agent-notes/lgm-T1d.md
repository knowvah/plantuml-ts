# lgm-T1d — drawn border-point composite rectangle (A3 remainder)

## Commits (branch lgm/T1d)
- 8e342afb9 fix(state): draw border-point composites at the L+2 rectangle
- (this note) docs(notes): lgm-T1d report

## Java -> ours
- `Cluster.java:430` (reassigns rectangleArea per call), `:344-345` (manageEntryExitPoint per drawU), `SvekResult.java:130-136` (calculateDimension -> getMinMax drawU = ink pass), `:71-74` (allCluster() creation order, parents first), `SvekEdge.java:660-663` + `DotStringFactory.java:465-466` (solve-loop calls) -> new `src/diagrams/state/state-composite-drawn-rects.ts#drawnClusterRects`: replays L solve calls (allLines order, projection cluster per line) + 2 draw passes over core `ClusterRectangles`; ink = rect after the cluster's own call in pass 1, drawn = after pass 2.
- `state-composite-geo.ts#borderPointBox` rewritten to read `drawnClusterRects` (box = drawn; `inkOverflow` = ink vs drawn; `borderPointLabelAbove` from the drawn box, `EntityImageStateBorder.upPosition`). Its private frontier+ensureMinWidth and `borderPointInkOverflow` (raw-children ink model) are deleted: core `entryExitPointRect` is the same call (`Cluster.java:410-436`) and is what `ClusterRectangles` runs.
- Dead after this: `state-composite-frontier.ts` wrappers `frontierCalculator`/`ensureMinWidth` (+ their tests), `Point`; GeoSpec `frontierMinWidth`, `rankdir`. Removed. GeoSpec gained `solveAcc` (the pass accumulator) set with `borderPointMemberIds` in `state-composite-cluster.ts`.
- Core untouched (`src/core/**` has no edit).

## Write-set deviations (flag for owner)
- `src/diagrams/state/state-transition-clip.ts` (not in the listed write-set, not forbidden): `projectionSpecsOf` now takes a node lookup (was `DotLayoutResult`) and is exported; exported `inSolveOrder`, `toRectangleArea`; new `projectionClusterIdOf(acc)` shared by the clip loop and the drawn-rect replay. No behaviour change to the clip.
- New files: `state-composite-drawn-rects.ts`, `tests/helpers/composite-outlines.ts`, `tests/unit/state/lgm-T1d-drawn-composite.test.ts`; `docs/catalog.md` regenerated (generated, drift-gated).

## Fixtures (tests/fixtures/lgm-T1d/ + all of lgm-T1b state-*): composite outline rect vs jar
- state-titled-ensure-min-width (T1b): fails with the solve-call replay disabled, passes with it; fails with draw passes absent (pre-change f^1 = 35.49 -> jar 35.489).
- pesita-10-dene726 `AA`: x 618 -> 620.906 (jar 620.906, `620.906,148,126,104.72`). compareSvg 186 diffs / ws 945 -> 176 / 935.
- Other T1b fixtures + state-nested-titled (both composites titled, nested, ports on both, lines to both) + state-titled-port-lines-only (L=0): outlines already equal before (title not binding there) and still equal; the test pins them.
- viroxo-69-fito663 unchanged (90 / 150; DOT member-order residual from T1b).

## Gates
- Surveys state, component, usecase, unknown, class before/after (no core edit): engdiff movers=0, conformant-losses=0 (state 73/12/188, component 65/67/134, usecase 28/19/46, unknown 362/57/406, class 709/4/10 identical; per-row state rows identical). elements before/after: away=0 toward=0.
- Ratchet movers: none. `npx vitest run tests/oracle tests/unit/state tests/unit/description tests/unit/core tests/architecture` = 497 files, all pass after `npm run catalog` (catalog drift was the single failure).
- typecheck, eslint, prettier clean.

## Not done
- `state-composite-geo.ts` is not the only L+2 consumer: class (`class-geo-builders-port.ts#portFrontierBox`, `class-edge-geo.ts`) and description (`frontier-cluster-bbox.ts#computePortClusterBbox`) still draw the one-call frontier box. Owners: class / description geo.
- The draw order of passes uses `acc.borderPointClusters` order (parent-before-child print order) as `allCluster()` creation order; sibling order between unrelated composites cannot matter (clusters read only their own parent/child rects), parent/child order is the same.
- The replay takes lines from `acc.edgeSources` (all registered edges) rather than only edges present in the layout result; an edge dropped by layout would add a call. No fixture hits it.

## Observation: survey verdict rows do not see this fix
- **Context**: pesita AA box fixed; state survey identical row-for-row.
- **Finding**: maxDelta/verdict stay dominated by other diffs; only compareSvg diff counts (186 -> 176) and exact-rect tests see it.
- **Impact**: gate this mechanism with the outline-rect test, not the survey.
- **Confidence**: High.
