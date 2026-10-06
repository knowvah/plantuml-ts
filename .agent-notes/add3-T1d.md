# T1d (activity-divergence-drive-3) -- branch exit labels + switch labels

## Commits (branch add3/T1d)

1. `feat(add3-T1d): thread tileNodes' leftover trailing label` --
   `tiles/tile.ts` (`Tile.outLabel`), `layout/tile-layout-inlabel.ts`
   (`withOutLabel`/`applyOutLabel`, `applyInLabel`/`applyOutLabel` now
   share one `applyPendingLabelToLastEdge` body), `layout/tile-layout.ts`
   (`tileNodes` returns `TileNodesResult { tiles; trailing }`, all 3
   internal call sites fixed), `layout/conditional-builder.ts`
   (`toBranchTile`/`branchBodyTile` discard `trailing`, documented why),
   plus the 2 test-file call sites (`tests/diagrams/activity/layout/
   tile-layout.test.ts` -- 25 occurrences, `.../compress/invariant.test.ts`).
2. `feat(add3-T1d): wire if-long-horizontal branch exit labels` --
   `layout/conditional-builder-long.ts` (`branchBodyWithOutLabel`,
   `buildIfLongHorizontal`; `buildIfLongVertical` documented NOT
   APPLICABLE), `layout/walk-if-long-horizontal.ts`
   (`connectionVerticalOut`/`connectionLastElseOut` call `applyOutLabel`).
