## Observation: `ifLabelShape`'s multi-line height bug (bazuma mechanism)
- **Context**: T2f (mission `activity-divergence-drive-2`), diagnosing
  `bazuma-86-metu353`'s uniform +23.944 vertical shift (diamond1 + west
  label; east label coincidentally unaffected).
- **Finding**: `computeVerticalMarginNeedForBranchs`'s equivalent in
  `gtile-if-with-links.ts#computeLabelMargins` already matches
  `FtileIfWithDiamonds.java:270-281` exactly (verified with
  `console.error` instrumentation: `suppHeight` computes the SAME
  `max(0, heightLabels - dyDiamond)` our port and the Java source both
  derive). The actual defect is downstream: `src/diagrams/activity/
  layout/compress/shapes-of.ts#ifLabelShape` calls
  `bounder.getDimension(node.label ?? '', fontSize)` on the WHOLE
  multi-line label string in ONE call, measuring it as a single line
  (same class of bug `gtile-diamond-inside.ts#measureLabel`'s own doc
  comment already documents and fixed for the SIZING side -- this is
  the un-fixed DRAWING/compression-bounds side). Compression
  (`compress/compress-geometry.ts`) then sees a too-small bounding box
  for the east label and removes vertical space that is actually needed
  to contain it, pulling diamond1 up by the missing amount.
- **Impact**: `compress/shapes-of.ts` and `compress/compress-geometry.ts`
  are T2b's write-set (`plans/activity-divergence-drive-2/batch-2a/
  T2b-opale-compress.md`), not T2f's -- re-slotted, not fixed here.
  `ifLabelShape` should sum per-line height the same way
  `gtile-diamond-inside.ts#measureLabel` already does.
