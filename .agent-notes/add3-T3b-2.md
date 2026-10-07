# add3-T3b-2 — switch cross-lane case-to-merge connector

## Commits
- `88db2aaa5` fix(activity): restore switch's cross-lane case-to-merge
  connector (2 files, +145/-25): `src/diagrams/activity/layout/
  walk-switch.ts` + new test `tests/diagrams/activity/layout/walk-switch-
  cross-lane-merge.test.ts`. Only commit this session; worktree clean at
  HEAD.

## Mechanism (diagnosis artifact)
- **Symptom**: mojezi-43-gamu360 lost 2 `<line>` + 1 arrowhead `<polygon>`
  (its last case's own outgoing connector to the merge diamond) when T3b
  rewrote the switch walk (`0720c0e81`, merged `8c1823078`; byte-exact at
  the prior commit `e5ef5b9e3`).
- **Mechanism**: `FtileSwitchWithManyLinks#getFirstOutgoingArrow`/
  `#getLastOutgoingArrow` (`FtileSwitchWithManyLinks.java:489-507`) filter
  candidates on `differentSwimlane(this, tile)`, where `this` is the
  switch itself. `FtileSwitchNude#getSwimlaneOut()` returns
  `getSwimlaneIn()` (`FtileSwitchNude.java:85-86`), which returns the
  switch's own single `in` field -- set once at construction
  (`FtileSwitchWithDiamonds.java:67-68`) and shared, unconditionally, by
  EVERY branch. A branch's entry lane is therefore always the switch's
  home lane, regardless of what an internal `|lane|` directive changes it
  to afterward -- `differentSwimlane(this, tile)` is structurally always
  false at this call site; upstream's window filter never actually
  excludes anything on lane grounds.
  `walk-switch.ts#sameLane` (now deleted) computed `laneIn(c, myLane) ===
  myLane`, and `laneIn` -- correctly, for a multi-statement branch --
  descends into the branch's FIRST statement to find the entry lane. But
  for a single-statement branch whose sole statement itself opens with
  the `|lane|` directive (mojezi's `case (Aba1) |S1| :ActPrS1;`), there is
  no separate "entry" tile ahead of it, so `laneIn` returned that leaf's
  own POST-directive lane (S1) instead of the branch's true entry lane
  (S2, same as the switch's home lane) -- the opposite answer from
  upstream's for exactly this shape.
- **Origin**: `src/diagrams/activity/layout/walk-switch.ts` (old lines
  187-216, the `sameLane`/`getFirstOutgoingArrow`/`getLastOutgoingArrow`
  trio).
- **Causal chain**: `pushCaseToMergeEdges` only calls `pushOneMergeEdge`
  for cases inside `[firstIdx, lastIdx]`. With case 1 wrongly excluded
  from the window, `pushOneMergeEdge` was never called for it at all --
  even though that function ALREADY carries the correct, previously-
  ported (`activity-divergence-drive-2` T1p-e) cross-lane geometry (the
  `switch-v-then-h-cross` loop tag, dispatched through `swimlane-
  placement.ts#routeEdge` -> `swimlane-loop-translate-switch.ts
  #routeSwitchVerticalThenHorizontal` -> `switch-cross-shapes.ts
  #routeSwitchVerticalThenHorizontalCross`). Reaching that function was
  the entire fix; its formula already matched
  `ConnectionVerticalThenHorizontalCrossSwimlane#drawTranslate`
  (`FtileSwitchWithManyLinks.java:362-393`) byte-for-byte once called
  (verified against mojezi's own jar coordinates: `(58.0125,168.5) ->
  (58.0125,190.5) -> (161.375,190.5)`, matching `mp1a`, `(mp1a.x,
  mp2b.y+halfHeight)`, `(mp2b.x-halfWidth, same y)` exactly).
- **Ruled out**: the T1p-e `switch-h-then-v-cross`/`switch-v-then-h-cross`
  machinery itself was already correct and already wired into BOTH
  `pushCaseInEdge` (ingoing) and `pushOneMergeEdge` (outgoing) by T3b --
  ingoing never broke because `pushCaseInEdges` always pushes both first
  and last cases unconditionally (no lane filter there, matching
  `addIngoingArrows`'s own unconditional `tiles.get(0)`/`tiles.get(size-
  1)` adds, `FtileSwitchWithManyLinks.java:433-434`). Also ruled out: the
  *separate* `differentSwimlane(this, tile)`-gated extra connector in
  `addIngoingArrows` (`:441-443`) and the BIG_DIAMOND per-lane duplicate-
  box mechanism (`T1p-e-switch-cross-swimlane.md`) -- neither applies to
  mojezi/ruzazu, both confirmed SMALL_DIAMOND mode (single box per case,
  no duplicates in either fixture's own jar SVG).
- **Fix**: deleted `sameLane`; `getFirstOutgoingArrow`/
  `getLastOutgoingArrow` now check only `hasPointOut()` (upstream's one
  live condition at this call site). Also gated `pushOneMergeEdge`'s
  `applyOutLabel` call on `laneOut(c, myLane) === laneIn(mergeDiamond,
  myLane)`: the connector that actually draws for a genuinely cross-lane
  case is `ConnectionVerticalThenHorizontalCrossSwimlane`, whose
  constructor never takes a label param at all (`:352-356`), unlike the
  same-lane classes' `.withLabel()` call (`:176-177,274-275`) -- harmless
  on mojezi/ruzazu (neither case carries a trailing `-> label;`) but would
  have mis-attached a label on a future fixture that does.

## Verification
- `mojezi-43-gamu360`, `ruzazu-94-meso880`: `activity-probe-elements.ts
  --slugs` both -> `missing line+arrow: 0`, `exact: 2` (both fixtures,
  combined weightedScore 106, down from the pre-fix 3-element-short
  state).
- Full 76-row baseline (`activity-probe-elements.ts`, no filter):
  `missing line+arrow: 0` everywhere -- confirms no OTHER switch+
  swimlane fixture in the corpus carries this same loss (corpus scan:
  only mojezi and ruzazu combine `switch (` with a swimlane directive in
  the cached fixture set).
- Full 76-row baseline (`activity-probe.ts`): **0 risers**, 29 fallers (all
  toward the jar; aggregate weightedScore 6710 -> 6697 at this commit,
  rule 10's own "stale" caveat already applied -- Σ was already moving
  under other in-flight work this session didn't touch).
- `activity.golden.ratchet.test.ts` + `activity.harness-parity.test.ts`:
  337/337 green, all pins byte-equal.
- `activity.{style,text,swimlane}-baseline.test.ts` (equality pins): 43
  failures, but **byte-identical set before and after this fix** (verified
  by temporarily reverting `walk-switch.ts` to its pre-fix content via
  `git checkout HEAD -- <file>`, re-running, diffing the failing-test
  list against the post-fix run -- `diff` exit 0, same 43 fixtures both
  times). These are PRE-EXISTING stale pins (consistent with the
  orchestrator's own git status showing these three JSON files already
  modified before this task started) -- not introduced by this change.
  Orchestrator: re-pin all three from a fresh measurement; this task did
  not touch `oracle/goldens/**` (rule 5).
- `tests/diagrams/activity` (full directory, not `npm test`): 1116/1116
  green. `tsc --noEmit` both configs: clean. `eslint` on both changed
  files: clean. New test file 94 lines, `walk-switch.ts` 405 lines (both
  under the 500-line cap).

## Residual (not attempted -- "if time remains", budget spent on the
primary defect)
- T3b's own open residual (`Ydelta1a` SMALL_DIAMOND undershoot, 21
  computed vs 32 the jar needs on every affected row) is UNCHANGED by
  this commit -- out of this task's write-set focus and not re-derived.
  Re-read `FtileSwitchWithDiamonds.java:100-102,168-172`:
  `getTranslateMain`'s `dy1 = diamond1.height + getYdelta1a()`, and
  `calculateDimensionInternalSlow`'s SMALL_DIAMOND branch
  (`dim1.appendBottom(dimNude).appendBottom(dim2).addDim(0,
  getYdelta1a()+getYdelta1b())`) -- confirms T3b's formula citation is
  correct and the discrepancy is real (not a mis-citation), but did NOT
  author the multi-line case-label fixture needed to disambiguate the
  exact missing term, per the brief's own "if time remains" ordering.

## Quality gates run (all green at HEAD `88db2aaa5`)
`tsc --noEmit` (both configs), `eslint` on both changed files,
`vitest run tests/diagrams/activity` (1116/1116), `activity.golden.ratchet
.test.ts` + `activity.harness-parity.test.ts` (337/337, byte-equal),
switch-family unit tests (`switch-cross-shapes`, `switch-big-diamond-
swimlane`, `switch-swimlane-duplicate`, `gtile-switch`, new `walk-switch-
cross-lane-merge`: 44/44). Did not run the full `npm test` (rule 4).
