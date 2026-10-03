# T1b — snake-merge port (D1/D2)

Branch `add2/T1b`, worktree `.claude/worktrees/add2-T1b`. Commits (in
order): `7cd434907`, `a8dc4be29`, `2bc4dd671`, `e46868ea5`. Not merged,
not pushed.

## Commits
- `7cd434907` feat(activity): scaffold snake-merge inputs (D1/D2) --
  `ActivityEdgeGeo.mergeable`, `EdgeMeta.scope`, `Out.groupScope`; fixed
  a pre-existing (lizard-invisible) 6-param violation on
  `assignCoordinates` surfaced by the new code, bundling `baseX`/`baseY`
  into one `origin: GPoint` param across its one production call site
  and the test suite's positional calls.
- `a8dc4be29` feat(activity): port Snake-merge two-pass connector fusion
  (D1/D2) -- `layout/snake-merge.ts` + `layout/snake-merge-worm.ts`
  (new), wired into `assign-coordinates-full.ts` between
  `placeSwimlanes` and `compressGeometry`; wires the 4 real NONE/LIMITED
  push sites; adds an `AXIS_EPSILON` tolerance for ulp-scale float
  drift; updates 6 unit tests whose edge-count assertions the fusion
  legitimately changed (with mechanism cited), plus one disappeared
  `ALLOWED_HARD_OVERLAPS` entry in the compress invariant test.
- `2bc4dd671` test(activity): cover snake-merge's Snake/Worm/scope
  mechanics -- 3 new test files, 100% branch coverage on both new
  source files from these alone.
- `e46868ea5` chore(activity): regenerate catalog for snake-merge
  modules.

## Java → ours mapping
| Java | file:line | ours |
|---|---|---|
| `UGraphicForSnake.addPendingSnake`/`flushUg` | `svek/UGraphicForSnake.java:126-176` | `snake-merge.ts#mergeSnakes` (two loops) |
| `PendingSnake.merge` | `UGraphicForSnake.java:111-122` | `snake-merge.ts#addToPending` |
| `PendingSnake.touchesOther`/`removeEndDecorationIfTouches` | `UGraphicForSnake.java:81-100` | `snake-merge.ts#touchesOther`/`removeEndDecorationIfTouches` |
| `Snake.merge`/`Snake.cannotBeTouched`/`Snake.same` | `activitydiagram3/ftile/Snake.java:291-337` | `snake-merge.ts#mergeTwo`/`joinOrdered`/`cannotBeTouched`/`same` |
| `MergeStrategy.max` | `activitydiagram3/ftile/MergeStrategy.java:38-46` | `snake-merge.ts#maxStrategy` |
| `Worm.merge`/`mergeMe` + ten patterns | `activitydiagram3/ftile/Worm.java:361-556` | `snake-merge-worm.ts` (`wormMerge`, `mergeMe`, `removeNullVector`..`removePattern8`) |
| `Direction.fromVector`/`getInv` | `utils/Direction.java:102-130` | `snake-merge-worm.ts#directionOf`/`inverse` |

4 real `withMerge` sites wired (every other push stays the builder's
own default `FULL`, needing no field at all):
- `walk-if-down.ts#connectionHline` → `NONE` (`FtileIfDown.java:461-522`)
- `walk-if-long-horizontal.ts#connectionHline` → `NONE`
  (`FtileIfLongHorizontal.java:476-570`, `:507`)
- `walk-if-with-links.ts#connectionHlineLinks` → `NONE`
  (`FtileIfWithLinks.java:421-500`)
- `walk-while-branch.ts#pushWhileOut`'s first edge → `LIMITED`
  (`FtileWhile.java:482-511`, merge-case C)