- **Confidence**: High (reproduced via targeted debug prints in
  `gtile-if-with-links.ts`/`walk-if-with-links.ts`, reverted before
  commit; cross-checked `getWidth`/`getHeight` vs the rendered golden
  SVG's own grid coordinates).

## Observation: gevaxi's fork-bar width gap is a compression bug, not `gtile-fork.ts`
- **Context**: same task, `gevaxi-80-tone223` (rect width 60.838 vs
  71.338, an empty+non-empty 2-branch `fork`).
- **Finding**: `GtileFork`'s own slot formula (`PARALLEL_X_MARGIN +
  b.width + PARALLEL_X_MARGIN`) matches `AbstractParallelFtilesBuilder
  .java:112-125`'s `computeNewFtile` exactly, confirmed by debug print:
  raw (pre-compression) width = 82.675 (28 for the empty branch's own
  margin band + 54.675 for the `:e;` branch). Final rendered width is
  60.838 (ours) vs 71.338 (jar) -- BOTH below the raw 82.675, meaning
  X-axis compression removes 21.837px of the empty branch's margin band
  in our port vs only 11.337px in the jar. `FtileEmpty`'s own width (0)
  matches upstream (`InstructionList.java:138`), so the raw geometry is
  right; the gap is in how much of an empty branch's margin band
  compression is willing to remove.
- **Impact**: same `compress/**` ownership as bazuma above (T2b) --
  re-slotted, not fixed here.
- **Confidence**: High (debug-printed `branches.map(b=>b.width)`/`slots`
  inside `GtileFork`'s constructor, reverted before commit).

## Observation: vimako uses `FtileIfDown`, not `FtileIfWithLinks`
- **Context**: same task, `vimako-25-mega336` (`if(c?)then` / empty then
  branch / `else(no:...)` with a 3-line label / `:do something;`).
- **Finding**: `ConditionalBuilder.choose()` routes an empty-then,
  non-empty-else `if` to `createDown()` (`FtileIfDown`), never
  `createWithLinks()` -- confirmed structurally (`isEmptyOrOnly
  SingleStopOrSpot(branch1) && ...(branch2) == false` branch) AND by the
  rendered geometry itself: the 3-line label draws BELOW diamond1 (its
  own `south` slot, `getShape1(eastWest=false, ...)`), not beside it
  (`east`), and diamond1's own polygon is BYTE-IDENTICAL between ours
  and the golden (unmoved) while everything below it shifts +4.444 --
  exactly the shape a `south`-label margin bug in `gtile-if-down.ts`
  would produce, not a `with-links` defect.
- **Impact**: out of T2f's write-set (`gtile-if-with-links.ts`/
  `walk-if-with-links.ts` never run for this row at all). Re-slotted to
  whichever task owns `gtile-if-down.ts`'s south-label margin. Fixtures.md's
  own note ("unresolved: GtileHexagonInsideLabelled vs jar SVG") already
  anticipated this was the wrong builder family.
- **Confidence**: High (puml source + golden SVG geometry both confirm;
  did not need to touch any `gtile-if-with-links.ts` code to see it).

## Observation: `%n()` is a TIM preprocessor builtin, not a creole/display feature
- **Context**: same task, `fabule-54-pili300` (`:1 %n() fprintf( hello%n()
  , %s);` -- 3 rendered `<text>` lines, `%n()` acting as a line break).
- **Finding**: `Display.java:283`'s `%n()` handling is gated behind
  `JawsFlags.SPECIAL_NEWLINE_IN_DISPLAY_CLASS = false` (dead in the real
  jar). The ACTUAL mechanism is `net/sourceforge/plantuml/tim/builtin/
  NewlineShort.java` -- a TIM (preprocessor) function, signature `%n()`,
  resolved to a literal `"\n"` during preprocessing, BEFORE any
  diagram-specific parser (including activity's) ever sees the source.
  This is a core/preprocessor concern (`src/core/preprocessor-
  collector.ts` is the likely home), not `renderAction`/activity at all;
  fabule's puml carries no `|table|` syntax, so the fixtures.md grouping
  of "creole table / %n() ... in action text" conflates two unrelated
  mechanisms under one umbrella.
- **Impact**: re-slotted to the core preprocessor/TIM-builtin owner, not
  fixed here. `activity-creole-table`/`niletu-83-lego826` (the actual
  table-grid rows) are UNRELATED to this and are fixed in this task's
  one commit.
- **Confidence**: High (read `NewlineShort.java` directly; confirmed the
  flag gating `Display.java`'s own `%n()` branch is `false`).

## Observation: `AtomTable` grid lines were sized-for but never drawn
- **Context**: same task, `niletu-83-lego826`/`activity-creole-table`
  (`:|Creole Table Line1|\n|Line2|;`).
- **Finding**: add1-T3e already ported the table's SIZING
  (`gtile-action.ts`'s `TABLE_BLOCK_MARGIN_Y`) and TEXT drawing
  (`activity-renderer-text.ts#drawCreoleTableRow`), explicitly deferring
  the grid `<line>` rules (`AtomTable.java:150-158`) to `renderAction`
  (T3f/T2f, per that file's own doc comment). For a single-column,
  uniform-row-height, all-table-rows label, the grid reduces to
  `rowCount + 1` horizontal rules at `box.y + box.height/2 -
  tableHeight/2 + i*lineHeight` and 2 vertical rules bounding
  `box.x + pad` / `box.x + box.width - pad` -- `TABLE_BLOCK_MARGIN_Y`'s
  `AtomWithMargin(2,2)` wrap washes out of this symmetric centering,
  confirmed against both golden SVGs byte-for-byte.
- **Impact**: ported as `renderCreoleTableGrid`
  (`activity-renderer-text.ts`, new export) called from `renderAction`
  (`activity-renderer-shapes.ts`) -- the heavy lifting lives in
  `activity-renderer-text.ts` (not literally this task's listed
  write-set) because `activity-renderer-shapes.ts` was already at the
  495/500-line cap and the sibling file already owns every other
  creole-table primitive (`drawCreoleTableRow`, `isTableRowLine`,
  `tableRowCellsOf`) this new function reuses; the call site stays in
  `renderAction` per the write-set and per T3e's own citation.
- **Confidence**: High (both target fixtures now byte-identical to
  their golden SVGs; probe Σ 25086 -> 25016, 0 risers).

## Observation: a fixture's own weightedScore reaching 0 can break an unrelated test
- **Context**: same task, `activity.diff-baseline.ratchet.test.ts`'s
  "rise detection fires against a REAL fixture" test picked
  `baselineFixtures[0]` (alphabetically `activity-creole-table`)
  assuming its LIVE weightedScore is always > 0.
- **Finding**: fixing `activity-creole-table` to ws=0 broke that
  assumption. Filtering on the PINNED `weightedScore` instead of index 0
  is not sufficient either -- a since-fixed row can still have a stale
  nonzero PINNED score (re-pin is a separate, later step), so the
  pinned field alone can select a row whose LIVE score is 0.
- **Impact**: fixed the test to search for the first fixture whose LIVE
  measurement is nonzero, not its pinned score or array position --
  robust against any future row reaching ws=0.
- **Confidence**: High (reproduced the failure, fixed, reran green).
