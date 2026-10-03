## Observation: pushRepeatOut's axis drift (same T1b-class bug, a new site)
- **Context**: T2h, diagnosing why `jupoxe-15-sugo110` (status: baseline,
  pinned Σ 1822, stale pin from before T2e's `endnote` fix exposed its
  real content) throws in `snake-merge-worm.ts#directionOf`.
- **Mechanism**: `walk-repeat.ts#pushRepeatOut` (the `ConnectionOut`
  edge, `FtileRepeat.java:275-293`) built both endpoints as `bodyX +
  body.getCoord(SOUTH_HOOK).x` / `condX + condition.getCoord(NORTH_HOOK)
  .x`, where `bodyX`/`condX` were THEMSELVES already `tileX + t
  .bodyOffsetX` / `tileX + t.conditionOffsetX` (computed one step
  earlier in `pushRepeatNodesAndBuildFrame`). Each side therefore folded
  the walk-time absolute `tileX` in BEFORE its own local
  offset+hook round-trip resolved -- two DIFFERENT tiles' own hook
  values each going through their own copy of `(tileX + offsetX) +
  hook.x`, which can round one ULP apart even though both are
  mathematically `tileX + left` upstream. Identical bug class to T1b's
  `pushTopDownSiblingEdge` defect (`.agent-notes/T1b-snake-merge.md`'s
  AXIS_EPSILON section), a DIFFERENT site (not yet fixed there).
- **Origin**: `src/diagrams/activity/layout/walk-repeat.ts`,
  `pushRepeatOut` (old body, line ~262-263) and `pushRepeatIn` (old
  body, line ~240-241) -- both read `bodyX`/`condX`/`entryX` (pre-folded
  absolute, built in `pushRepeatNodesAndBuildFrame`) and added a hook
  offset in a SEPARATE, later statement.
- **Causal chain**: `FtileRepeat.java:285-293`'s own
  `getTranslateForRepeat`/`getTranslateDiamond2` compute ENTIRELY in
  local space (`left - repeat.left`/`left - diamond2.width/2`, then
  `.getTranslated(pointOut/pointIn)`) -- the caller's absolute origin is
  composed as one OUTER translate, applied only once, never folded into
  this same sum. Our port folded the walk-time absolute `x` into
  `bodyX`/`condX` FIRST (one large-number add), then added each tile's
  own hook SECOND (another large-number add) -- IEEE-754 does not
  guarantee `fl(fl(a+b)+c) == fl(a+fl(b+c))` for arbitrary a/b/c, and the
  two sides' different `b`/`c` pairs (different offsetX, different hook
  magnitude/sign) round differently.
- **Ruled out**: a genuine geometric divergence in the hook values
  themselves -- ruled out because `body.getCoord(SOUTH_HOOK)` and
  `condition.getCoord(NORTH_HOOK)` are each a SINGLE tile's own fixed
  local value, confirmed via the debug trace (`b.points` dumped
  immediately before the throw: `[{x:1421.58125,y:878},
  {x:1421.5812500000002,y:926}]`, i.e. the drift is entirely WITHIN one
  freshly-pushed edge's own two endpoints, not a merge-boundary
  artifact -- `a.points` on the SAME call, `[{x:1421.58125,y:830},
  {x:1421.58125,y:878}]`, has matching x on both its own points,
  confirming the merge machinery itself (`snake-merge.ts`/
  `snake-merge-worm.ts`) is not the source). Also ruled out: T2c's/T2g's
  write-sets -- `walk-if-down.ts`, `conditional-builder.ts`,
  `gtile-diamond*`, `gtile-spot`, `ast`/`renderer`/`tile-layout` were
  never on the call stack (`joinOrdered -> mergeTwo -> addToPending`,
  `snake-merge.ts:112/133` <- `walk-repeat.ts` only).
- **Confidence**: High (reproduced via direct instrumentation of
  `joinOrdered`'s `a.points`/`b.points` immediately before the throw,
  traced the exact coordinate family back to `pushRepeatOut`'s two
  hook-sum expressions, confirmed the fix resolves the throw AND leaves
  the full 232-fixture corpus aggregate's only movement at the one
  fixture whose real content newly renders).

