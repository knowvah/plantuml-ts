# T1b — snake-merge port (D1/D2)

Branch `add2/T1b`, worktree `.claude/worktrees/add2-T1b`. Commits (in
order): `7cd434907`, `a8dc4be29`, `2bc4dd671`, `e46868ea5`, `21bb1c70f`,
`2a8061b59`. Not merged, not pushed.

## Delta (orchestrator review, journal row 22 — AXIS_EPSILON removed)
Orchestrator review flagged `AXIS_EPSILON = 1e-6` as stop 13 (no
upstream `file:line`, diverges from `Direction.fromVector`'s EXACT
equality, `utils/Direction.java:110-128`). Diagnosed and fixed at the
origin in `2a8061b59` — see "A real floating-point defect" below for
the updated mechanism; the epsilon is gone, `directionOf` is back to
exact `===` with an `@see`, and the throw (matching Java's
`IllegalArgumentException`) is kept. Full re-measure at the bottom of
this file.

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
  drift (REMOVED in `2a8061b59`, see below); updates 6 unit tests whose
  edge-count assertions the fusion legitimately changed (with mechanism
  cited), plus one disappeared
  `ALLOWED_HARD_OVERLAPS` entry in the compress invariant test.
- `2bc4dd671` test(activity): cover snake-merge's Snake/Worm/scope
  mechanics -- 3 new test files, 100% branch coverage on both new
  source files from these alone.
- `e46868ea5` chore(activity): regenerate catalog for snake-merge
  modules.
- `21bb1c70f` docs(agent-notes): first close-out report (superseded by
  this delta).
- `2a8061b59` fix(activity): resolve `pushTopDownSiblingEdge`'s local
  round-trip before `baseX` -- removes `AXIS_EPSILON`, fixes the real
  defect at its origin (see below).

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
- After the merge engine landed, pre-this-fix (commit `a8dc4be29`, all
  4 strategy sites wired, `AXIS_EPSILON` tolerance in place): Σ 25092,
  73 fallers, 6 risers.
- **After the stop-13 fix (`2a8061b59`, this delta, exact equality, no
  tolerance anywhere): Σ 25086** (-6 vs the epsilon version), 74
  fallers, **5 risers** -- `jupoxe-15-sugo110` drops out of the riser
  list entirely (1825 → 1822, now a faller) and `pixako-75-kumi821`
  moves from "crashes, unscored" to a genuine faller (184 pinned → 118,
  -66). No new rows moved; the 5 remaining risers are BYTE-IDENTICAL in
  score to the pre-fix measurement (unaffected by this fix, confirmed
  below).
- Element census (`activity-probe-elements.ts`, re-run after the fix):
  extra line+arrow **99 → 59** (unchanged from the pre-fix measurement
  -- this fix only touched `pixako`/`jupoxe`'s own coordinates, not
  element counts elsewhere), **exact 90 → 131**.

## Every riser, with mechanism (re-measured after the stop-13 fix)
**5** risers on `activity.diff-baseline.ratchet.test.ts` (was 6 before
the stop-13 fix; `jupoxe-15-sugo110` no longer rises -- see below), all
**explained** (D7), none re-pinned here (re-pinning is orchestrator-
only per established mission convention, confirmed in `.agent-notes/
T1p-d-repeat-weld.md`'s own citation of `repin-activity-baselines.ts`'s
doc comment):

