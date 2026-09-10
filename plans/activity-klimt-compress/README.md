# Mission: `activity-klimt-compress`

**Branch:** `feat/activity-klimt-compress` · **Planned:** 2026-09-10 ·
**Baseline commit:** `fa578b8a` (main, clean, all four gates green:
701 test files / 19441 tests; aggregate activity `weightedScore` **42511**;
the 32 split/fork fixtures **6752**)

## Objective

Port `klimt/compress` (C2) the way `ActivityDiagram3#getTextBlock`
(`ActivityDiagram3.java:205-213`) applies it: record every occupied interval
of the finished drawing (`SlotFinder`), turn the gaps between them into
slots shrunk by 5 on each side (`SlotSet#reverse().smaller(5.0)`), and
redraw with `CompressionTransform` removing them — ON_X first, then ON_Y on
the result. Bars ignore X and reserve 2 px at each end; cross-lane parallel
arrowheads are skipped on X; hexagons reserve 5 × 12 beside them. Because
occupancy is what arrowheads and boxes cover, `ArrowsRegular` (10 long,
±4, notch 4) is ported first as the shared arrowhead. The pass is a
geometry-to-geometry transform at the same pipeline point as upstream's:
after layout, before draw.

## What was measured before planning

| finding | number |
|---|---|
| inter-branch gap on `simuti-16-lece058` | ours 28, jar 10: exactly 18 removed per gap |
| `zizaki-04-guvi945` fork bar | ours 125.4, jar 103.4: 18 (gap) + 2 + 2 (bar end reservations) |
| Y compression on `zizaki` / `bixefi` | none: arrowheads occupy the 20 px bar gaps |
| aggregate x families at `fa578b8a` | `line[]/@x1` 2705, `@x2` 2705, `polygon[]/@points` 1722; `childCount` 18038 of 42511 |
| our arrowhead vs the jar's | 3-point, 8 long, ±3.2 vs `ArrowsRegular` 4-point, 10 long, ±4, notch 4 |

## Exit bar

- Aggregate `weightedScore` over the 268 fixtures **falls**, stated against
  **42511**; the 32-fixture subset against **6752**
- `rect[]/@x`, `text[]/@x`, `line[]/@x1`/`@x2`, `svg/@width` fall on the
  fixtures with a multi-branch fork/split; `polygon[]/@points` falls (T1)
- **Zero UNEXPLAINED rises.** T1's polygon family is pre-named; every other
  rise needs its own instrumented journal row before its commit
- Every re-pinned baseline is **diffed** and every pin that ROSE is named
- Sequence, state, class, description and json suites **unmoved**, with counts
- The invariant test (no new overlap after compression) is green on all 268
- All four gates green: `npm test`, `npm run typecheck`, `npm run lint`,
  `npm run build`

## What this mission does NOT do

- Does not port `Recentred` (the canvas margin; filed as
  `activity-canvas-margin`), `Expand*` (unused by activity), or
  `ArrowsTriangle` (filed)
- Does not fix the in-branch vertical spacing gap `zizaki` shows (ours 52
  between stacked boxes, jar 67) — pre-existing, filed at T0 with its weight
- Does not touch the parser lane-capture defect, lane width measurement
  (`measureLanes`, `swimlane-context.ts`), `src/core/**`, the Geo shapes,
  `layout.old.ts` or any `activity-layout-*.ts`
- Does not change the renderer's edge-label width approximation
  (`renderer.ts:80`); the slot finder measures with the bounder and the
  difference is filed

## Stop conditions

1. A task needs a file outside its write-set AND outside every other task's
2. Two consecutive gate failures on the same check
3. A decision in [`decisions.md`](decisions.md) is contradicted by the Java —
   amend there and halt, never silently override
4. **A constant cannot be sourced** to a Java `file:line`: the 5, the 2, the
   5 × 12, the 10 / 4 / 4. Fitting is forbidden; the jar's 10 px gap may
   never be written as a margin or a target
5. A write-set names `layout.old.ts` or any `activity-layout-*.ts`
6. **T2, T3 or T4 moves the aggregate at all** — pure porting; 42511 exactly
7. **A fixture rises and its mechanism cannot be stated before the commit**
8. Any sibling conformance suite moves by even one test
9. A task needs `src/core/**`, a shared `svg.ts` helper, or a change to the
   `ActivityNodeGeo` / `ActivityEdgeGeo` / `SwimlaneGeo` shapes
10. **The pass throws on any baseline fixture** (a `baseline` entry flipping
    to `error`)
