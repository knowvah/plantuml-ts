# T1p-d — repeat break welding + cross-swimlane repeat-out

## Observation: cross-swimlane ConnectionOut already ported (census stale)
- **Context**: Starting T1p-d, scoped per decisions.md D12 to also port
  `FtileRepeat.java:308-329`'s cross-swimlane `ConnectionOut`.
- **Finding**: `walk-repeat.ts#pushRepeatOut` already tags the edge with
  `{kind:'repeat-out', p1, p2}`; `swimlane-loop-translate-repeat.ts
  #routeRepeatOut` already implements the exact drawTranslate geometry;
  `tests/diagrams/activity/layout/swimlane-loop-translate-repeat.test.ts`
  already covers it with a golden-fixture-backed test (`becanu-19-diti597`).
  22/22 pass. A prior `activity-loop-lane-translate` mission closed this.
- **Impact**: `connection-census.md`'s "MISSING for the cross-swimlane
  sub-case" row is stale — it grepped `walk-repeat.ts` only and missed the
  `swimlane-placement.ts#routeEdge` -> `swimlane-loop-translate-repeat.ts`
  dispatch seam. No code change needed.
- **Confidence**: High (ran the existing test, read both files).

## Observation: GtileBreak was an invented 20x20, real value is 0x0
- **Context**: Diagnosing why 3 of 6 break-in-repeat corpus fixtures
  (`cixave-47-milo698`, `dacuga-41-popo038`, `mudobi-07-biji996`) rose on
  `activity.diff-baseline.ratchet.test.ts` after porting the break-weld
  mechanism, per orchestrator instruction to check "what the jar builds
  for an if whose only branch is a break."
- **Finding**: `FtileBreak`'s constructor (`FtileBreak.java:44-46`) calls
  `super(skinParam, swimlane)` -> `FtileEmpty`'s two-arg ctor
  (`FtileEmpty.java:63-65`) -> `this(skinParam, 0, 0, swimlane)`. Width/
  height are 0. Independently confirmed via the PARALLEL
  `net.sourceforge.plantuml.activitydiagram3.gtile.GtileBreak` class
  (`GtileEmpty(stringBounder, skinParam, swimlane)` -> same `0, 0`
  resolution) — a second, independent Java hierarchy that exists
  alongside `ftile`/vcompact and happens to share this port's own
  `Gtile*` naming convention. `gtile-break.ts`'s old `width = 20; height
  = 20;` had NO upstream citation at all.
- **Impact**: fixed in `gtile-break.ts` (commit `efd25cda7`). Verified via
  `scripts/activity-probe.ts`: 5 fixtures fall (-34, -28, -29, -2, -13 —
  two of them, `nerete-42-save418` and `pixako-75-kumi821`, outside this
  task's original 6-fixture scope, discovered only by running the full
  probe). 3 still rise (below). Aggregate net: 31525 -> 31503 (-22).
- **Confidence**: High — two independent Java class hierarchies agree;
  verified by toggling the fix on/off and re-measuring.

## Observation: the remaining 3-fixture rise is NOT caused by break-welding
- **Context**: After the GtileBreak fix, `cixave-47-milo698` (97->165),
  `dacuga-41-popo038` (140->146), `mudobi-07-biji996` (121->290) still
  rise on the diff-baseline ratchet.
- **Finding**: proven via direct A/B toggle (env-var-gated early return in
  `pushRepeatWeldings`, removed before commit) that disabling the ENTIRE
  weld-diamond-and-edges push (both the diamond node and both weld edge
  shapes) changes NOTHING about `dacuga-41-popo038`'s remaining
  divergence — the `:error;` action after the if still renders at y=206
  instead of jar's y=202, identically with or without any weld code
  running. Further proven via a from-scratch fixture with NO repeat at
  all (`start; :test something; if (...) then (no) break endif; :error;
  stop`) that reproduces the SAME +4px offset (jar 197, ours 201) with
  zero repeat/weld/T1p-d code in the call path at all.
- **Mechanism (partial — not fully pinned to file:line)**: the if-down
  tile's OWN geometry is correct up to and including its own exit point
  (`GtileIfDown.getCoord(SOUTH_HOOK)`, confirmed byte-identical to jar's
  `ConnectionElseNoDiamond`/`calculateDimension().getPointOut()` in the
  rendered SVG — same absolute y in both). The divergence is entirely in
  what happens to the SEQUENTIAL gap from that exit point to the NEXT
  sibling (`:error;`): jar compresses it to 20px (the project's own
  documented `SEQUENTIAL_ASSEMBLY_GAP` floor), ours leaves 24px.
  `ifElseHexagonReservation` (the `UEmpty(5, hexagonHalfSize)` reservation
  `ConnectionElse2#drawU` draws, `FtileIfDown.java:402`) is confirmed
  correctly ported in `walk-if-down.ts` and sits in Y=[165,177], which
  does not overlap the affected [177,201] band.
