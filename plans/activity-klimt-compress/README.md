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
11. **The invariant test finds a new overlap** after compression on any fixture
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
- [ ] Batch 2 — T3
- [ ] Batch 3 — T4
- [ ] Batch 4 — T5
- [ ] Batch 5 — T6