11. **The invariant test finds a new overlap** after compression, on any fixture, between two shapes that BOTH occupy on the moved axis (amended 2026-09-10 after the T5 halt: a pair where one shape contributes no slot on that axis — an X-skipped cross-lane head, a `CenteredText` title on X, an ignored rect's middle — is the class the jar moves by design and is pinned, not forbidden)
12. **T5 needs lane width measurement changed** — upstream measures lanes
    before compression (`Swimlanes.java:396-449`); needing otherwise means
    the structure is wrong
13. The 268-fixture ratchet wall-clock exceeds the test-budget invariant

## Push forward

Equivalent spellings and file organisation (a sibling module when a file
would cross the 500-line hook — `tile-coordinates.ts` is at 484); adopting
an instrumented riser with a journal row before the commit; re-pinning a
test that pinned the uncompressed model (branch offsets, bar widths, lane
divider x's, the 3-point arrowhead) when the new value carries its citation;
a shape kind upstream draws nothing for (break, if-merge) emits nothing,
cited; label occupancy measured with the bounder while the renderer keeps
its approximation (filed, not changed); regenerating `docs/catalog.md` on
drift; T1's `polygon[]/@points` movement journaled per fixture class.

## Quality gates

- `npm test` — pass: exit 0, `Test Files` ≥ 701 (fewer = `coverage/.tmp`
  under-collect: `rm -rf coverage/.tmp` and rerun; confirm with
  `npx vitest run --coverage.enabled=false --reporter=json`); on_fail:
  fix_and_rerun
- `npm run typecheck` — pass: exit 0; on_fail: fix_and_rerun
- `npm run lint` — pass: exit 0; on_fail: fix_and_rerun
- `npm run build` — pass: exit 0; on_fail: fix_and_rerun
- `git diff --name-only HEAD~1` — pass: write-set only; on_fail: stop

Measurement between tasks (orchestrator): the probe in
[`batch-0/overview.md`](batch-0/overview.md#the-probe).

## Index

- [`decisions.md`](decisions.md) — D1–D7, **locked**
- [`batch-0/overview.md`](batch-0/overview.md) — probe and pre-change record (T0)
- [`batch-1/overview.md`](batch-1/overview.md) — `ArrowsRegular` (T1) ‖ Slot / transform (T2), parallel
- [`batch-2/overview.md`](batch-2/overview.md) — shape adapter, `SlotFinder`, reservations (T3)
- [`batch-3/overview.md`](batch-3/overview.md) — the transforming pass, unconsumed (T4)
- [`batch-4/overview.md`](batch-4/overview.md) — wire and measure (T5)
- [`batch-5/overview.md`](batch-5/overview.md) — close-out (T6)
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — the compress pass
- [`diagrams/component-map.md`](diagrams/component-map.md) — write-set map
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`settings.autonomous.json`](settings.autonomous.json) — permissions

## Progress

- [x] Batch 0 — T0
- [x] Batch 1 — T1, T2
- [x] Batch 2 — T3
- [x] Batch 3 — T4
- [x] Batch 4 — T5 (resumed 2026-09-10 after the stop-11 amendment)
- [x] Batch 5 — T6

## Close-out — 2026-09-10

Executed on `feat/activity-klimt-compress` (T0–T6, 7/7). Halted once at T5 on
stop 11; the human amended it (a new overlap counts only between two shapes
that both occupy on the moved axis — `Worm.java:159-168`,
`UGraphicCompressOnXorY.java:100-112`) and T5 resumed from `akc/T5-wip`.
Two orchestrator review fixes landed on the way: `c744c255` (lane titles
occupy on Y through the ON_X compressor's `CenteredText` expansion) and
`99c473c4` (`overlaps()` measured text boxes from the top, not the baseline).

### Exit bar, scored

| bar | result |
|---|---|
| Σ `weightedScore` falls against 42511 | **NOT MET: 42511 → 52954 (+24.6%)**, subset 6752 → 8709. The rise is T1's alone (+10445): `ArrowsRegular` makes our heads pair per index with the jar's (up to 8 diffs each instead of one count mismatch) and every tip stays offset by the unported root margin. T5 moved the score −2 against the post-T1 state (6 rose / 14 fell / 248 unchanged). |
| `rect[]/@x`, `text[]/@x`, `line[]/@x1`/`@x2`, `svg/@width` fall | **NOT MET on the score** (920, 1455, 2705 / 2704, 266 → 265): the comparator is blind to magnitude. **Met on magnitude**: mean \|ours − jar\| over the 32 fork/split fixtures `rect@x` 57.65 → 22.04 px, `text@x` 95.04 → 38.57, `line@x1` 170.03 → 108.03, `svg@width` 106.72 → 38.56; y families flat. `polygon[]/@points` 1722 → 230 (T1). `rect[]/@width` 149 → 132. |
| Zero unexplained rises | Met: 253 T1 risers (pre-named), 6 T5 risers each journaled (`racana` +9, `leduvi` +5, `cifafo` +3, `fatuzu` +2, `pujozo` +2, `sopape` +1 — small Y removals crossing the positional pairing). |
| Re-pinned baselines diffed, risers named | Met: diff 253 rose (T1 class) / 3 fell (strictuml, `ArrowsTriangle`); style census 176 moved (canvas only; 0 line-count or textCount changes; canvas width 36 toward / 48 away — the 48 were already narrower than the jar by 14–125 px for structures we do not draw, and our whitespace compressed as the jar's does); text census 20 moved (insets only); swimlane census on lane widths 18 closer / 6 farther / 36 same, 16 exact matches (farther: `maketa` and `rujuxa`/`lukoxa`/`samavi` = the parser lane-capture defect and the filed if-connector shape leaving whitespace beside our diamonds; `bideta` = the off-canvas arrowhead, widths unchanged; `ruzica` −2 on a lane already 48 off). |
| Sibling suites unmoved | Met: 23 files / 2167 passed / 1 pending at `fa578b8a` and at HEAD, identical per file. |
| Invariant test green on all 268 | Met (amended form): 0 throws, 0 hard violations, 7 allowed pairs pinned by fixture. |
| Four gates green | Met: typecheck, lint, build; `npm test` 708 files / 19572 passed. |

Targets: `zizaki` bar 103.4 wide with boxes at 24 / 68.7 (jar 28 / 72.7 −4
margin), `simuti` branches 10 apart, `bixefi` lane 3 158.175 and bar 148.175
— the jar's numbers exactly. `removed` over 268: x 5827.175 (85 fixtures),
y 2117 (160). Gate wall-clock median 5.003 s vs T0 4.40 s (max test 419 ms).

### Premises measured false

- Stop 11 ("no new overlap") is not a jar invariant for non-occupying
  shapes; amended.
- T3's brief grouped split lines with fork bars and cited `FtileIfDown`
  reservations for our `if`s; the Java says `ULine` (no occupancy) and a
  bypass route our walker never builds.
- T0 predicted `nomeco` Y −20 and `bixefi`/`pujozo` Y 0; the `while`
  reservation splits the gap (2) and the title band's ends reserve only 2 px
  (0 once titles occupy on Y).
- The exit bar's score reference: after T1 the comparator regime changed;
  the families cannot register a 57 → 22 px convergence.

### Follow-ons (filed in `planning/next-missions.md`)

`activity-arrows-triangle`, `activity-edge-label-width`,
`activity-branch-vertical-pitch`, `activity-off-canvas-arrowhead`; the
parser lane-capture defect now also owns the 7 pinned overlaps; `Recentred`
stays with `activity-canvas-margin`.

### Halt record (kept)


**Completed:** T0–T4 (batches 0–3) on `feat/activity-klimt-compress`, plus two
review fixes (`c744c255` lane titles occupy on Y; `99c473c4` `overlaps()`
text baseline). **Not landed:** T5 (parked at `e925560e` on `akc/T5-wip`,
uncommitted-to-mission), T6.

**Why halted.** T5's invariant test (stop 11) finds 7 new overlaps after
compression on 5 fixtures. Verified by the orchestrator against the Java:
every pair includes a shape that does not occupy on the axis that moved it —
`polygonSkipMode:'x'` cross-lane heads (`Worm.java:159-168`) or a lane title
re-centred by `UGraphicCompressOnXorY.java:100-112`. The jar moves those by
design; the collisions come from the filed parser lane-capture defect. Stop 11
as written is still triggered, so the mission stops here.

**Exit bar at the halt (T5 measurement):** aggregate 52956 → 52954 against
the post-T1 reference (T1's pre-named polygon rise was +10445), so Σ is
**52954 vs 42511** and did not fall; `rect[]/@width` 149 → 132, other x
families flat; the three target fixtures match exactly; laned census 14
closer / 1 same / 2 farther; 0 throws; gate median 5.003 s.

**Decisions:** 22 journal rows (T0 4, T1 4, B1 3, T2 review 1, T3 8+1, B2 3,
T4 review, B3 2, T5 4 on the WIP branch, halt 4). Flagged for review: the
stop-11 amendment (journal, "T5 halt" rows) and the exit-bar reference.

**Quality gates at the halt (mission branch `99c473c4`):** typecheck, lint,
build green; `npm test` 707 files, the activity ratchet the only red file
(253, T1's pre-named risers, re-pinned at T6).

**Follow-ons to file at T6:** `ArrowsTriangle` (strictuml, 3 fixtures);
the renderer's edge-label width approximation; the in-branch vertical
spacing gap (`zizaki` 52 vs 67); the parser lane-capture defect now blocking
both the invariant and the laned census; `Recentred`.
