# alc-T8 — re-pin and close out `activity-lane-capture`

Mission `activity-lane-capture`, 2026-09-15, branch
`feat/activity-lane-capture`. Baseline `2a31a9ad` (aggregate 52954).
Probe `scripts/activity-probe.ts`, re-pin `scripts/repin-activity-baselines.ts`
(both committed at T0a/T0b).

## Headline

| quantity | before | after |
|---|---|---|
| aggregate `weightedScore` (268) | 52954 | 52673 |
| the 30 affected fixtures (T1-amended from 40) | 8950 | 8669 |
| fixtures moved | | 22 fell, 8 rose, 0 outside the 30 |
| `--lanes` mismatches on the 30 | 53 | 36 |
| `ALLOWED_NEW_OVERLAPS` | 7 | 9 (all attributed) |
| sibling ratchets (seq/state/class/desc/json) | 1151/3/62/316/24/54/11 | identical |

## Observation: a planning regex scan over-counted a lane defect by a third
- **Context**: `fixtures.md` was built by a regex scan for a lane line nested
  inside a compound.
- **Finding**: T1's dual capture (opener and closer lane on every compound)
  showed 10 of 40 rows open and close in the SAME lane, which makes the fix
  output-identical there. One (`letuke`) had no lane at all: the `|` was a
  creole table.
- **Impact**: pick an "affected set" by instrumenting the quantity the fix
  changes (opener != closer), not by source shape. The tighter set also
  sharpened stop 6: none of the 10 moved.
- **Confidence**: High.

## Observation: the overlap pin list was not caused by lane capture
- **Context**: `next-missions.md` and the brief predicted that fixing lane
  capture would empty `ALLOWED_NEW_OVERLAPS`.
- **Finding**: every fork bar and split line now lands in the jar's lane, and
  the list went 7 -> 9. The survivors are cross-lane arrowheads at identical
  (or 5 px apart) coordinates, which contribute no X slot
  (`ftile/Worm.java:159-168`), and a lane title vs a bar-end reservation
  (`klimt/compress/UGraphicCompressOnXorY.java:100-112`).
- **Impact**: filed `activity-cross-lane-arrowhead-collapse`. Do not route
  a future fix at the overlap list through lanes.
- **Confidence**: High (dumped per entry).

## Observation: correct lanes exposed a split connector draw-order divergence
- **Finding**: `racana-82-zece676` rose 310 -> 406 at T7 with every in-drop now
  leaving the S1 top line like the jar's. Upstream draws all `ConnectionIn`
  (`ParallelBuilderSplit.java` `doStep1`) before all `ConnectionOut`
  (`doStep2`); ours alternates per branch (`walk-fork-branches.ts:81,127`),
  so positional pairing un-pairs every connector once the lanes are right.
- **Impact**: filed `activity-split-connector-draw-order`; it owns 5 of the
  8 accepted rises.
- **Confidence**: High for `racana` (dumps read end to end); the other four
  are class-level.

## Observation: `--lanes` residuals are a diamond COUNT gap, not lanes
- **Finding**: all 36 remaining mismatches are diamond/hexagon rows in 17
  fixtures where the jar draws more such polygons (`if` fixtures 1 vs 2).
  Document-order pairing then shifts. Repeat cases are the entry `diamond1`
  (D3); the other 13 are unread.
- **Impact**: `--lanes` rows are only trustworthy where the per-kind counts
  match; filed `activity-diamond-count-shortfall`.
- **Confidence**: High for the counts, unknown for the 13 roots.

## Observation: a base worktree cannot run the oracle suites without stdlib
- **Finding**: `git worktree add` at an old commit fails vitest global setup:
  `assets/stdlib does not exist` (gitignored). Symlinking `node_modules` and
  `assets/stdlib` from the main checkout made the sibling "before" counts
  reproducible.
- **Confidence**: High.
