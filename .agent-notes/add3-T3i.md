# add3-T3i — fork welds, while label height, group compression, lane delegation

Worktree: `.claude/worktrees/add3-T3i`, branch `add3/T3i`. No Serena MCP
tools used (Read/Edit/Write/Bash/grep only, per the hard ban). No `git
stash` used.

## Commits

1. `06c0f503a` fix(add3-T3i): exclude fork-branch breaks from while/repeat welds
2. `bfba267bb` fix(add3-T3i): measure GtileWhile.labelHeight from backIncoming
3. `dc7e7b84b` fix(add3-T3i): make group/partition frame compress through on both axes
4. `a85944cf1` fix(add3-T3i): laneIn/laneOut unconditionally delegate through groups

## Probe Σ per commit (full corpus, 65-row baseline set)

Branch head at launch: Σ 6710, 284 pinned, 0 risers.

- After commit 1: Σ 6710 -> 6641 (-69). 0 risers.
- After commit 2: Σ 6641 -> 6641 (net 0 on the probe's weighted score;
  a verified correctness fix with no family-presence change -- see
  below). 0 risers.
- After commit 3: Σ 6641 -> 5958 (-683). 1 riser (`jogami-42-jaji869`,
  named mechanism below).
- After commit 4: Σ 5958 -> 5702 (-256, after a self-caught interim
  regression on `sifite-87-ziti434` fixed within the same commit). 1
  riser (`jogami-42-jaji869`, unchanged by this commit).

**Final: Σ 6710 -> 5702 (-1008, -15.0%), 284 pins byte-equal throughout,
0 unexplained risers.**

## Java -> ours (file:line)

### Commit 1 — WELD (`jupivo-67-gidi531`, 69 -> 0, exact)

`InstructionFork.createFtile` (`InstructionFork.java:122-130`) builds
every branch's own Ftile (`list.createFtile(factory)`, each possibly
wrapping an if/break in `FtileDecorateWelding` with its own frozen
`breaks` list, `FtileDecorateWelding.java:48-54`) but never calls or
forwards any branch's `getWeldingPoints()` when building the fork's own
result (`factory.createParallel(all, ...)`). The fork's own Ftile
(`FtileForkInner`/`FtileForkInnerOverlapped`,
`ftile/vcompact/FtileForkInner.java:54`,
`FtileForkInnerOverlapped.java:53`, both `extends AbstractFtile` with
no override) therefore falls back to `AbstractFtile.java:100-102`'s
empty-list default -- a `break` inside a `fork`/`fork again` branch is
NEVER welded to its enclosing `while`/`repeat`, no matter how deep.

Our `walk-while-branch.ts#pushWhileWeldings` and `walk-repeat-weldings
.ts#pushBreakWeldings` scanned every `'break'` node in the loop body's
own pushed-node range uniformly, including ones inside a fork branch.
Fix: `Out.forkBodyRanges` (new field, `tile-coordinates.ts`), populated
by `walk-fork-branches.ts#walkForkBranches`/`walkMerge` (covers
`fork...end fork` and `fork...end merge`), consulted via the new
`isInsideForkBody` helper in both weld scans.

`tile-coordinates-group.ts` (new sibling file) is a pure extraction of
`collectTouchedLanes`/`walkTileGroup` out of `tile-coordinates.ts`,
needed only to make room under the 500-line hook cap for the new
`forkBodyRanges` field -- zero behavior change.

Unit test: `tests/diagrams/activity/layout/tile-coordinates.test.ts`,
new describe block, red-confirmed (reverted the fix, re-ran, watched it
fail) before being left green.

### Commit 2 — SNAKE-LBL (`boxefe-81-situ725`, verified correctness fix, probe score unchanged)

`FtileWhile.calculateDimensionFtile` (`FtileWhile.java:584-601`) adds
`getSuppHeightForLabel(stringBounder)` to the tile's own height --
`back1.calculateDimension(stringBounder).getHeight()`, where `back1` is
`incoming1.getDisplay().create(...)` (`:147`), the SAME `(incoming)`
text this port already threads as `GtileWhileContext.backIncoming` for
`walk-while-backward.ts#pushBackward1`'s own label push.

