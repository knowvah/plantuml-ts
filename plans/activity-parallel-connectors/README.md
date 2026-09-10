# Mission: `activity-parallel-connectors`

**Branch:** `feat/activity-parallel-connectors` · **Planned:** 2026-09-10 ·
**Baseline commit:** `b7c293c6` (main, clean, all four gates green:
701 test files / 19385 tests; aggregate activity `weightedScore` **43977**;
the 32 split/fork fixtures **8218**)

## Objective

Port the fork/split half of upstream's parallel builders
(`ftile/vcompact/ParallelBuilderFork`, `ParallelBuilderSplit`,
`AbstractParallelFtilesBuilder`) the way the jar draws it BEFORE its
compression pass: every branch connected by a vertical drop at its own
in/out x, gated on whether it has an out point; a 6-high black block for
fork and a 1.5-high thin line for split, each spanning what upstream spans;
the builder's own 14/20 margins in place of this port's unsourced
`BAR_OVERHANG 10` / `NODE_MARGIN_X 40`; and the `+4`/`−14` cross-lane
elbows. This retires the bar-centre elbow that made
`routing/gconnection-side-then-vertical-then-side.ts:6`'s exact float
equality matter (the filing that named this mission), and it does so by
mirroring upstream structure, not by adding a tolerance.

## What was measured before planning

| finding | number |
|---|---|
| zero-length segments at HEAD, ours | 2, on `simuti-16-lece058` (+2 over its pin) |
| near-zero segments in the JAR goldens | 7, on 3 fixtures (`jupoxe`, `racana`, `sopape`) — upstream keeps them |
| split/fork baseline fixtures | 32 (18 split, 17 fork; 17 with lanes; 21 with a detach/stop inside) |
| their residual | 8218 of 43977 (18.7%): `childCount` 3733, line families ~2390, `polygon/@points` 313 |
| the jar's box gap on `simuti` | 10 px = upstream's 28 px margins minus `CompressionXorYBuilder`'s `smaller(5.0)` removal — **C2, not this mission** |

## Exit bar

- Aggregate `weightedScore` over the 268 fixtures **falls**, stated against
  **43977**; the 32-fixture subset stated against **8218**
- The subset's `line[]/@x1..y2` and `polygon[]/@points` families fall;
  `svg/g[][childCount]` on the 21 detach fixtures falls (no join edge for a
  branch without an out point)
- **Zero UNEXPLAINED rises.** The one pre-named mechanism is T4's
  uncompressed packing (28 px where the jar shows 10); every other rise needs
  its own instrumented journal row before its commit
- Every re-pinned baseline is **diffed** and every pin that ROSE is named
- Sequence, state, class, description and json suites **unmoved**, with counts
- All four gates green: `npm test`, `npm run typecheck`, `npm run lint`,
  `npm run build`

## What this mission does NOT do

- Does not port `klimt/compress` (C2: `CompressionXorYBuilder`, `SlotFinder`,
  `SlotSet`, `CompressionTransform`, `PiecewiseAffineTransform`,
  `UGraphicCompressOnXorY`, ~1185 lines) — the jar's final packing and the
  lane-clipped bar widths are its outputs and stay a recorded delta
- Does not touch if/while/repeat/switch connectors (upstream's
  `ConnectionHorizontalThenVertical` leaves the diamond's side; ours leaves
  its bottom) — filed
- Does not touch lane origins or lane widths (`computeLaneOrigins`,
  `swimlane-context.ts`), `src/core/**`, or the `ActivityEdgeGeo` /
  `ActivityNodeGeo` shapes
- Does not edit `layout.old.ts` or any `activity-layout-*.ts` (the superseded
  engine, off the render path)

## Stop conditions

1. A task needs a file outside its write-set AND outside every other task's
2. Two consecutive gate failures on the same check
3. A decision in [`decisions.md`](decisions.md) is contradicted by the Java —
   amend there and halt, never silently override
4. **A constant cannot be sourced** to a Java `file:line`: the 14, the 20,
   the 6, the 1.5, the `+4`, the `−14`. Fitting is forbidden; the 10 px gap
   may never be written down as a margin
5. A write-set names `layout.old.ts` or any `activity-layout-*.ts`
6. **T1 moves the aggregate at all** — pure threading; 43977 exactly
7. **A fixture rises and its mechanism cannot be stated before the commit**
8. Any sibling conformance suite moves by even one test
9. A task needs `src/core/**`, a shared `svg.ts` helper, or the Geo shapes
10. **T5 needs to change lane origins or widths** — edges move, lanes never
11. **Any part of `klimt/compress` is ported to make a number match** — C2

## Push forward

Equivalent spellings and file organisation (a sibling module when a file
would cross the 500-line hook — `tile-coordinates.ts` is at 492); adopting
an instrumented riser with a journal row before the commit; re-pinning a
test that pinned the old model (bar-centre elbow, `BAR_OVERHANG 10`,
`NODE_MARGIN_X 40`, `BAR_HEIGHT 8`, rect split bars) when the new value
carries its citation; a composite tile whose Java withholds an out point in
some case — T1 defaults it to `true`, files the citation, moves on; filing
an out-of-scope defect with measured weight; regenerating `docs/catalog.md`
on drift; the fork link-label margins ported as functions that receive 0.

## Quality gates

- `npm test` — pass: exit 0, `Test Files` ≥ 701 (fewer = `coverage/.tmp`
  under-collect: confirm with `npx vitest run --coverage.enabled=false
  --reporter=json`, which lists every file); on_fail: fix_and_rerun
- `npm run typecheck` — pass: exit 0; on_fail: fix_and_rerun
- `npm run lint` — pass: exit 0; on_fail: fix_and_rerun
- `npm run build` — pass: exit 0; on_fail: fix_and_rerun
- `git diff --name-only HEAD~1` — pass: write-set only; on_fail: stop

Measurement between tasks (orchestrator): the subset probe in
[`batch-0/overview.md`](batch-0/overview.md#the-probe).

## Index

- [`decisions.md`](decisions.md) — D1–D7, **locked**
- [`batch-0/overview.md`](batch-0/overview.md) — subset probe (T0)
- [`batch-1/overview.md`](batch-1/overview.md) — `Tile.hasPointOut()` (T1)
- [`batch-2/overview.md`](batch-2/overview.md) — connectors + dedupe (T2)
- [`batch-3/overview.md`](batch-3/overview.md) — bars (T3)
- [`batch-4/overview.md`](batch-4/overview.md) — pre-compression geometry (T4)
- [`batch-5/overview.md`](batch-5/overview.md) — cross-lane elbows (T5)
- [`batch-6/overview.md`](batch-6/overview.md) — close-out (T6)
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — the fork coordinate pass
- [`diagrams/component-map.md`](diagrams/component-map.md) — write-set map
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`settings.autonomous.json`](settings.autonomous.json) — permissions

## Progress

- [x] Batch 0 — T0
- [x] Batch 1 — T1
- [ ] Batch 2 — T2
- [ ] Batch 3 — T3
- [ ] Batch 4 — T4
- [ ] Batch 5 — T5
- [ ] Batch 6 — T6
