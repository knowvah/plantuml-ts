# add3-T3b — switch family (demibe/mojezi/pateca/rekuxa/rujixe/ruzazu/sojono)

## Commits
- `0720c0e81` fix(activity): port FtileSwitchWithDiamonds/ManyLinks geometry
  (6 files, +784/-310). Only commit this session; the worktree is clean at
  HEAD, nothing else staged or pending.

## Java -> ours (file:line)
- `FtileFactoryDelegatorSwitch.java:129-161` (`getDiamond1`/`getDiamond2`:
  bare `FtileDiamondInside` hexagons, no `.withNorth/.withWest/.withEast`)
  -> `layout/tile-layout-structural.ts#tileSwitch` now builds `diamond`/
  `mergeDiamond` via `GtileDiamondInside('', {}, ...)` instead of the old
  40px `GtileDiamond` rhombus (read-only import; `gtile-diamond*.ts` is
  NOT in this task's write-set and was not touched).
- `FtileSwitchWithDiamonds.java:66-90` (`Mode.BIG_DIAMOND`/`SMALL_DIAMOND`,
  `w13`/`w9`) -> `tiles/gtile-switch-geometry.ts#computeSwitchMode`.
- `FtileSwitchNude.java:127-135` (`calculateDimensionInternalSlow`: sum
  width + `xSeparation*(n-1)`, max height + fixed `100`) ->
  `gtile-switch-geometry.ts#computeNudeDimensions`.
- `FtileSwitchWithDiamonds.java:100-106`/`FtileSwitchWithManyLinks.java
  :412-423` (`getYdelta1a`/`getYdelta1b`) ->
  `gtile-switch-geometry.ts#computeYdelta1a`, `SWITCH_YDELTA1B`.
- `FtileSwitchWithDiamonds.java:115-188` (`calculateDimensionInternalSlow`
  BIG/SMALL branches, `getTranslateMain`/`getTranslateDiamond1`/
  `getTranslateDiamond2`/`getTranslateOf`) -> `tiles/gtile-switch.ts
  #computeSwitchLayout` (height formula and both diamonds' Y offsets are
  MODE-INDEPENDENT, verified algebraically via `FtileGeometryMerger`'s
  own center-aligned-merge math for the SMALL_DIAMOND case -- only width
  and case X-offsets differ by mode).
- `FtileSwitchWithManyLinks.java:81-107,206-241` (`ConnectionHorizontal
  ThenVertical`/`ConnectionVerticalTop`, diamond1-in edges) and `:142-295`
  (`ConnectionVerticalThenHorizontal`/`ConnectionVerticalBottom`,
  case-to-merge edges) -> `layout/switch-connection-points.ts` (pure point
  math) + `layout/walk-switch.ts` (push/label glue).
- `FtileSwitchWithOneLink.java:64-143` (single-case switch, both
  connectors are bare 2-point verticals at the DESTINATION's own x) ->
  `switch-connection-points.ts#oneLinkVerticalPoints`/`oneLinkBottomPoints`.
- `FtileSwitchWithManyLinks.java:432-473` (`addIngoingArrows`/
  `addOutgoingArrows`: push order is first-case, then last-case, then
  interior ASCENDING -- not the cases' own left-to-right array order) ->
  `walk-switch.ts#pushCaseInEdges`/`#pushCaseToMergeEdges`. Getting this
  push order right was itself a fix: porting the geometry alone (before
  this) made `demibe-40-moda439` a RISER (262 vs pin 249) purely from
  edge-document-order mismatch with byte-identical coordinates; splitting
  node-walk (ascending) from edge-push (first/last/interior) order fixed it
  with zero source-value changes.
- `FtileSwitchWithManyLinks.java:489-507` (`getFirstOutgoingArrow`/
  `getLastOutgoingArrow`, same-lane only) -> `walk-switch.ts#sameLane` +
  the two functions of the same name. Two independent `if`s (not
  `else if`) for the first/last case-to-merge push are preserved verbatim,
  including the literal double-push when the only qualifying case is both
  first and last (documented in `pushCaseToMergeEdges`'s own comment, not
  hit by any of this task's 7 rows).

## Rows: before -> after (probe `weightedScore`)
| slug | before | after | delta |
|---|---|---|---|
| sojono-24-tufe806 | 357 | 276 | -81 |
| demibe-40-moda439 | 249 | 86 | -163 |
| rujixe-89-sumo552 | 210 | 187 | -23 |
| rekuxa-78-lidi292 | 184 | 58 | -126 |
| pateca-54-lija084 | 165 | 61 | -104 |
| ruzazu-94-meso880 | 164 | 60 | -104 |
| mojezi-43-gamu360 | 105 | 59 | -46 |

Sum over these 7 rows: 1434 -> 787 (-45%). Full 76-row baseline Sigma:
9220 -> 8531 (-689), **zero risers**. `giteso-65-mefo026` (NOTE-MULTI
family, not in this task's write-set) also fell 488 -> 446 as a side
effect of the diamond-hexagon fix (it contains a nested switch) -- a
genuine improvement, not a regression anywhere else; checked the full
76-row set, no other fixture moved.

## Residual per row (not byte-equal; all moved toward the jar, none away)
All 7 rows share ONE remaining mechanism, not yet closed:

**SMALL_DIAMOND-mode `getYdelta1a` undershoots by a constant, reproducible
offset.** Isolated via direct pixel measurement against the jar SVG
(`rekuxa-78-lidi292`, `pateca-54-lija084`, `demibe-40-moda439` all show
the identical pattern): diamond1's hexagon top/bottom (90/114, height 24)
match the jar exactly (byte-identical, confirmed no diff reported on that
polygon); the case row starts at jar y=146 in every one of these, needing
`Ydelta1a = 32`, but the literal formula port
(`max(10, maxPositiveLabelHeight) + 10`, `FtileSwitchWithManyLinks.java
:412-423`) computes `21` (`maxPositiveLabelHeight` measures `11` for every
single-line case label, confirmed against the measurer's own `height:
font.size` convention, `StringBounderFromWidthTable.java:67-76`, and
against our port's `measurer.ts:190` -- both give 11 for an 11pt line, no
discrepancy there).

- **Ruled out, with evidence:** wrong `Mode` (`w13`/`w9` recomputed BY
  HAND from the jar's own rendered case-box/diamond1 x-positions on
  `rekuxa`: `w13 = 57 - 26.0125 - 26.013 = 4.975`, `w9 = 52.025` --
  matches our computed `{w13: 4.975, w9: 52.025}` exactly, SMALL_DIAMOND
  confirmed independently of our own code); wrong `diamond1.height`
  (24, matches the drawn hexagon exactly); wrong case `NORTH_HOOK.y`
  assumption (0, printed and consistent); wrong `getYdelta1a` citation
  (re-read `FtileSwitchWithManyLinks.java:412-423` twice, ported
  verbatim); wrong arrow font size (11, `ARROW_FONT_SIZE`, matches the
  jar's own `<text font-size="11">` on every case label); measurer height
  convention (`StringBounderFromWidthTable.calculateDimension`: `height =
  size`, confirmed against the real upstream source, matches our port).
- **Not yet isolated:** why 32 is needed when every candidate reading of
  the formula gives 21 (SMALL) or 33 (BIG, off by only 1 -- `11 + 24/2 +
  10`). `32 = 2*11 + 10` fits numerically but EVERY affected row's case
  labels are single-line, so `maxPositiveLabelHeight` is always `11`
  regardless of label text/length in this corpus -- there is no row here
  with a different label height to disambiguate "formula literally needs
  `2*max(...)+10`" from "formula is right but something else adds exactly
  one more `maxPositiveLabelHeight`'s worth of gap". A multi-line case
  label fixture (none in this task's 7 rows) would disambiguate directly.
  **Did not fit a value** -- left the literal port in place rather than
  hardcoding `+11`/`2x`.
- Downstream of this ONE offset: every row's case row (and everything
  below it) sits `11`px too high; `sojono`/`ruzazu`/`mojezi` additionally
  carry their own named residuals (notes-on-switch unported for sojono/
  rujixe per the b2/b3 census note; `ruzazu`/`mojezi`'s cross-swimlane
  `BIG`/`SMALL` interaction with the SAME Yd1a gap, not separately
  re-derived this session).

## Census movers (equality pins -- orchestrator action needed)
`style-baseline.json`/`text-baseline.json`/`swimlane-baseline.json` are
EQUALITY pins (not ratchets, rule #10); I did NOT touch
`oracle/goldens/**` (rule #5). 11 rows moved, ALL toward the jar column
(verified one concretely: `demibe-40-moda439`'s own height `303 -> 272`
vs jar's `283` -- `|283-272|=11 < |283-303|=20`):
- style: `demibe-40-moda439`, `giteso-65-mefo026`, `mojezi-43-gamu360`,
  `pateca-54-lija084`, `rekuxa-78-lidi292`, `rujixe-89-sumo552`,
  `ruzazu-94-meso880`, `sojono-24-tufe806`
- text: `ruzazu-94-meso880`
- swimlane: `mojezi-43-gamu360`, `ruzazu-94-meso880`

Orchestrator: re-pin all three from a fresh measurement once this lands.

## Not done, and why
- The `+11` `Ydelta1a` mechanism above is open (instrumented, ruled out
  five candidates, did not fit a value -- see "Not yet isolated"). Fixing
  it would very likely close most of the remaining residual on all 7 rows
  uniformly (it is the SAME offset on every one of them).
- Notes-on-switch (`sojono`, `rujixe`) are explicitly out of scope per the
  b2/b3 census note ("notes on a switch unported") -- not attempted this
  session; the geometry/connector fix here is a prerequisite for it, not
  a replacement.
- Cross-swimlane `ruzazu`/`mojezi` interaction with the Yd1a gap: not
  separately re-derived; likely shares the exact same root cause as the
  SMALL_DIAMOND rows above (same symptom, same magnitude).

## Quality gates run (all green at HEAD `0720c0e81`)
`tsc --noEmit` (both configs), `eslint` on every changed file,
`vitest run tests/diagrams/activity` (1094/1094), `activity.golden.ratchet
.test.ts` + `activity.harness-parity.test.ts` (337/337, pins byte-equal).
Did not run the full `npm test` this session (not required by rule #4's
"never the full npm test" instruction for this worktree).
