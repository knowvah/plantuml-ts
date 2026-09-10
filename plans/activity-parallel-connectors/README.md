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
- [x] Batch 2 — T2
- [x] Batch 3 — T3
- [x] Batch 4 — T4
- [x] Batch 5 — T5
- [x] Batch 6 — T6

## Close-out (T6, 2026-09-10)

**Executed 7 of 7** (T0–T6) on `feat/activity-parallel-connectors`;
unmerged at close. One commit per task plus one `docs(apc-TN)` commit per
batch close. Notes in `.agent-notes/apc-T0.md` and `apc-T6.md`.

### Exit bar, scored

| bar | result |
|---|---|
| Aggregate falls, against 43977 | **42511, −3.33%**; 29 fell, 237 unchanged, 2 rose |
| The 32-fixture subset, against 8218 | **6752, −17.84%** |
| Subset `line[]/@x1..y2` fall | `@y1`/`@y2` 600/599 → 599/598; `@x1`/`@x2` 596/595 → **605/605 (rose)** — the C2 packing (28 vs 10), the filed lane-capture defect, and the comparator descending into fixtures it used to short-circuit on `childCount` (apc-T6 note); the gated score fell |
| Subset `polygon[]/@points` falls | 313 → **300** |
| `childCount` on the detach fixtures falls | the 11 with a terminator inside a branch: 2026 → **1027**; the subset 3733 → 2116 |
| Zero UNEXPLAINED rises | two rises, `bixefi` 181 → 220 and `gesogi` 242 → 248, each journaled with a mechanism before its commit; the T2 agent's stated mechanism for 12 risers was disproved by measurement and corrected in the journal (draw order of the join bar) before T3 |
| Every re-pin diffed, every risen pin named | five baselines diffed: `diff-baseline` 2 risen (above); `style` 32 moved, 8 line counts moved away from the jar's (loop-label gap, filed); `swimlane` 17 moved, dividers 12 closer / 5 farther (lane-capture + C2 clip); `text` 5 moved one inset bucket; the jar side moved on none |
| Sequence, state, class, description, json unmoved | 23 files / 2167 passed + 1 skipped at `b7c293c6` and at HEAD, identical per file |
| Four gates green | typecheck 0, lint 0, build ok, `npm test` 701 files / 19441 passed + 2 skipped + 1 todo (after `rm -rf coverage/.tmp`; the first run under-collected to 693 and carried one interference failure in `json-style` that passes alone at both commits) |

### Premises measured false or incomplete

- **D5's "any branch has one" is split-only**: the fork's join bar is an
  unconditional `FtileBlackBlock` and never `FtileKilled`
  (`ParallelBuilderFork.java:110-131`). Amended at T1, flagged.
- **D4 omitted the `first..last` clamp**: both split steps clamp to the
  composite's own left (`ParallelBuilderSplit.java:104-109, 171-176`), so a
  partially detached split's join line always reaches the centre.
- **The brief's "21 detach fixtures" is 11**: only 11 of the 32 have a
  terminator inside a branch; the other 10 `stop` after the join.
- **Draw order is scored**: our join bar was emitted before the branches;
  upstream draws it after (`:101`, `:117`). Invisible until T2 removed the
  `childCount` short-circuit, then +85 `rect[]` on `zizaki` alone.
- **T3's test write-set pointed at the wrong file**: the bar pins live in
  `renderer.test.ts`, `layout.test.ts`, `tile-layout.test.ts`, not
  `renderer-shapes.test.ts`.
- **The fork/split's parsed lane is the last branch's**
  (`node-dispatch.ts:261/:291`), so 5 laned fixtures' bars sit in the wrong
  lane; filed with a measured throwaway fix (+19 net, `jevoce` +230).

### Follow-ons (measured weight at HEAD; filed in `planning/next-missions.md`)

- C2 `klimt/compress` — 18 px per gap on every multi-branch fixture; the
  lane-clipped bar width; `childCount` still 42% of the aggregate
- fork/split lane capture in the parser — `bixefi` −101 alone, `jevoce` +230
- if/switch connector shape — every if/switch fixture's `line[]` families
- loop-label line gap — count-only, `camavo`-class
- fork bar stroke — `rect[]/@stroke` + `@stroke-width` 35 + 35 on the subset