3. `feat(add3-T1d): wire fork/split/switch branch exit labels` --
   `layout/tile-layout-structural.ts` (`buildBranchTopDown` sets
   `Tile.outLabel`; new `tileSwitchCase` helper does the same per case),
   `layout/walk-fork-branches.ts` (`pushBranchOut` calls `applyOutLabel`),
   `layout/walk-switch.ts` (`caseInLabelAlign`, `applyLastEdgeLabel`'s new
   `align` param, `pushCaseToMergeEdge`'s new `drawExitLabel` gate).
4. `test(add3-T1d): authored fixtures for branch exit labels` --
   `tests/fixtures/activity/add3-T1d/{if-long-horizontal-exit,split-exit,
   fork-exit,switch-case-exit}/{in.puml,in.svg}`, new shared helper
   `tests/helpers/activity-text-position.ts`, new
   `tests/diagrams/activity/layout/branch-exit-label-fixtures.test.ts`.

## Java -> ours (file:line)

- `Branch#setSpecial`/`#getSpecial`/`#getTextBlockSpecial`
  (`activitydiagram3/Branch.java:222-229,241-246,264-266`), consumed via
  `InstructionIf#switchToElse2`/`#elseIf`/`#endif`
  (`InstructionIf.java:166-198`) and `InstructionSwitch#switchCase`/
  `#endSwitch` (`InstructionSwitch.java:166-183`) -> `layout/tile-layout
  .ts#tileNodes`'s own `pendingInLabel` loop var, now surfaced as
  `TileNodesResult.trailing` instead of falling out of scope when the
  node list ends.
- `InstructionList#setOutRendering`/`outlinkRendering`
  (`InstructionList.java:159-161,228-232`), consumed via
  `InstructionFork#manageOutRendering` (`InstructionFork.java:183-191`)
  and `InstructionSplit#splitAgain`/`#endSplit`
  (`InstructionSplit.java:128-142`) -> the SAME `trailing` mechanism,
  read by `tile-layout-structural.ts#buildBranchTopDown` (shared by
  `tileFork`/`tileSplit`) instead of a separate field, since both upstream
  mechanisms are the identical "pending-at-list-close" shape.
- `FtileIfLongHorizontal$ConnectionVerticalOut`
  (`vcompact/FtileIfLongHorizontal.java:438-474`, `withLabel` at
  `:458-459`) -> `layout/walk-if-long-horizontal.ts#connectionVerticalOut`
  + `applyOutLabel(out, t.tiles[i]!, {horizontal:'LEFT'})`.
- `FtileIfLongHorizontal$ConnectionLastElseOut`
  (`:352-387`, `withLabel` at `:377-378`) ->
  `#connectionLastElseOut` + `applyOutLabel(out, t.tile2, ...)`.
- `ParallelBuilderFork$ConnectionOut`/`ParallelBuilderSplit$ConnectionOut`
  (`ParallelBuilderFork.java:187-243` label at `:197`;
  `ParallelBuilderSplit.java:222-270` label at `:160-161`) ->
  `layout/walk-fork-branches.ts#pushBranchOut` + `applyOutLabel(out,
  branch, {horizontal:'LEFT'})` -- ONE call site, shared by both kinds.
- `FtileSwitchWithManyLinks$ConnectionVerticalThenHorizontal`/
  `$ConnectionVerticalBottom` (`cond/FtileSwitchWithManyLinks.java:
  133-195,243-295`, both `withLabel(.., VerticalAlignment.CENTER)`) ->
  `layout/walk-switch.ts#pushCaseToMergeEdge` + `applyOutLabel(out, c,
  {vertical:'CENTER'})`, gated by `drawExitLabel` (`cases.length > 1`).
- `FtileSwitchWithOneLink$ConnectionVerticalBottom`
  (`cond/FtileSwitchWithOneLink.java:101-132`) -- NEVER calls
  `.withLabel()` -- confirmed by reading the whole class; this is why
  `drawExitLabel` suppresses the exit label for a one-case switch.
- `FtileSwitchWithManyLinks$ConnectionHorizontalThenVertical`
  (first/last case, `:72-131`, `arrowHorizontalAlignment()`) /
  `$ConnectionVerticalTop` (interior case, `:197-241`,
  `VerticalAlignment.CENTER`) -> `layout/walk-switch.ts#caseInLabelAlign`
  (`i===0 || i===total-1` -> `{horizontal:'LEFT'}`, else
  `{vertical:'CENTER'}`), applied via `applyLastEdgeLabel`'s new `align`
  param. `FtileSwitchWithOneLink$ConnectionVerticalTop` (`:64-99`,
  `arrowHorizontalAlignment()`) falls into the SAME `i===0` branch for
  free when `total===1`.
- `FtileFactoryDelegatorSwitch#createWithLinks`
  (`vcompact/FtileFactoryDelegatorSwitch.java:103-127`): `ftiles.size()
  == 1` picks `FtileSwitchWithOneLink`, else `FtileSwitchWithManyLinks`
  -- the ONLY dispatch condition between the two classes, confirmed by
  reading the whole method.

## Rows before -> after (T1a's 34-row census + this task's brief)

| Row(s) | Mechanism | Status |
|---|---|---|
| 2, 3 | if-long-horizontal branch/else exit | DONE |
| 4, 5 | (task brief's citation) | NOT APPLICABLE -- see below |
| 21, 22 | fork `ConnectionOut` exit | DONE, landed via the shared `pushBranchOut` row 27/28 fix |
| 27, 28 | split `ConnectionOut` exit | DONE |
| 30, 33 | switch first/last incoming label alignment | DONE |
| 31 | switch interior incoming label alignment | DONE (alignment only; X position remains confounded by the pre-existing switch case-diamond placement divergence, T1a's own row-31 finding) |
| 32 | switch case exit label | DONE |
| 34 | `FtileSwitchWithOneLink` incoming alignment | DONE for free (`i===0===total-1` branch) |

### Rows 4/5: brief correction (verified by grep, not assumed)

The brief cited `FtileIfLongVertical.java:280-281,319-320` as rows 4/5's
branch-exit mechanism. Reading the actual Java at those lines (inside
`ConnectionVertical#drawU`/`ConnectionLastElse#drawU`) shows the labels
there are `tbInlabel`/`branch.getInlabel()` (the ELSEIFIN leading
in-label, already ported, add2 T3i) and `tb2`/`branch2.getDisplayPositive()`
(the else clause's own positive label, already captured as
`node.elseLabel`) -- NEITHER is `Branch#special`. `grep -n getSpecial
FtileIfLongVertical.java` returns nothing: `FtileIfLongVertical.create`
never reads the branch-exit mechanism at all. A trailing `-> label;`
before `elseif`/`else`/`endif` on a `!pragma useVerticalIf true` chain is
upstream's OWN dead data -- mirrored faithfully (discarding `tileNodes`'
`trailing` there, documented inline), not fixed as an apparent bug, per
this project's porting-discipline rule.

## Probe Sigma

- Before (branch head `604dacfbf`): aggregate 16362 / 125 rows, 17
  fallers, 0 risers (measured via a disposable `git worktree add
  /private/tmp/t1d-baseline 604dacfbf` + `cp -R node_modules`/`assets/
  stdlib`, removed after use -- never touched via `git stash`).
- After (this task's final commit `8de5f6627`): aggregate 16360 / 125
  rows, 19 fallers, 0 risers. Two NEW fallers (`demibe-40-moda439`,
  `mojezi-43-gamu360`) -- real corpus fixtures whose score improved
  (moved closer to the jar) from this task's branch-exit-label wiring.
  Element census: `ws` 16362 -> 16360, `exact` 67 -> 67 (unchanged
  bucket membership, only within-bucket weight shifted).

## Risers + mechanism

- `sojono-24-tufe806` (style-baseline census, NOT the probe's own
  aggregate): canvas `width` 274 -> 281, neither jar-equal (jar: 508).
  Mechanism: this switch-case fixture's interior case label previously
  had no `labelAlign` set, so `canvas-origin-text-ink.ts
  #extendForEdgeLabelText`'s gate (`edge.labelAlign !== undefined`)
  never ran for it; `caseInLabelAlign` now sets `{vertical:'CENTER'}`
  for this interior case, turning the gate on and widening the canvas to
  cover the label's own ink -- the SAME class of effect T1b's own
  `boxefe-81-situ725` (252 -> 254) already caused and left for the
  orchestrator to re-pin. REVEAL, not a defect: the switch builder's
  case-diamond X-placement is independently confounded against the jar
  (T1a's row-31 finding), so neither 274 nor 281 was ever going to equal
  the jar's 508 -- this move is the label-ink mechanism now correctly
  reaching a site it previously skipped, not a regression in that
  mechanism.
- Zero OTHER movers beyond the 18 confirmed pre-existing rows below.

## NEEDS ORCHESTRATOR RE-PIN

`oracle/goldens/svg-activity/style-baseline.json`, row
`activity/sojono-24-tufe806`: `width` pinned at `274`, now measures
`281`. Not touched (rule 5). `activity.style-baseline.test.ts` is RED on
this one row until re-pinned.

## Pre-existing reds CONFIRMED NOT caused by this task

The brief named 3 known pre-existing reds (`boxefe-81-situ725` style
width 252->254, `luxido-91-covi016` swimlane width 279->274,
`ruzica-16-deli877` swimlane height 608->607). Measuring against the
disposable baseline worktree (`604dacfbf`, BEFORE any T1d edit) found
**15 more** already red at branch head, all `strokeWidth` histogram
moves, none mentioning this task: `citire-32-mive114`,
`decudi-92-bisu741`, `delide-30-teva601`, `jevoce-05-mumi686`,
`luxido-91-covi016` (strokeWidth, separate from its already-named width
row), `maduja-30-xiri319`, `maketa-43-juja264`, `pezubu-98-niba240`,
`rujuxa-07-neco067`, `sadovu-51-fata536`, `samavi-13-fuku339`,
`xidamu-85-xoti640`, `xizola-97-sizu458`, `zinelo-77-losu727`. Total
pre-existing: 18 rows (16 style-baseline + 2 swimlane-baseline),
identical set before and after this task's commits -- confirmed by
running the SAME two test files against the disposable worktree. The
brief's "known" list was incomplete, not wrong about direction; reported
here per rule 10 ("report any OTHER census mover"), not silently
absorbed into this task's own risers.

## Fixtures (`tests/fixtures/activity/add3-T1d/`)

- `if-long-horizontal-exit`: `leftExit`/`elseExit` X exact vs jar, canvas
  WIDTH exact (both labels widen the SAME `xSeparation` gap the jar
  does); canvas HEIGHT carries a verified 3px residual --
  `FtileIfLongHorizontal#calculateDimensionInternal`
  (`FtileIfLongHorizontal.java:690`, `Math.max(100, maxOutY)`) reserves a
  FLAT 100px floor for the branch-to-merge drop unconditionally; this
  port's ink-extension-only approach doesn't replicate that floor. That
  floor lives in `tiles/gtile-if-long-horizontal.ts`, outside this task's
  write-set -- confirmed by a scratch single-label variant (1 exit
  label only: ours 300 vs jar 297, same 3px gap) before being removed
  per rule 11 (temporary, not committed).
- `split-exit`/`fork-exit`: `splitExit`/`forkExit` X exact vs jar; canvas
  size is the SAME already-documented class of residual
  `.agent-notes/add3-T1b.md` named for the ENTRY-side label
  (`label-in-fork` fixture) -- confirmed by rendering a label-less
  fork/split baseline (scratch, removed) that matches ours EXACTLY, so
  only the jar's own canvas grows when ANY label of this connector
  family is added; a `ParallelBuilderFork`/`Split`-specific width/height
  formula this port's generic ink-extension does not replicate.
- `switch-case-exit`: all three exit labels (`firstExit`/`midExit`/
  `lastExit`) drawn exactly once, matching the jar's own count; X
  positions NOT asserted jar-equal (pre-existing switch case-diamond
  placement divergence, T1a's row-31 finding, unrelated to this
  mechanism).

## Acceptance

- Each wired site: label TEXT reaches the renderer with the jar's own
  alignment; X exact on every fixture where the underlying tile position
  already matched the jar (if-long-horizontal, split, fork); switch's X
  stays confounded by a pre-existing, separately-tracked divergence,
  documented not re-litigated.
- 224 pins byte-equal: `activity.golden.ratchet.test.ts` +
  `activity.harness-parity.test.ts` both 288/288 green.
- 0 unexplained risers: `sojono-24-tufe806` named with mechanism (REVEAL,
  same class as `boxefe`); the other 18 reds confirmed pre-existing via
  direct baseline-worktree measurement, not caused by this task.
- Legacy label path retired for every Snake-label site this task
  reaches: `renderer.ts`/`canvas-origin-text-ink.ts`'s `labelAlign !==
  undefined` gate needed NO further change (same finding as T1b pass 2)
  -- every site this task wires sets `labelAlign` unconditionally
  whenever its `outLabel`/case-label is present, so the legacy fallback
  simply stops being hit for those edges; nothing new falls into it.

## Not done / out of write-set (reported, not silently expanded)

- The fork/split canvas-size gap and the if-long-horizontal 3px height
  floor (both named above) are real, verified, out-of-write-set
  residuals (`tiles/gtile-fork.ts`/`gtile-split.ts`/
  `gtile-if-long-horizontal.ts`). Not fixed this pass.
- Switch's case-diamond X placement (pre-existing, T1a row-31) is
  untouched -- owned by whatever follow-on closes that finding.
- `walk-if-with-links.ts`/`walk-if-down*.ts` were in this task's
  write-set but needed NO edit: grep-confirmed neither
  `cond/FtileIfWithLinks.java` nor `vcompact/FtileIfDown.java` ever
  calls `Branch#getSpecial()`/`getTextBlockSpecial()` -- the branch-exit
  mechanism structurally never reaches either builder. Documented inline
  in `conditional-builder.ts`, not silently skipped.