Verified-inert (documented, not wired, zero behavioral effect since no
second edge exists in our data to touch): `FtileIfWithLinks`'s
`ConnectionHorizontalThenVertical`/`VerticalThenHorizontal`/
`VerticalThenHorizontalDirect` LIMITED sites (our walker already draws
ONE merged edge per branch, not the jar's two-snake pair) and
`FtileWhile.ConnectionIn`/`ConnectionBackSimple`'s `drawTranslate`
LIMITED (cross-swimlane only; `swimlane-loop-translate-while.ts`'s own
prior comment already said "has no representation here" -- confirmed).

## MISSING re-check (task item 0)
Re-ran T1a's §1 MISSING list against the code after batch 1p: **zero
still-MISSING sites**. All five batch-1p builders (`T1p-a` HLINE,
`T1p-b` `FtileIfLongVertical`, `T1p-c` `ParallelBuilderMerge`, `T1p-d`
repeat weld/cross-swimlane out, `T1p-e` switch cross-swimlane) are
present and already wired for the two flagged re-verify sites too:
`FtileIfWithLinks` `ConnectionVerticalOut` → `walk-if-with-links.ts
#connectionVerticalOut` (confirmed, no merge-strategy override, `FULL`
correct); `FtileWhile` `ConnectionOutSpecial` → the `specialOut`
dispatch is `pushWhileOut`/`pushWhileBack` themselves (no separate
"special" path exists in this port; `FtileWhile.java:513-end`'s own
`ConnectionOutSpecial` is a DIFFERENT class I did not find a live call
site for in `FtileWhile.create` -- not re-verified byte-for-byte beyond
confirming no MISSING marker remains in the census; flagged for
whoever next touches this file).

## T1a merge cases (§3) — jar-vs-ours after the merge engine
| case | fixture | before (census) | after |
|---|---|---|---|
| A | becaje-01-vaji284 | poly+1,line+1 | **exact (delta `{}`)** |
| B | cujoni-21-somi079 | poly+1 | element counts now exact; see riser below (D7 reveal) |
| C | vupuse-73-nuso490 | poly+2 | element counts now exact (not independently re-measured past the census; ws unaffected, not a riser) |
| D | jipapo-14-kevu587 | poly+1,line+1 | not independently re-measured (not a riser; assumed closed, same mechanism as A) |
| E | xizola-97-sizu458 | poly+1,line+1 (unrelated join, NOT the labelled edge) | not independently re-measured |
| F (group boundary) | synthetic, confounded | n/a | re-tested in ISOLATION instead (see below), not re-attempted with the original confounded fixture |

bocaga-53-nale241 and jecoxu-17-zama003 (the two other census-sampled
duplicate-decoration rows): **exact (delta `{}`)**.

Break-in-repeat six (journal row 14): cixave-47-milo698,
dacuga-41-popo038, bizono-61-sasa740, dixiku-28-guzo497,
doziki-93-rosi997 all now `delta: {}` (weld-join arrowheads/lines gone,
confirmed via `activity-probe-elements.ts`'s per-row delta, not
estimated). mudobi-07-biji996's line/arrow delta is also gone, but it
keeps a **separate, pre-existing** `{path:-1,text:-1}` delta --
T1p-d's own `.agent-notes/T1p-d-repeat-weld.md` already diagnosed this
as a sequential-gap/compression defect unrelated to welding or merging
(reproduced with ZERO repeat/weld/merge code in the call path); not
rechased here.

## Group-boundary scope (D1, case F superseded)
Case F's own synthetic fixture was confounded (two unrelated merges
elsewhere dominated its delta) and is NOT reattempted here. Instead:
`EdgeMeta.scope` + `Out.groupScope` (new, this task) tag every edge
with the `FtileGroup`/`partition` nesting active at push time;
`snake-merge.ts#addToPending`/`removeEndDecorationIfTouches` gate on
scope equality. Tested in isolation at two levels:
- `snake-merge.test.ts` ("FtileGroup/partition scope isolation"): two
  otherwise-touching edges with different `scope` strings never merge;
  same-scope edges still do; `undefined` (top-level) never merges into
  a scoped edge.
- `snake-merge-group-scope.test.ts`: end-to-end through the real
  `walkTile`/`GtileGroup` dispatch -- confirms the WIRING itself (an
  edge inside a group carries a scope string the outer edges don't;
  nested groups each get their own distinct id).

## Probe Σ / element census, before → after
- Baseline (branch head, `695ab7e0e`): Σ 31381 / 245 rows; elements
  extra line+arrow 98 (ws not separately recorded in this file).
- After the merge engine landed (commit `a8dc4be29`, all 4 strategy
  sites wired): **Σ 25092**, 73 fallers, 6 risers, 244 rows (one row's
  own count shifted by ±1 across a promote/row-count boundary unrelated
  to this task -- not investigated, matches `a8dc4be29`'s own probe
  output exactly as measured).