| slug | baseline ws | new ws | Δ | mechanism |
|---|---|---|---|---|
| cujoni-21-somi079 | 124 | 131 | +7 | D7 reveal: element count now EXACTLY matches the jar (merge-case B closed); `compareSvg` switches LCS→positional, exposing a pre-existing, unrelated draw-order divergence (our `ellipse`/`path`/`text` emission order for the `note` construct vs the jar's) that the prior count mismatch hid. Confirmed: `childCount` diff is now absent entirely; every remaining weight-bearing diff is a KIND mismatch (`ellipse` vs `path`, etc.) at a matching index, not a coordinate error. Unaffected by the stop-13 fix (identical ws before/after). |
| kijazo-83-kipu485 | 125 | 222 | +97 | Same D7 reveal class. `childCount` diff absent; 14/40 diffs are kind-mismatches. Unaffected by the stop-13 fix. |
| nafaxo-62-boso912 | 146 | 167 | +21 | Same D7 reveal class. `childCount` diff absent; 7/58 diffs are kind-mismatches. Unaffected by the stop-13 fix. |
| nikivo-06-kaxa873 | 241 | 330 | +89 | Same D7 reveal class. `childCount` diff absent; 12/174 diffs are kind-mismatches. Unaffected by the stop-13 fix. |
| ruzica-16-deli877 | 463 | 697 | +234 | Same D7 reveal class (largest Δ; this fixture nests `while`/`if`/multi-swimlane, so more elements shift index). `childCount` diff absent; 36/217 diffs are kind-mismatches. Unaffected by the stop-13 fix. |

**No longer a riser**: `jupoxe-15-sugo110` (1825 → 1822 after the
stop-13 fix, a faller). Before the fix it rose to 1828 (+3) via a
DIFFERENT mechanism (`compare.ts`'s childCount-weight term scaling with
an already-massive, unrelated pre-existing gap -- `weightedscore-
antimonotone-under-growth.md`); the `pushTopDownSiblingEdge` fix
changed this fixture's own coordinates enough that it now falls
instead. Not independently re-diagnosed past confirming it no longer
rises -- the mechanism that explained the PRE-fix rise is moot now.

## Acceptance items — status
- T1p-b vertical-if residual (childCount+2/height+20): **CLOSED**.
  `childCountDelta`/`heightDelta` now `0`/`0` on all 5 authored
  fixtures; `activity-vertical-if-t1pb.test.ts` re-pinned with new
  `diffCount`/`weightedScore` and the mechanism (D7 reveal: `diffCount`
  fell, `weightedScore` rose from the SAME index-shift class as the
  5 risers above -- cited inline in the test's own doc comment).
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

## A real floating-point defect found and fixed AT ITS ORIGIN (not tolerated)
`pixako-75-kumi821` (break-in-while fixture) crashed the ENTIRE render
pipeline with `snake-merge: not a horizontal or vertical line
(63.021875,269)->(63.021874999999994,304)`. First pass (now superseded)
papered over it with a 1e-6 `AXIS_EPSILON` in `directionOf` -- correctly
flagged by orchestrator review as stop 13: no upstream `file:line`, and
it diverges from `Direction.fromVector`'s EXACT equality
(`utils/Direction.java:110-128`, throws `IllegalArgumentException` on a
non-exact diagonal).

**Mechanism**: `pushTopDownSiblingEdge` (`tile-coordinates.ts`, old
version) computed `from.x = prev.x + prevChild.getCoord(SOUTH_HOOK).x`
and `to.x = next.x + child.getCoord(NORTH_HOOK).x`, where `prev.x`/
`next.x` were ALREADY-absolute (`childX = x + t.childOffsetsX[i]`,
computed one step earlier in `walkTile`'s own loop). Each side therefore
evaluated `(x + (left - N)) + N` for its OWN tile's hook value `N`
(`left` = the composite's own `left`, `childOffsetsX[i] = left - N`) --
mathematically `x + left` on both sides, but the absolute origin `x`
was folded into the sum ONE STEP BEFORE the local `(left-N)+N`
round-trip resolves, regrouping the same three terms and letting each
side round independently to a value one ULP apart from the other.

**Origin**: `tile-coordinates.ts` (old `pushTopDownSiblingEdge`, the
`childX = x + t.childOffsetsX[i]!` line inside `walkTile`'s own
`'gtile-top-down'` loop, plus the `from`/`to` construction immediately
below it).

**Causal chain**: two DIFFERENT tiles' own hook values (`N` for
`prevChild`, a DIFFERENT `N2` for `child`) each go through their own
copy of the `(x + (left-N)) + N` round-trip; IEEE-754 does not
guarantee `fl(fl(a-b)+b) == a` for arbitrary `a`,`b`, and whether it
holds depends on the specific bit pattern of `N`/`N2` -- so the two
sides can land on different final `x` values even though both
represent the same composite `left`.

**How Java avoids it**: `FtileFactoryDelegatorAssembly#assembly`
(`:71-74`) computes `p1 = geo.translate(translate1).getPointOut()`,
`p2 = tile2.calculateDimension(...).translate(translate2).getPointIn()`,
where `translate1`/`translate2` come from `FtileAssemblySimple
#getTranslated1/2` (`:132-140`): `UTranslate.dx(left - tile.left)` --
computed ENTIRELY in the composite's own LOCAL space. `FtileGeometry
#translate`/`#getPointOut` (`FtileGeometry.java:149-156,77-82`) then
resolves `tile.left + dx`, STILL local. The composite's own absolute
placement is applied as a SEPARATE, OUTER `UTranslate` at draw time --
never folded into this same sum. Java's grouping is `N + (left - N)`,
local, THEN absolute; ours was `(absolute + (left-N)) + N`, absolute
folded in mid-calculation.

**Fix**: `TopDownSiblingLink` now carries `baseX` (the walk-time
absolute origin) and each side's own LOCAL `prevOffsetX`/`nextOffsetX`
separately; `pushTopDownSiblingEdge` computes `baseX + (offsetX +
hook.x)` -- local round-trip first, absolute origin added exactly once,
last -- matching Java's own grouping.

**Ruled out** (with evidence, not assumption): a genuine geometric
divergence in `childOffsetsX`/hook values themselves -- ruled out
because `prevChild.getCoord(SOUTH_HOOK).x` and `prevChild.getCoord
(NORTH_HOOK).x` were confirmed BIT-IDENTICAL via direct instrumentation
on every fixture sampled (the SAME tile's own two hooks always agreed);
the drift was isolated entirely to the SUMMATION ORDER across the two
DIFFERENT tiles' own round-trips, confirmed by reproducing the crash
with exact (non-tolerant) equality, then resolving it with ONLY a
regrouping of the same three terms (no numeric value changed).

**Verified**: all 268 baseline fixtures lay out without throwing
(`compress/invariant.test.ts`, exact equality, no tolerance anywhere);
golden ratchet 73/73; `pixako-75-kumi821` now renders at ws=118 (was
184 pinned, a genuine -66 improvement, not merely "no longer crashes").
Caught originally by `compress/invariant.test.ts`'s "no baseline
fixture throws" test (all 268 fixtures) -- the kind of defect only a
full-corpus pass surfaces.

## Quality bar (re-verified after the stop-13 fix)
- `tests/diagrams/activity`, `tests/unit/activity`,
  `activity.golden.ratchet` (73/73), `activity.harness-parity`,
  `compress/invariant.test.ts`: **1529/1529 passing** (foreground,
  `npx vitest run`, not the full `npm test`), re-run clean after
  `2a8061b59`.
- `npm run typecheck`: clean (both tsconfigs).
- `npx eslint src tests` (scoped to touched files): clean.
- Full `npm test`/`npm run build` were NOT re-run after this delta --
  per the orchestrator's own instruction for this follow-up ("no full
  npm test"); the prior report's `npm run build` success and `npm run
  catalog` (no new exports in this delta, so no drift) both still
  apply unchanged, since this fix touched no public API shape.

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