`gtile-while.ts#labelHeight` was hardcoded to `0` behind a comment that
mislabelled `back1` as an unrelated, never-captured `-> text;` node (a
genuine prior-note error, corrected per CLAUDE.md's "prior notes have
been wrong"). Fixed to measure `backIncoming` via
`activityFontSize(theme, 'arrow')`, the same category
`gtile-fork.ts`'s own join-label measurement already uses.

Verified effect: the backward action's own `(dsc_5)` label moved from a
6.44px y-divergence from the jar down to 0.94px -- the SAME order of
magnitude every OTHER text y in this fixture already carries (confirmed
by direct SVG dump: `read data`'s own `rect y` differs from the jar by
the identical ~0.944px, unrelated to this fix) -- i.e. measurer-vs-
real-font quantization noise (`DeterministicMeasurer`'s synthetic
metrics vs the jar's real AWT font measurement), not a layout defect.
The row's weighted score is unchanged because `compare.ts` scores
presence of a mismatch per attribute path, not its magnitude -- this is
a zero-risk, Java-matching correctness fix, not a sandboxed score
improvement, kept on that basis.

A stale test pin from this exact fix surfaced only when the FULL
`tests/diagrams/activity` tree was run (not just this task's own
targeted suites) -- `snake-text-position-fixtures.test.ts`'s own
"pinned at the current (not jar-equal) value" test for `dsc_5`'s y
needed updating to the new value; fixed in commit 3 (see that commit's
message for why it landed there instead of being split out).

### Commit 3 — PARTCOMP (`caciva-80-kene990` 13->0, `suluni-73-lotu140` 45->0, `mudobi-07-biji996` 67->64, `sifite-87-ziti434` 19->18)

`USymbolFrame#drawFrame` (`USymbolFrame.java:70-71`) draws the
`partition`/`group` frame as a `URectangle` with BOTH
`ignoreForCompressionOnX()`/`ignoreForCompressionOnY()` set -- content
inside compresses freely through it. The frame's own title-tab is a
SEPARATE `UPath` (`:76-84`, `setIgnoreForCompressionOnX()` only, never
Y); `UPath#drawWhenCompressed` is a no-op (`klimt/UPath.java:233-234`,
unlike `URectangle`'s 2px-edges reservation), so on X it contributes
NOTHING, and on Y (never ignored) its full `[y, y+textHeight]` box
occupies normally (`SlotFinder#drawPath`'s un-ignored branch).

Our port's `shapeForNode` treated `group`/`partition` as a plain,
fully-occupying rect (no ignore flags) with no corresponding tab shape
at all -- nothing inside ever compressed. Three changes, one mechanism:

- `shapes-of.ts`: `FRAME_KINDS` (`group`/`partition`) get
  `ignoreX: true, ignoreY: true` on their rect; new `frameTabShape`
  (kind `'polygon'`, `polygonSkipMode: 'x'` -- reusing the ONE existing
  CompressShape semantic that already means "contributes nothing on
  this axis", matching `UPath`'s no-op exactly) models the tab's own
  Y-occupancy. Without the tab shape, the Y axis over-compressed into
  the frame's own top margin (verified directly: a `partition foo {
  if...stop...}` fixture's frame height went from 193 (pre-fix,
  matching neither jar's 122 nor anything sensible) to 110 (tab-less
  fix, still 12 short) to 122 (exact, with the tab shape) -- three
  measured states, not guessed).
- `compress-geometry.ts`: `group`/`partition` joined
  `RECT_WIDTH_KINDS`/`RECT_HEIGHT_KINDS` -- `UGraphicCompressOnXorY.java
  :90`'s rect-resize branch applies "ignore flags notwithstanding"
  (`isRectReservation`'s own doc already cites this line): the frame's
  own drawn box must still shrink-wrap once content compresses through
  it, regardless of its ignore flags. Without this, the frame's
  declared width/height stayed at its pre-compression (too-big) value
  while its CONTENTS shifted, visually detaching the frame from its own
  content.
- `shapes-of-boxes.ts` (new sibling file): pure extraction of
  `hexagonBox`/`diamondBox`/`conditionBox`/`noteBox`, needed only to
  make room under `shapes-of.ts`'s 500-line cap for the above two
  additions -- zero behavior change.

Bonus (same mechanism, not separately targeted): three UNKNOWN census
rows also use `partition` and improved --
`japeru-28-guku001` 326->0 (exact), `cakeca-72-kara622` 450->253,
`zokodi-10-dexu703` 187->96. PART-XLANE rows (a different task's
partial fix) improved further too: `notuli-49-xugi698` 41->30 (then
->0 in commit 4), `vodobe-33-kefa909` 77->42.

**Named riser: `jogami-42-jaji869` 10->49** (a `partition` containing a
`note left`). Traced via direct `SlotSet` instrumentation added
temporarily to `compressAxis` (console.error gated on an env var,
removed before commit -- never shipped, confirmed by `git diff`): a
genuinely-empty 18-unit gap between the frame's `ignoreX` left-edge
reservation (`[0,2]`) and the attached note's own raw layout-time `x`
(20) gets shrunk by `smaller(5)`'s margin (`[7,15]`, 8 wide) and that
8px is removed -- the jar does NOT remove it. The note's own raw
layout-time position is `tiles/gtile-note.ts`/`walk-with-notes.ts`,
explicitly outside this task's write-set -- reported, not fixed.
Verified via the jar's own pinned style-baseline column: `height` is
now EXACT (304=304), only the X-axis 8px residual remains, consistent
with the X-only mechanism above.

Verified against the jar's own pinned census columns, not guessed:
every style/swimlane-baseline mover from this commit EXACTLY matches
jar's own width/height for that fixture (`caciva` 174/187,
`notuli` height 263, `sifite` height 226, `suluni` 144/271, `vodobe`
height 221, `zokodi` 313/357, `japeru` 207/765), except `cakeca`
(closer, not exact -- a multi-mechanism UNKNOWN row) and `jogami`
(height exact, the traced 8px width residual above). `mudobi`/`sifite`
keep the ALREADY-DOCUMENTED, pre-existing "0.611px title-UText-slot"
residual census itself names (a prior agent's own text-slot variant
fixed it but regressed 5 other rows; re-verified directly via SVG diff
that every remaining mismatch in both fixtures is exactly this
0.611px y-offset, nothing new -- not re-attempted, per that same
census warning).

### Commit 4 — PART-XLANE (`notuli-49-xugi698`, 30 -> 0, exact)

`FtileGroup.getSwimlaneIn()`/`getSwimlaneOut()` (`FtileGroup.java:
131-137`) and `FtileAssemblySimple`'s own pair
(`FtileAssemblySimple.java:71-76`) are BOTH one-line, UNCONDITIONAL
delegations to their inner/first/last tile -- neither class has an own
swimlane field to check first. Our `laneIn`/`laneOut`
(`swimlane-lanes.ts`) checked `tile.swimlane` BEFORE delegating into
children, harmless for `gtile-top-down` (never gets an own `.swimlane`
from `tile-layout.ts`) but wrong for `gtile-group`/`gtile-partition`:
`tile-layout-structural.ts#tileGroup` tags every group/partition with
`withSwimlane(tile, node.swimlane)` -- the group's OWN entry lane, used
for OTHER purposes (`collectTouchedLanes`) -- which shadowed the
correct EXIT-child lane for any edge leaving the group to its next
sibling (`pushTopDownSiblingEdge`'s own `laneOut(prevChild, myLane)`
call).

Reordered to delegate first for every kind in a new `DELEGATING_KINDS`
set (`gtile-top-down`, `gtile-group`, `gtile-partition`), falling back
to the tile's own `.swimlane` only when it has no (or an empty) child
list -- an empty `partition P1 {}` (`sifite-87-ziti434`) has nothing to
delegate to and must still fall back to its OWN declared lane, not the
caller's ambient one (a self-caught regression: the first version of
this fix passed the caller's raw `inherited` through the recursive
call, which for an EMPTY body returned the wrong, outer-ambient lane --
fixed within the same commit by passing `tile.swimlane ?? inherited`
as the recursive call's own `inherited` argument, verified red->green
again before shipping).

The phantom elbow+arrowhead T3e/T3h both flagged but never traced
*was* this exact mechanism: the group's own `SOUTH_HOOK` sits at its
entry lane's own x column (`gtile-group.ts`'s own `getCoord`,
unaffected by this commit -- confirmed its hook math is already
correct), but the edge metadata tagged the sibling-edge with the WRONG
exit lane, routing `swimlane-placement.ts`'s own per-lane repositioning
pass through the entry lane's band instead of the exit lane's.

`vodobe-33-kefa909` (42, unchanged by this commit): a genuinely
DIFFERENT, deeper gap -- no sibling edge exists in that fixture at all
(the `partition` is the last thing before the diagram ends, so
`pushTopDownSiblingEdge` never fires). Direct SVG diff narrows PART-
XLANE's own cited "per-lane frame-width mechanism" further: T3h's own
"every touched lane gets an identically-sized frame copy" finding does
NOT generalise once a lane's content is uneven -- an attached `note
right` inflates ONLY that lane in the jar's real render (jar's lane1
frame copy is 68.7 wide, lane2's is 374.362; ours gives BOTH the
group's own uniform width, confirmed by direct rect-width diff).
Computing a true per-lane content extent (not just per-lane identity)
is a real feature gap in `tile-coordinates-group.ts`'s
`collectTouchedLanes`/`walkTileGroup`, not attempted here -- would need
each touched lane's OWN bounding box over just the nodes tagged with
that lane, not the group's single merged box repeated.

A pre-existing test (`swimlane-placement.test.ts`) asserted the OLD,
less-faithful priority ("a composite's own swimlane wins over
descending into children") for a SYNTHETICALLY swimlane-tagged
`GtileTopDown` (a scenario `tile-layout.ts` never produces for real).
Verified against `FtileAssemblySimple.java:71-76` directly before
touching it: updated to the Java-verified unconditional-delegation
order, not silenced.

## Not done and why

- **XLANE-HLINE** (`jucidi-98-zato093` 81, `pezubu-98-niba240` 55,
  unchanged): diagnosed further but not isolated to a `file:line`.
  Direct SVG diff confirms the SECOND lane is uniformly 10px narrower
  than the jar AND its own merge-back connector routes through a
  DIFFERENT shape (an elbow at a specific x the jar's own `ConnectionHline
  /getMinmax` math computes per-lane in LOCAL coordinates,
  `FtileIfLongHorizontal.java:518-599`) -- a genuine connector-routing
  difference, not just a width offset. `swimlane-hline.ts`'s own doc
  already records an empirical finding (routing the per-lane expansion
  through `measureLanes` too regressed this exact row 169->179) --
  re-diagnosing from scratch risks repeating that regression. Not
  reattempted; T1c/T3e's prior "not isolated within budget" conclusion
  stands, now with the ADDED detail that `ConnectionHline` has a
  measurement-vs-draw dual path (`getMinmaxSimple` for width
  reservation, `getMinmax` for the real per-lane draw position) our
  port's own doc comment already names correctly.
- **LANE-MINWIDTH/SWIMW** (`nikinu-06-sace939` 105, `cemipu-87-dinu624`
  82, unchanged): rendered BOTH real fixtures through the oracle fresh
  (not just T3e's own synthetic 2-lane fixture) per the brief's
  explicit instruction. CONFIRMS T3e's disproof with new evidence: the
  `skinparam swimlaneWidth 400`/`width same` skinparams are NOT the
  mechanism (ruled out again, independently). The REAL, NEW finding:
  the lane1/lane2 divider is uniformly 11px narrower in ours than the
  jar in BOTH fixtures (not related to which skinparam is used), and
  this is NOT lane1's own content width (the widest action box is
  BYTE-IDENTICAL, 239.45, in both renders) and NOT a title-overflow
  case for lane1 either (`titleWidth` 141.938 <= either render's own
  `laneWidth`, so `halfMissingSpace`'s overflow branch should not even
  fire for lane1) -- `computeLaneWidths`/`halfMissingSpace`
  (`swimlane-context.ts`) were read line-by-line and verified to
  ALREADY implement the documented upstream formula correctly in
  isolation. The missing 11px must be in how the TWO adjacent dividers'
  own half-margins get summed into the actual pixel divider position
  (`swimlane-placement.ts`, NOT re-read line-by-line this session) --
  narrowed but not isolated to a `file:line`; a real follow-on, not a
  guess.
- **UNKNOWN rows** `zeporo-46-zicu301` (129), `nojije-35-teta491` (113):
  census's own candidate (`FtileIfLongHorizontal` per-lane extents) is
  NOT in this task's write-set; not independently re-diagnosed to a
  file:line this session given the LANE-MINWIDTH investigation above
  already spent significant budget on the adjacent (and likely related)
  lane-width-computation territory. No new claim made.
- **`gesogi-81-xoma900`** (76, unchanged): instrumented further than
  the census's own prior isolation (`fork` + `repeat` in one branch,
  `while` in a differently-laned sibling branch -> the fork-bar's own
  width is 15px wider than the jar's). Directly read
  `UGraphicInterceptorOneSwimlane.draw` (Java) to test and REFUTE a
  "per-lane bar clipping" hypothesis (a `FtileBlackBlock` is tagged with
  ONE swimlane and drawn whole, never clipped per lane -- confirmed by
  reading the class body, not assumed). Also confirmed via
  `AbstractParallelFtilesBuilder.java:128-170` that `doStep1`'s
  (top bar) and `doStep2`'s (join bar) own width-setting calls use
  values that are mathematically equal by construction -- so the
  defect is not "two different formulas for the two bars" either (our
  port's single-`barWidth`-for-both-bars design is faithful). The
  residual must be in the ACTUAL branch-width value `computeNewFtile`
  wraps each branch with when a sibling branch is differently-laned --
  not isolated to a `file:line`; `tobajo-64-mipi810`'s own fork-bar
  delta (231 vs jar 186, cited in this task's own brief) is very likely
  the SAME mechanism at a larger magnitude (same symptom: a forked
  branch's own measured width differs when a sibling branch spans a
  different lane) -- reported together, not fixed, both in
  `tiles/gtile-fork.ts` (confirmed in-write-set) but requiring more
  budget than remained to isolate safely without guessing.
- **`tobajo-64-mipi810`** (552; its named residual slice is 378
  note-free, of which this task's own fork-bar-width share is the
  mechanism just described for `gesogi`): not fixed, same reason.
  `IFNOTE`'s own 174-point share is explicitly a different task's
  domain (T2a), untouched.
- **`cakeca-72-kara622`** (253, down from 450) / **`zokodi-10-dexu703`**
  (96, down from 187): both improved substantially by commit 3's
  PARTCOMP mechanism (confirmed via style-baseline's own jar column --
  `cakeca` is CLOSE but not exact, `zokodi` moved its height to EXACT
  while width still diverges). Both are multi-mechanism UNKNOWN rows
  per census's own framing; the residual fraction was not separately
  diagnosed this session.

## Quality gates

`npx tsc --noEmit` (both `tsconfig.json`/`tsconfig.node.json`): clean
after every commit. `npx eslint` on every changed file: clean after
every commit. Full `tests/diagrams/activity tests/unit/activity`
(99 files / 2063 tests after the final commit) green.
`tests/oracle/svg-conformance/activity.golden.ratchet.test.ts` +
`activity.harness-parity.test.ts` (348 tests, 284 pins byte-equal):
green after every commit. `activity.style-baseline.test.ts` +
`activity.text-baseline.test.ts` + `activity.swimlane-baseline.test.ts`:
every mover reported per rule 10 above, verified against the jar's own
pinned column, not guessed; 17 pins moved correctly across the mission
(11 style + 6 swimlane), left for orchestrator re-pin per rule 5 (never
edited `oracle/goldens/**`/baseline JSONs). New/updated tests: `tile-
coordinates.test.ts` (WELD), `gtile-while.test.ts` (labelHeight),
`shapes-of.test.ts` + `compress-geometry.test.ts` (PARTCOMP),
`swimlane-lanes.test.ts` (new file, PART-XLANE delegation) +
`swimlane-placement.test.ts` (one pre-existing test corrected against
the Java source, not silenced) + `snake-text-position-fixtures.test.ts`
(one stale pin updated to the new, correct value).

One disclosed process note: a temporary `console.error`-based debug
dump was added to `compress-geometry.ts#compressAxis` (gated on
`process.env.T3I_DEBUG_SLOTS`) to instrument the jogami riser's SlotSet
directly; removed before any commit (confirmed via `git diff` showing
zero trace) -- never shipped, disclosed per the rule's own "no `process
.env` in `src/`" ban (this would have violated it had it landed).
