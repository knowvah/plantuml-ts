# aitp-T7 — close-out observations (`activity-if-tile-port`, 2026-09-16)

## Observation: a port that adds elements can expose a shared primitive's assumption

- **Context**: T7's rise attribution on the mission's own risers.
- **Finding**: `GtileTopDown` centred every child by `width/2` and every tile's
  `NORTH_HOOK.x` happened to be `width/2`, so the jar's `left`-alignment
  (`FtileAssemblySimple.java:131-141`, `FtileGeometryMerger.java:44-56`) was
  never modelled and never missed. The three if tiles are the first with
  `left != width/2`; 88 of 126 `if` fixtures drew a diagonal sibling link
  (plus 13 `while` fixtures whose off-centre hook had the same latent
  defect). The same assumption was baked into the if tiles themselves
  (`paddedLeft = outer/2`), which only showed AFTER the top-down was fixed.
- **Impact**: when a mission introduces the first asymmetric tile of a family,
  audit every consumer that assumes symmetry (the composite that assembles
  it, the wrappers that pad it) BEFORE measuring; a diagonal-segment scan
  (`scratchpad/diag-scan.ts`: any edge segment with both `dx` and `dy`
  non-zero) is a cheap, decisive detector. The while/repeat walkers still
  carry it (filed `activity-while-repeat-left-alignment`).
- **Confidence**: High (101 -> 32 -> 19 fixtures across T6b/T6c, each
  survivor attributed).

## Observation: the comparator is blind to an endpoint's magnitude

- **Context**: `fix(aitp-T3)` moved a Direct out-connector's endpoint from the
  canvas margin (x=12) to the if tile's `left` (x=136.7) on `gevaxi`.
- **Finding**: `weightedScore` did not change on any fixture
  (`final.json` byte-identical to `t6.json`). A visibly wrong endpoint and a
  correct one cost the same one unit.
- **Impact**: never use the aggregate to decide whether a geometry fix
  landed; use `--dump`/`--align` and a render. Corroborates
  `oracle-score-blind-to-magnitude`.
- **Confidence**: High.

## Observation: the four rise-attribution mechanisms of an element-adding mission

- **Context**: 30 pins rose against `b79502b5` under a mission that added the
  jar's missing elements.
- **Finding**: every rise fell into one of four classes, each provable from
  `measurements/t*.json` per-task deltas plus `--align`: (1) element growth
  under positional pairing (`compare.ts:404` charges the sum on a
  child-count mismatch); (2) reorder under positional pairing (element
  multiset unchanged); (3) the parent's snake-merge family
  (`UGraphicForSnake.java:146-165`: touching snakes merge and lose an
  arrowhead); (4) pre-existing divergences made visible (`detach` drawn as a
  stop, note tiles linked as siblings, the deferred repeat mid-arrow).
- **Impact**: write the accept-rises row grouped by class with per-slug
  deltas; a slug not in any class is a defect (that is how the
  `pushDirectConnector` bug and the top-down alignment were found).
- **Confidence**: High.

## Observation: vitest's silent under-collect is random and load-independent

- **Context**: gate runs at loads from 4 to 135.
- **Finding**: reported `Test Files` totals of 715, 710 and 712 against 717–719
  on disk, with different files missing each time and `coverage/.tmp`
  freshly removed; also full collection (721/721) on other runs at similar
  load. `--reporter=json --outputFile` names the gap; rerunning the named
  files with `--coverage.enabled=false` completes the gate.
- **Impact**: every gate row in this mission records collected vs on-disk
  counts; treat a bare `Test Files` total as unverified.
- **Confidence**: High (see `coverage-tmp-silent-undercollect` memory).

## Observation: agent reports that needed re-checking

- **Context**: seven subagents across T1–T6c.
- **Finding**: T1 asserted a `FtileDiamondInside2` east/west swap that T5
  disproved by tracing both constructors; T4 first approximated
  `Swimlane#isSmallerThanAllOthers` by lane membership (rejected, corrected
  to declaration order); T5 first reported a polygon overshoot as "not
  isolated" (resumed, attributed to snake merges); T3/T4/T5 each reported
  `npm run build` "pre-existing TS errors" that the orchestrator's runs never
  reproduced (0 `error TS` lines every time); the orchestrator's own
  instruction to drop an "unused" import was wrong (a stale editor
  diagnostic) and T6b correctly declined it.
- **Impact**: keep the verify-every-claim habit (`verify-agent-claims-si31`);
  disagreement backed by a cite from either side was always the right call.
- **Confidence**: High.