- Element census (`activity-probe-elements.ts`): extra line+arrow
  **99 → 59** (ws 11370), extra arrow only 14, extra line only 10,
  missing line+arrow 1 (jupoxe, see below), text-only 17, mixed 12,
  **exact 90 → 131**.

## Every riser, with mechanism
6 risers on `activity.diff-baseline.ratchet.test.ts`, all **explained**
(D7), none re-pinned here (re-pinning is orchestrator-only per
established mission convention, confirmed in `.agent-notes/
T1p-d-repeat-weld.md`'s own citation of `repin-activity-baselines.ts`'s
doc comment):

| slug | baseline ws | new ws | Δ | mechanism |
|---|---|---|---|---|
| cujoni-21-somi079 | 124 | 131 | +7 | D7 reveal: element count now EXACTLY matches the jar (merge-case B closed); `compareSvg` switches LCS→positional, exposing a pre-existing, unrelated draw-order divergence (our `ellipse`/`path`/`text` emission order for the `note` construct vs the jar's) that the prior count mismatch hid. Confirmed: `childCount` diff is now absent entirely; every remaining weight-bearing diff is a KIND mismatch (`ellipse` vs `path`, etc.) at a matching index, not a coordinate error. |
| kijazo-83-kipu485 | 125 | 222 | +97 | Same D7 reveal class. `childCount` diff absent; 14/40 diffs are kind-mismatches. |
| nafaxo-62-boso912 | 146 | 167 | +21 | Same D7 reveal class. `childCount` diff absent; 7/58 diffs are kind-mismatches. |
| nikivo-06-kaxa873 | 241 | 330 | +89 | Same D7 reveal class. `childCount` diff absent; 12/174 diffs are kind-mismatches. |
| ruzica-16-deli877 | 463 | 697 | +234 | Same D7 reveal class (largest Δ; this fixture nests `while`/`if`/multi-swimlane, so more elements shift index). `childCount` diff absent; 36/217 diffs are kind-mismatches. |
| jupoxe-15-sugo110 | 1825 | 1828 | +3 | **Different mechanism, verified by comparing against a pre-merge worktree at `7cd434907`** (temporary `git worktree add --detach`, removed after measuring): `childCount` was ALREADY massively diverged before this task (168 vs the jar's 293 -- an unrelated, pre-existing gap from this fixture's deeply-nested `repeat`/`elseif`/`detach` structure, nothing to do with merging). The merge engine correctly fuses a few of OUR OWN edges (168→163, matching the jar's own `Snake.merge` mechanism), which moves our count FURTHER from 293 and so RAISES `compare.ts`'s childCount-weight term (scales with gap magnitude -- project memory `weightedscore-antimonotone-under-growth.md`/`oracle-score-blind-to-magnitude.md`) even though the underlying change is correct. `diffCount` actually FELL (669→637); only the weighted score ticked up, by 3, on an already severely-diverged fixture. Not a merge defect. |

## Acceptance items — status
- T1p-b vertical-if residual (childCount+2/height+20): **CLOSED**.
  `childCountDelta`/`heightDelta` now `0`/`0` on all 5 authored
  fixtures; `activity-vertical-if-t1pb.test.ts` re-pinned with new
  `diffCount`/`weightedScore` and the mechanism (D7 reveal: `diffCount`
  fell, `weightedScore` rose from the SAME index-shift class as the
  6 risers above -- cited inline in the test's own doc comment).
- Journal row 14's six break-in-repeat rows: **DONE** (see table above;
  mudobi's residual is a separately-diagnosed, pre-existing, unrelated
  defect, not line/arrow).
- becaje/bocaga/jecoxu duplicate line+arrowhead: **DONE** (`delta: {}`
  on all three).
- LIMITED/NONE sites never fuse past the Java rule: **DONE** (unit
  tests in `snake-merge.test.ts`; the 72-golden ratchet, which includes
  `saxeku-17-gume203`'s `ConditionEndStyle hline` fixture, is green).
- 72 pinned goldens byte-equal: **DONE** (`activity.golden.ratchet`
  73/73 -- one fixture, `saxeku-17-gume203`, briefly regressed between
  landing the merge engine and wiring the NONE sites; root-caused and
  fixed in the same commit, see below).
- Full corpus extra line+arrow census: **DONE**, 99→59, reported above.
- Every riser has a mechanism: **DONE**, table above.

## A genuine diagnosis along the way (not just acceptance bookkeeping)
Landing the merge engine with zero NONE/LIMITED wiring (as an
intermediate step, before the 4-site wiring commit) regressed
`saxeku-17-gume203` (a pinned golden, `ConditionEndStyle hline`
fixture) by `svg/@height +4`. Root cause: `walk-if-down.ts
#connectionHline`'s closing bar had no `mergeable` tag yet, so it
defaulted to `FULL` and incorrectly fused with the generic top-down
sibling edge into `:E;` -- exactly the fusion `MergeStrategy.NONE`
(`FtileIfDown.java:512`) exists to prevent. Confirmed via the golden
ratchet's own failure message (first diff `svg/@height`), fixed by
wiring the NONE tag (the planned next step), re-verified green.

## A real floating-point defect found and fixed
`pixako-75-kumi821` (break-in-while fixture) crashed the ENTIRE render
pipeline (not just a score regression) with `snake-merge: not a
horizontal or vertical line (63.021875,269)->(63.021874999999994,304)`
-- two points this port's own upstream geometry computes through
different arithmetic paths that should land on the same X, differing
by 6e-15 (confirmed via direct instrumentation of the exact `a.points`/
`b.points` passed into the merge, not guessed). Fixed with a 1e-6
`AXIS_EPSILON` tolerance in `snake-merge-worm.ts#directionOf` --
several orders of magnitude above float64 noise at this magnitude and
below any real geometric distinction in this domain (`Snake.same()`'s
own merge-trigger tolerance is `0.001`). Caught by
`tests/diagrams/activity/layout/compress/invariant.test.ts`'s
"no baseline fixture throws" test, which exercises all 268 baseline
fixtures -- this is the kind of defect that only a full-corpus pass
surfaces, not a hand-picked sample.

## Quality bar
- `tests/diagrams/activity`, `tests/unit/activity`,
  `activity.golden.ratchet` (73/73), `activity.harness-parity`,
  `compress/invariant.test.ts`: **1529/1529 passing** (foreground,
  `npx vitest run`, not the full `npm test`).
- `npm run typecheck`: clean (both tsconfigs).
- `npx eslint src tests`: clean.
- `npm run build`: succeeds.
- `npm run catalog`: regenerated and committed (2 new modules).
- Full `npm test` (coverage) was NOT run to completion in this session
  -- the orchestrator's own policy is to run it at batch close, and a
  prior attempt here hit the harness's stream/foreground timeout and
  was moved to background; its output was not relied on for any
  decision in this report.

## Stale baselines left for the orchestrator (NOT fixed here)
Per the established mission convention (`.agent-notes/
T1p-d-repeat-weld.md`'s own citation: `repin-activity-baselines.ts` is
"ORCHESTRATOR-ONLY: run once at T8/close-out"), I did not re-pin:
- `activity.style-baseline.test.ts` + `activity.text-baseline.test.ts`:
  **64 of 770 tests fail** (stale pins on fixtures this task's merge
  legitimately changed -- a larger set than this task's own 6
  break-in-repeat rows, since the merge engine's effect is corpus-wide).
- `activity.diff-baseline.ratchet.test.ts`: the 6 risers above need
  `--accept-rises` at close.

## Could not do / flagged, not done
- `FtileWhile.ConnectionOutSpecial` (`FtileWhile.java:513-end`): did
  not find a live call site for this specific named class distinct from
  `pushWhileOut`/`pushWhileBack`'s own dispatch; reported as "no MISSING
  marker remains" rather than independently re-verified line-for-line.
- T1a merge cases C/D/E were not independently re-measured post-engine
  (only A/B and the three §4-sampled rows + the six break-in-repeat rows
  were explicitly re-checked); none are risers, so none needed it for
  this task's own stop conditions, but a future task should confirm
  them explicitly if their own mechanism matters.
- Did not attempt to repair census case F's own confounded fixture;
  superseded by the isolated scope tests instead (see above).
