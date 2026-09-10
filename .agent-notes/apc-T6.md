# apc-T6 — re-measure, re-pin, close out

Mission `activity-parallel-connectors`, batch 6, 2026-09-10, branch
`feat/activity-parallel-connectors`. Baseline `b7c293c6` (aggregate 43977;
the 32 split/fork fixtures 8218). Probe: the T0 scratch script; re-pin: the
previous mission's scratch `repin-activity.ts`, one measurement.

## Headline

| quantity | before | after | change |
|---|---|---|---|
| aggregate `weightedScore` (268 fixtures) | 43977 | 42511 | −3.33% |
| the 32 split/fork fixtures | 8218 | 6752 | −17.84% |
| `svg/g[][childCount]` on the subset | 3733 | 2116 | −43.3% |
| `svg/g[][childCount]` on the 11 fixtures with a terminator inside a branch | 2026 | 1027 | −49.3% |
| `polygon[]/@points` (subset) | 313 | 300 | −4.2% |
| `line[]/@y1` / `@y2` (subset) | 600 / 599 | 599 / 598 | −1 each |
| `line[]/@x1` / `@x2` (subset) | 596 / 595 | 605 / 605 | **+9 / +10** |
| `rect[]/@width` (subset) | 72 | 55 | −23.6% |
| `rect[]/@fill` / `@rx` / `@ry` (subset) | 46 each | 12 / 7 / 7 | fork bars are `#555` with `rx 2.5` |
| our zero-length `<line>`s | 2 | 0 | |
| fixtures moved (of 268) | | 29 fell, 2 rose, 237 unchanged | only the 32 parallel fixtures moved at all |

Risen pins, both adopted with journaled mechanisms: `bixefi-77-moki051`
181 → 220 and `gesogi-81-xoma900` 242 → 248 (the uncompressed 28 px
packing, C2; the filed parser lane-capture defect below). Sibling suites:
23 files / 2167 passed + 1 skipped at `b7c293c6` and at HEAD, identical per
file.

## Observation: the attribute families are not comparable across the comparator's short-circuit

- **Context**: `line[]/@x1`/`@x2` rose by 9/10 although every connector x is
  now the branch's own (`ParallelBuilderSplit.java:194-203`).
- **Finding**: at T1, fixtures like `zizaki-04-guvi945` had OURS 30 children
  vs JAR 26 in the diagram `<g>`, and `compareNodes` charged ONE
  `childCount` diff (w=41) and never descended. Once our count matched
  (T2), the comparator paired children positionally and every attribute
  diff underneath became visible — and it exposed a real draw-order
  divergence (our join bar was emitted before the branches; upstream's
  `FtileAssemblySimple(result, out)` draws it after, fixed at T3). The
  attribute totals therefore include diffs that were invisible before;
  `weightedScore` (the gated quantity) is the number that is comparable.
- **Impact**: state exit bars on families only when no fixture crosses the
  `childCount` boundary, or state them on the score.
- **Confidence**: High — `.agent-notes/apc-T0.md`-style tag-sequence dumps
  at T1 and T2 (`decision-journal.md`, T2 correction row).

## Observation: the swimlane census moved on all 17 laned fixtures; 12 closer, 5 farther

- **Finding**: the join bar now sits in the last branch's exit lane and the
  split's top line in the first branch's entry lane (D4;
  `ParallelBuilderSplit.java:81`, `AbstractParallelFtilesBuilder.java
  :208-210`, `InstructionFork.java:196`), and T4 narrowed the fork width, so
  lane content widths moved. Divider-x distance to the jar fell on 12
  (`begivo` 53 → 9, `decudi` 169 → 43, `maketa` 124 → 36) and rose on 5
  (`bugaja`, `gugala`, `nupose`, `roboja`, `racana`): on those the
  full-width bar (`Σ slots`) lands in ONE lane — the wrong one, because of
  the parser defect below — where the jar clips the bar to the lane's own
  content (`FtileBlackBlock.java:101` `ignoreForCompressionOnX`, C2).
- **Confidence**: High for the measurement; the C2 clip is read, not ported.

## Observation: 8 style-census line counts moved away from the jar's

- **Finding**: `camavo`, `fovaja`, `gesogi`, `gugala`, `jevoce`, `judatu`,
  `jupivo`, `tobajo` lost 1–4 `<line>`s each (bar-centre elbows became
  two-point drops) while the jar draws MORE lines than we do on them for a
  reason outside this mission: `camavo`'s five extra jar lines are its
  repeat/while loop-back connectors, which the jar breaks around the
  `while (ok)` label (`304.45,111 → 190.725,111` and `142.725,111 → 29,111`)
  where ours is one unbroken horizontal. The `childCount` anti-monotone
  class: a correct removal widens a gap another mechanism owns.
- **Confidence**: High.

## Filed (measured at HEAD, in `planning/next-missions.md`)

- **C2 `klimt/compress`** — the 28 vs 10 packing on every multi-branch
  fixture (`simuti`: exactly 18 px per gap) and the lane-clipped bar widths.
- **Parser lane capture** — `node-dispatch.ts:261`/`:291` spread the lane
  AFTER the branches parse. Throwaway fix measured: aggregate 42500 → 42519
  at T3 (`bixefi` 220 → 119, `tobajo` 774 → 725, `jevoce` 369 → 599).
- **Fork bar stroke** — the jar strokes the block in its own colour at 1.0;
  `rect[]/@stroke` + `@stroke-width` 35 + 35 on the subset.
- **Loop-label line gap** — the jar splits a while/repeat back-edge around
  its label; count-only weight on `camavo`-class fixtures (in
  `childCount`).
- **if/switch connector shape** — unchanged by this mission (D1), filed
  before it.