- **Ruled out**: this task's own weld edges/diamond (A/B toggle); repeat
  as a structural factor (reproduces with zero repeat); `GtileIfDown`'s
  own exit-point formula (byte-identical to jar); `ifElseHexagonReservation`
  (correctly ported, non-overlapping band).
- **Narrowed to, NOT fixed (outside this task's write-set)**: the generic
  sequential-gap insertion (`GtileTopDown`'s `SEQUENTIAL_ASSEMBLY_GAP`,
  `activity-layout-constants.ts`) and/or the Y-axis compression pass
  (`compress-geometry.ts`/`slot.ts`) specifically for the case "sibling
  immediately follows an if-down tile whose main branch ends in `break`".
  `tile-coordinates.ts` (which builds the `'gtile-top-down'` sequence) is
  explicitly owned by T1p-b per the orchestrator's own note; `compress-
  geometry.ts` is unowned by any current task.
- **Also found, not chased further (same investigation)**: a SEPARATE
  Java class, `net.sourceforge.plantuml.activitydiagram3.gtile
  .GtileAssembly#supplementaryMove()`, uses a raw sequential gap of `30`
  (`30 + textBlock.height`), not `35` — contradicting `activity-layout-
  constants.ts#SEQUENTIAL_ASSEMBLY_GAP`'s own citation of
  `FtileFactoryDelegatorAssembly.java:58` (`35`). Both packages (`ftile`/
  vcompact and `gtile`) implement parallel Instruction* `createFtile`/
  `createGtile` methods for EVERY activity instruction, so BOTH exist in
  the jar simultaneously; which one actually renders a plain (non-
  Smetana) activity diagram was not determined in this investigation.
  Given `SEQUENTIAL_ASSEMBLY_GAP = 35` was previously empirically
  verified against the real jar oracle (per that constant's own doc
  comment), 35 is very likely still correct for whichever path is live —
  but this 30-vs-35 discrepancy is worth a dedicated check before anyone
  next touches sequential-gap compression, since the two code paths may
  not always agree on the raw (pre-compression) number even if the
  compressed result usually converges to the same visible value.
- **Confidence**: High on what's ruled out; Medium on the narrowed
  location (compression vs. gap-insertion itself — did not fully
  distinguish between the two within budget).

## Observation: style/text-baseline exact-match pins are now stale beyond this task's 6 fixtures
- **Context**: after the GtileBreak fix, `npm test` surfaces NEW failures
  in `activity.style-baseline.test.ts`/`activity.text-baseline.test.ts`
  for fixtures entirely outside T1p-d's scope: `bareka-88-fusu160`,
  `jipapo-14-kevu587`, `jupivo-67-gidi531`, `nerete-42-save418`,
  `pixako-75-kumi821`, `rucuga-83-tosu408` (any corpus fixture with a
  `break` anywhere was affected by the 20x20 -> 0x0 fix, not just
  break-in-repeat).
- **Finding**: `scripts/repin-activity-baselines.ts`'s own doc comment is
  explicit: "ORCHESTRATOR-ONLY: run once at T8/close-out... never per
  task, which would destroy the attribution D6 exists to buy." I did NOT
  run it.
- **Impact**: these pins need an orchestrator-level re-pin at mission
  close-out (a real, deliberate, improving change, not a regression —
  the "Conformance 'failures' are good news" pattern from memory
  `conformance-failures-are-good-news.md`), covering MORE fixtures than
  just this task's 6.
- **Confidence**: High (read the tool's own doc comment).
