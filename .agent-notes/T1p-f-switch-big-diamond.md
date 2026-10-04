## Observation: switch BIG_DIAMOND mode is width-threshold-sensitive across the port boundary
- **Context**: T1p-f (mission `activity-divergence-drive-2`, batch 1p),
  porting `FtileSwitchWithDiamonds#drawU`'s `Mode.BIG_DIAMOND` branch
  (`vcompact/cond/FtileSwitchWithDiamonds.java:73-90,136-138`). The task
  brief named `mojezi-43-gamu360` and `ruzazu-94-meso880` as corpus
  cross-lane switches to check.
- **Finding**: `mode = w13 > w9 ? BIG_DIAMOND : SMALL_DIAMOND` is a
  continuous threshold over `diamond.width` and the first/last case
  tiles' `getLeft()`/`getRight()`. Computed against the JAR's own
  oracle widths, `mojezi` is SMALL_DIAMOND (w13 = -15.35, matches its
  oracle SVG showing no duplicate boxes) and `ruzazu` is BIG_DIAMOND
  (its oracle shows 3 "Act" rects for 2 source "Act" AST nodes -- one
  genuinely duplicated). Computed against OUR OWN case/diamond widths
  (same formula, our `GtileSwitch`/`GtileTopDown` geometry), BOTH
  fixtures evaluate to SMALL_DIAMOND -- `ruzazu`'s w13 came out
  negative (-5.28) where the jar's own widths would give a different
  sign. This is a pre-existing width-computation divergence elsewhere
  in the port (likely `GtileTopDown`'s `left` -- `Math.max` of
  children's own `NORTH_HOOK.x` vs the jar's `FtileGeometryMerger
  #appendBottom`), not a defect in the mode PORT itself.
- **Impact**: the mode port is faithful and citation-grounded (verified
  against three independently-computed cases: the T1p-e/T1p-f 2-leaf
  fixture, which IS reliably BIG_DIAMOND under both jar and our
  geometry since w9=0 and the diamond is trivially wider than two
  single-char case boxes; and the two corpus fixtures, where ours
  diverges from jar's). A future width-fidelity pass on
  `GtileTopDown`'s own `left`/`getCoord(NORTH_HOOK)` computation could
  flip `ruzazu`'s computed mode to match the jar without touching this
  task's mode/duplication logic at all -- do not "fix" the threshold
  itself to force a particular fixture's mode; that would be fitting a
  value, not fixing the geometry that feeds it.
- **Confidence**: High (three independently hand-computed w13/w9
  values, cross-checked against each fixture's own oracle rect count).

## Observation: the BIG_DIAMOND bypass ALSO skips lane-width measurement, not just the draw pass
- **Context**: same task. Initial implementation duplicated nodes
  across every lane in `placeSwimlanes`'s final node-emission step
  only, leaving `measureLanes`'s content-extent pass untouched (reading
  only each node's own original tag).
- **Finding**: this made the T1p-e/T1p-f fixture's Lane1 copy of case
  "A" render at x=16, LEFT of Lane1's own divider (x=29.025) --
  overflow, caught by an assertion in the new integration test, not by
  eyeballing the SVG.
- **Mechanism**: `Swimlanes#computeDrawingWidths` (`Swimlanes.java:
  379-395`) measures lane widths through a SEPARATE interceptor,
  `UGraphicInterceptorAllSwimlanes` (`vcompact/
  UGraphicInterceptorAllSwimlanes.java`), which has the exact same
  bypass vulnerability: `FtileSwitchWithDiamonds#drawU`'s direct
  `tile.drawU(...)` call skips `withActiveSwimlanes`' narrowing in
  THIS pass too, so a bypassed leaf case's own primitive shapes get
  dispatched to every still-active lane's own `LimitFinder`, not just
  its structural tag's lane -- widening every lane's measured content
  to already fit the duplicate before any drawing happens.
- **Fix**: `measureLanes`'s `items` list must fan a tagged node out
  across every `laneNames` entry too (`laneItemsOf`), mirroring
  `placeNode`'s own per-lane fan-out exactly -- the SAME duplication,
  applied to both passes, because the jar's own bypass is the SAME
  bypass in both passes.
- **Impact**: any future "redraw once per X" port (another gated-vs-
  bypassed-draw mismatch, if one surfaces) must check for a
  CORRESPONDING width/measurement-pass interceptor before assuming the
  draw-pass fix alone is complete -- the jar routinely pairs a
  draw-time interceptor with a measurement-time interceptor over the
  SAME tree, and a bypass present in one is usually present in the
  other.
- **Confidence**: High (reproduced the overflow, read the Java, fixed
  it, reproduced the fix with a passing assertion).

## Observation: a leftover background shell process produced a false-positive test failure
- **Context**: ran `npm test` via the Bash tool's `run_in_background`,
  then separately started a SECOND `npm test` with a raw shell `&`
  (not `run_in_background`) to work around a timeout -- that process
  outlived the tool call and collided with a later, properly-run
  `npm test`, both writing to the same `coverage/` directory.
- **Finding**: the collision produced two SPURIOUS failures
  (`refusal-coverage.test.ts`, `routing-conformance.test.ts` --
  "corpus completeness") that did not reproduce in isolation or in a
  clean re-run. `pkill -f "npm test"` cleared it, but that pattern is
  broad enough to risk killing an unrelated agent's test run on a
  shared machine -- a safer kill would target the specific PID.
- **Impact**: never background a long test run with a bare shell `&`;
  use the Bash tool's `run_in_background` exclusively so the harness
  tracks and can report/clean up the process. If a stray process is
  suspected, check `ps aux` for the specific command before killing
  anything with a broad `-f` pattern.
- **Confidence**: High (reproduced the collision's exact error
  message, then confirmed both "spurious" tests pass in 2 separate
  clean re-runs with no concurrent process).
