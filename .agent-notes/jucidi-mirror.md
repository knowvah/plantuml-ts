# jucidi-mirror (fix/jucidi-mirror-cross-lane-else-in)

## Observation: non-translatable cross-lane connections are drawn by no pass
- **Context**: jucidi-98-zato093 (31), FtileIfLongHorizontal's ConnectionLastElseIn.
- **Finding**: `ConnectionCross#drawU` draws only `ConnectionTranslatable`s
  (`ConnectionCross.java:49-64`); each lane pass draws a Connection only when
  tile1-out and tile2-in are null or that lane
  (`UGraphicInterceptorOneSwimlane.java:93-104`). A child outside the
  composite's `getSwimlanes()` is drawn by no pass (`:68-75`). Ours treats every
  cross-lane edge as translatable in `swimlane-placement.ts#routeEdge`, so each
  walker must gate. Shared helpers: `layout/swimlane-connection-gate.ts`.
- Ported for: FtileIfLongVertical, FtileIfLongHorizontal, FtileIfDown
  (optionalStop), FtileWhile (specialOut), ParallelBuilderMerge, FtileSwitchWithOneLink.
- Audit of every `extends AbstractConnection` (activitydiagram3/): the other
  non-translatables are same-lane by construction (diamond->diamond, tile->null)
  except FtileWhile BackBackward1/2 -- but the while backward is always built
  in the while's own lane (`InstructionWhile.java:121-122`), so never cross-lane.
- **Impact**: any new walker port must gate non-translatable connections.
- **Confidence**: High (jar fixtures under tests/fixtures/activity/jucidi-mirror, 0 diffs).

## Observation: open residuals found while auditing (not fixed, other mechanisms)
- **while backward lane**: `|B|` before `backward:` -- jar keeps the backward
  box in the while's lane (`InstructionWhile.java:121-122`, `swimlane` arg);
  ours places it in B. 99 diffs on a 1-file fixture (lines 17 vs 16).
- **switch many-case cross-lane label**: middle case in another lane -- counts
  equal, only the case label `text/@x` (+107.5) and `@y` (+5) differ.
- **fork-merge top bar lane**: jar's bar is `list99.get(0).getSwimlaneIn()`
  (`ParallelBuilderMerge.java:76`); ours uses the fork's `myLane`. Coincides in
  every fixture seen; not exercised.
- **snake-merge ULP crash**: `|Main| start :receive; if (a?) then (yes) :first;
  elseif (b?) then (yes) :second; else (no) :fallback; endif |Other| :done; stop`
  throws `snake-merge: not a horizontal or vertical line
  (123.71249999999998,110)->(123.71249999999999,145)` on main before this
  branch's changes. Renaming `:receive;` to `:something Received;` avoids it.
- **Confidence**: High for the measurements; mechanisms for the first two not traced.