## Diagnosis artifact
- **Mechanism**: `(tileX + offsetX) + hook.x` grouping (absolute origin
  folded in before the local offset+hook round-trip resolves) instead
  of `tileX + (offsetX + hook.x)` (local round-trip first, absolute
  origin added exactly once, last) -- same class as T1b's fix, a
  different call site.
- **Origin**: `src/diagrams/activity/layout/walk-repeat.ts:276-283`
  (`pushRepeatOut`, old body) and `:258-263` (`pushRepeatIn`, old body).
- **Causal chain**: see above -- two different tiles' own local
  round-trips, sharing the SAME absolute `tileX` fold but DIFFERENT
  offset/hook pairs, can land on bit-different final doubles even though
  both represent the same mathematical point.
- **Ruled out**: merge-machinery artifact, T2c/T2g write-set origin,
  hook-value divergence -- all three eliminated with evidence (above).

## Commits
1. `7aca5ce8e` `fix(activity): resolve pushRepeatOut's local round-trip
   before tileX` -- `walk-repeat.ts#pushRepeatOut`/`pushRepeatIn`
   regrouped to `tileX + (offsetX + hook.x)`; added `entryOffsetX`/
   `bodyOffsetX`/`conditionOffsetX` to `RepeatFrame` (sourced from the
   already-existing `GtileRepeat.entryOffsetX`/`bodyOffsetX`/
   `conditionOffsetX`, `gtile-repeat.ts:169-172`, outside this task's
   write-set and unmodified).
2. `96901d865` `fix(activity): sweep the same axis-drift regroup into
   two if-walkers` -- `walk-if-long-vertical.ts#connectionVertical` and
   `walk-if-long-horizontal.ts#connectionVerticalIn`, the only other two
   direct-unguarded-2-point (no elbow/dogleg fallback) cross-tile edges
   in this task's write-set, matching the identical structural pattern.

## Every regrouped site, ours (file:line, POST-fix) → Java (file:line)
| ours | Java |
|---|---|
| `walk-repeat.ts#pushRepeatOut` (~276-291) | `FtileRepeat.java:275-293` (`ConnectionOut#getP1`/`getP2`, `getTranslateForRepeat`/`getTranslateDiamond2` at `:730-765`) |
| `walk-repeat.ts#pushRepeatIn` (~258-263) | `FtileRepeat.java:221-271` (`ConnectionIn#drawSnake`) |
| `walk-if-long-vertical.ts#connectionVertical` (~187-203) | `FtileIfLongVertical.java:265-298` (`drawU`/`getP1`/`getP2` at `:287-294`) |
| `walk-if-long-horizontal.ts#connectionVerticalIn` (~144-166) | `FtileIfLongHorizontal.java:389-436` (`drawU`/`getP1`/`getP2` at `:409-415`) |

## Probe Σ before/after, every mover + mechanism
Full-corpus probe (`npx tsx scripts/activity-probe.ts`) cannot measure a
true "before" aggregate: at the pre-fix commit (`e4e7f5e58`), rendering
`jupoxe-15-sugo110` throws UNCAUGHT and aborts the whole script (no
per-fixture try/catch in `activity-probe.ts`) -- confirmed by
reproducing the SAME throw at `e4e7f5e58` in a separate pinned-commit
worktree. The only valid "before" reference is the COMMITTED pins in
`oracle/goldens/svg-activity/diff-baseline.json` (Σ **25086** over 232
`status: "baseline"` rows) vs. the LIVE measurement after this task's
fix (Σ **24410**, same 232 rows, same commit `96901d865`) -- exactly
what `activity-probe.ts`'s own `risersAndFallers` already compares.

