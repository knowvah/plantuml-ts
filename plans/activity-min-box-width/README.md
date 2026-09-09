# Mission: `activity-min-box-width`

**Branch:** `feat/activity-min-box-width` · **Planned:** 2026-09-09 ·
**Baseline commit:** `8aad71eb` (main, clean, all four gates green:
698 test files / 18933 tests; aggregate activity `weightedScore` **48291**)

## Objective

Remove the port's unsourced 120px action-box width floor and correct the
action box's own text placement, text colour and stroke — four measured
defects in one shape, each landed as its own task so every move is
attributable — measured against the activity oracle corpus.

## The four defects, measured at the baseline

| # | defect | residual weight | upstream |
|---|---|---|---|
| 1 | `ACTION_MIN_WIDTH = 120` (`tiles/gtile-action.ts:16`) | `rect/@width` 821; removing it alone: 48291 → 47638 (−1.35%), 207 fall, **2 rise** | `FtileBox.java:237-243` `atLeast(minimumWidth, 0)`; unset = 0 (`ValueNull.java:61-63`) |
| 2 | every text `text-anchor="middle"` at the centre | `text/@text-anchor` 1253, `text/@x` 1427 | `FtileBox.java:220-233` LEFT at `padding.left`; root `HorizontalAlignment left` (`plantuml.skin:12`); the jar never emits `text-anchor` |
| 3 | text fill `theme.colors.text` (#181818) | `text/@fill` 1288; jar `#000` on 1869 of 1915 texts | root `FontColor black` (`plantuml.skin:9`) |
| 4 | action rect stroke 1 | `rect/@stroke-width` 846; jar 0.5 | `element { LineThickness 0.5 }` (`plantuml.skin:91-93`), file-order overwrite (`StyleStorage.java:102-116`) |

The two risers under the floor's removal — `simuti-16-lece058` 217→228
and `xenofo-81-rame803` 157→167, both `split … detach` — grow their
`svg/g[][childCount]` term. A width change cannot move an element COUNT
without a structural cause; T2 diagnoses it before it commits.

## Exit bar

- Aggregate `weightedScore` over the 268 comparable fixtures **falls**,
  stated against **48291**
- `rect[]/@width` (821), `text[]/@text-anchor` (1253), `text[]/@fill`
  (1288), `rect[]/@stroke-width` (846) — each restated; the anchor family
  should reach zero
- **Zero UNEXPLAINED rises.** A rise with an instrumented mechanism, named
  in the journal before its commit lands, is permitted
- Every re-pinned baseline is **diffed** and every pin that ROSE is named
- Sequence, state, class, description and json suites **unmoved**, with counts
- All four gates green: `npm test`, `npm run typecheck`, `npm run lint`,
  `npm run build`

## What this mission does NOT do

- Does not touch the swimlane chrome, lane widths, the canvas margin, the
  note/creole paths, nested-split geometry, or the 82 `status:"error"`
  fixtures
- Does not edit `src/core/**`: activity only CALLS the shared resolvers and
  text helpers (stop condition 9)
- Does not edit `layout.old.ts` or the nine `activity-layout-*.ts` files —
  the superseded engine is off the render path (stop condition 5)

## Stop conditions

1. A task needs a file outside its write-set AND outside every other task's
2. Two consecutive gate failures on the same check
3. A decision in [`decisions.md`](decisions.md) is contradicted by the Java
   — amend there and halt, never silently override
4. **A constant cannot be sourced** to `plantuml.skin:NNN` or a Java
   `file:line` — the 0, the 0.5, the `left`, the black. Fitting is forbidden
5. A write-set names `layout.old.ts` or any `activity-layout-*.ts`
6. **T1 moves the aggregate at all** — it is pure threading; 48291 exactly
7. **A fixture rises and its mechanism cannot be stated before the commit.**
   For T2 specifically: if the `split … detach` rise is a real structural
   defect in the fork/split tiles, that is a separate mission, not a T2 fix
8. Any of the sequence, state, class, description or json conformance
   suites moves by even one test
9. **T5 needs to change `src/core/svg.ts` or any shared text helper's
   contract** — activity calls shared helpers, never re-shapes them

## Push forward

Equivalent spellings and file organisation (a new sibling module when a
file would cross the 500-line hook limit); adopting an instrumented riser
with a journal entry; updating a pre-existing test that pinned the old
model (120 floor, `text-anchor="middle"`, `#181818`, stroke 1) when the new
behaviour carries its citation; filing an out-of-scope defect with measured
weight; regenerating `docs/catalog.md` on drift; per-line vs per-block x
for a multi-line label once the creole `Sheet` Java is read and cited.

## Quality gates

- `npm test` — pass: exit 0, `Test Files` ≥ 698 (fewer = `coverage/.tmp`
  under-collect, re-run); on_fail: fix_and_rerun
- `npm run typecheck` — pass: exit 0; on_fail: fix_and_rerun
- `npm run lint` — pass: exit 0; on_fail: fix_and_rerun
- `npm run build` — pass: exit 0; on_fail: fix_and_rerun
- `git diff --name-only HEAD~1` — pass: write-set only; on_fail: stop

Measurement between tasks (orchestrator): the aggregate probe in
[`batch-0/overview.md`](batch-0/overview.md#the-probe).

## Index

- [`decisions.md`](decisions.md) — D1–D5, **locked**
- [`batch-0/overview.md`](batch-0/overview.md) — pin the text census (T0)
- [`batch-1/overview.md`](batch-1/overview.md) — unconsumed resolvers (T1)
- [`batch-2/overview.md`](batch-2/overview.md) — delete the floor (T2)
- [`batch-3/overview.md`](batch-3/overview.md) — the `element` stroke tier (T3)
- [`batch-4/overview.md`](batch-4/overview.md) — text colour (T4)
- [`batch-5/overview.md`](batch-5/overview.md) — text positioned by x (T5)
- [`batch-6/overview.md`](batch-6/overview.md) — close-out (T6)
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — where each value is lost
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