- **jupoxe-15-sugo110**: pinned 1822 → live **1238** (**-584**,
  FALLER). Mechanism: this task's own fix -- the diagram's real content
  (3 `if`s, 2 `repeat`/`repeat while` loops, previously hidden behind
  T2e's note-closer bug and then this crash) now renders in full and
  measures far closer to the jar than the stale pin's truncated-content
  score implied.
- **vimoxa-78-zucu656**: pinned 80 → live **84** (**+4**, RISER).
  **NOT caused by T2h** -- `vimoxa`'s fixture contains zero occurrences
  of `repeat` (confirmed by grep on its cached `in.puml`), and this
  task's write-set changes are only reachable through `walkRepeat`/
  `GtileRepeat`/`GtileIfLongVertical`/`GtileIfLongHorizontal` dispatch,
  none of which `vimoxa` exercises. This is the SAME rise T2e's own
  `.agent-notes/T2e-parser-gaps.md` already explained and attributed to
  its `endnote`-closer fix (an EXPLAINED, pre-existing, already-landed
  rise simply not yet re-pinned into `diff-baseline.json`).
- **activity-creole-table**: pinned 35 → live **0**; **laxibe-66-
  teme800**: pinned 26 → live **0**; **niletu-83-lego826**: pinned 35 →
  live **0** (all three FALLERS, all now EXACT matches). **NOT caused
  by T2h** -- none of the three contains `repeat` either (confirmed by
  grep), so this task's edits cannot reach them. These are pre-existing
  drift between the pins' `measuredAgainstCommit` (`d018a56f`) and this
  branch's own already-merged T2e work, simply not yet re-measured/
  re-pinned -- same class as `vimoxa`'s own explained rise, just not
  independently re-diagnosed here (outside this task's mechanism and
  write-set).
- **Every other baseline row (228 of 232)**: unchanged, confirmed by the
  identical aggregate (24410) and identical riser/faller list before vs.
  after the second commit's sweep fix (`walk-if-long-vertical.ts`/
  `walk-if-long-horizontal.ts`) -- proving those two regroups moved
  ZERO existing fixtures (they only change bit patterns at a ULP
  boundary no current fixture happens to land on).
- **0 unexplained risers**: the only riser (`vimoxa`) is explained and
  attributed to an ALREADY-LANDED, different task (T2e), not to this
  task's mechanism.

## Quality bar
- `tests/diagrams/activity`, `tests/unit/activity`,
  `activity.golden.ratchet`, `activity.harness-parity`,
  `compress/invariant.test.ts`: **1544/1544 passing** (foreground
  `npx vitest run`, scoped, not the full `npm test`, per this task's own
  instruction).
- `npm run typecheck`: clean (both tsconfigs).
- `npx eslint` on every touched file: clean.
- Pinned goldens (`activity.golden.ratchet.test.ts`): byte-equal,
  unaffected.
- `directionOf` stays an EXACT mirror of `Direction.java:110-130` --
  no tolerance/epsilon introduced anywhere; the fix is a pure
  regroup of existing terms, no new constant, no changed hook value.

## Could not do / flagged, not done
- Did not re-pin `diff-baseline.json` (jupoxe's new score, vimoxa's
  explained rise, or the three unrelated-drift fallers) -- re-pinning is
  orchestrator-only per established mission convention (`.agent-notes/
  T1p-d-repeat-weld.md`'s own citation of `repin-activity-baselines.ts`).
- Did not re-diagnose `activity-creole-table`/`laxibe-66-teme800`/
  `niletu-83-lego826`'s own mechanism past ruling out this task's own
  (confirmed: no `repeat` construct reachable by this task's write-set)
  -- their cause is some other already-merged, already-explained-
  elsewhere-or-unexplained change on this branch, outside T2h's scope.
- Considered, NOT fixed (no confirmed defect, risk of unrelated-scope
  edits): `walk-repeat-weldings.ts#pushWeldDiamond`'s `conditionExit`/
  `diamondEntry` 2-point edge -- structurally similar (`condX + hook.x`,
  `dX + WELD_DIAMOND_SIZE/2`) but NOT required to be axis-aligned by
  design (`asToRight` routing, genuinely diagonal), not exercised by any
  fixture in this task's evidence trail (jupoxe has no `break` inside
  its `repeat`s, so `weldDiamond` is `undefined` and this function never
  runs for it); left unfixed, noted for whoever next finds a genuine
  defect there.
- `walk-switch.ts`/`walk-fork-branches.ts`/`walk-while-branch.ts`'s own
  cross-tile hook sums all route through a dogleg/elbow helper
  (`GConnectionSideThenVerticalThenSide`, `connectionInPoints`-style
  midpoint construction, or direct reuse of one side's own x for the
  elbow) rather than a direct unguarded 2-point push -- swept, no
  instance of the EXACT at-risk pattern (direct 2-point push needing
  bit-exact cross-tile equality) found outside the two files already
  fixed in commit 2.
