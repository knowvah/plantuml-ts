# Mission: `activity-swimlane-rendering`

**Branch:** `feat/activity-swimlane-rendering` · **Planned:** 2026-09-09 ·
**Baseline commit:** `ac03ad31` (main, clean, all four gates green:
694 test files / 18741 tests)

## Objective

Replace the port's boxed-table swimlane header with upstream's
divider-line-and-floating-title model, **lay nodes out in their lanes at
all**, and wire the four swimlane skinparams.

## The three coupled problems

The filing described this as a visual-model swap. It is not. Measured on a
clean tree at `ac03ad31`:

1. **Nodes are never placed into lanes.** `ast.ts` carries `swimlane?:
   string` on every node kind and **no live tile reads it** — the two
   matches under `tiles/` are local re-declarations, not consumers.
   `walkTile` lays everything in one column and
   `tile-coordinates.ts:347-351` computes lane geometry as a decorative
   overlay from `root.width / laneCount`. On `pakema-21-xema183` our `:b;`
   sits at x=132, exactly ON the lane-2 boundary; the jar puts it at
   x=201.469, inside lane B.
2. **Lane widths are equal-division with an unsourced 120px floor.** The
   jar content-fits each lane: on the same fixture, lane A is 38.338 wide
   and lane B is 310.9, driven by the title's own `textLength=300.937`.
3. **The chrome is a different model.** See below.

These cannot be separated: content-fitted widths need per-lane content,
which needs (1); lane origins need widths, which needs (2). That ordering
is exactly why upstream runs `computeDrawingWidths` as its own pass.

## The jar's model — read the Java, do not trust this summary

Element-by-element from `test-results/dot-cache/activity/pakema-21-xema183/in.svg`:

| what | jar | ours today |
|---|---|---|
| title band | transparent rect, `fill="none" stroke:none`, h = max title height | filled box, `SWIMLANE_HEADER_H = 28` |
| dividers | one `<line>` per boundary **including both outer edges** — 3 for 2 lanes — full content height, `stroke:#000 stroke-width:1.5` | only BETWEEN lanes, and a horizontal separator the jar never draws |
| titles | drawn **last**, centred per lane, not bold, size 18 | drawn first, inside the band, bold |
| lane width | content-fitted | `max(120, root.width / n)` |

Upstream: `ftile/Swimlanes.java` (`:285-315` titles and band height,
`:357-377` the band rect and `CenteredText`, `:379-395`
`computeDrawingWidths`), `ftile/LaneDivider.java:55-100` (`drawU` draws one
`ULine.vline(height)` at `dx(x1)`), `plantuml.skin:309-314`.

## Skinparams — the filing's claim is wrong, here is the measurement

The filing says all four are "entirely unwired (grepped, zero matches)".
Measured: **`SwimlaneBorderColor` IS parsed** — aliased to
`swimlaneheaderbackgroundcolor` (`skinparam-key-handlers-table-b.ts
:259-261`), stored as `acc.swimlaneBorder`, threaded onto the theme, and
**read by nobody**. That is the second variant `planning/sizer-renderer-parity.md`
names: reaches the theme, never consumed. `SwimlaneBorderThickness`,
`SwimlaneTitleFontColor` and `SwimlaneTitleFontSize` are genuinely absent.

## Exit bar

- Aggregate `weightedScore` over the 268 comparable fixtures **falls**,
  stated against **52563**
- `svg/g[][childCount]` — currently **47.4%** of residual weight (24911) —
  restated; the band rect and divider count are childCount terms and this
  mission should move that family most
- **Zero UNEXPLAINED rises.** A rise with an instrumented mechanism, named
  in the journal before its commit lands, is expected and permitted. The
  predecessor mission's "zero rises" bar was unmeetable and is not repeated
- Every re-pinned baseline is **diffed** and every pin that ROSE is named
- Sequence, state, class, description and json suites **unmoved**, with counts
- All four gates green: `npm test`, `npm run typecheck`, `npm run lint`,
  `npm run build`

## What this mission does NOT do

- **Does not rework nested constructs across lanes.** If lane placement
  turns out to need if/while/fork spanning lanes reworked, that is stop
  condition 7 and a separate mission.
- **Does not touch** `activity-canvas-margin` (re-filed, still structural —
  upstream's margin is `same(10)`, not a constant to retune),
  `activity-note-*`, `activity-nested-split-geometry`,
  `activity-embedded-diagram-labels`, or the 82 `status:"error"` fixtures.
- **Does not edit** `layout.old.ts` or the nine `activity-layout-*.ts`
  files. That engine is off the render path; a write-set naming it is wrong
  by construction (stop condition 5).

## Stop conditions

1. A task needs a file outside its write-set AND outside every other task's
2. Two consecutive gate failures on the same check
3. A decision in [`decisions.md`](decisions.md) is contradicted by the Java
   — amend there and halt, never silently override
4. **A constant cannot be sourced** to `plantuml.skin:NNN` or a Java
   `file:line` — notably T4's lane padding. Fitting the golden is forbidden
5. A write-set names `layout.old.ts` or any `activity-layout-*.ts`
6. **T3 moves the aggregate `weightedScore` at all** — it is pure threading
7. Lane placement requires reworking nested constructs beyond threading

## Push forward

Equivalent spellings and file organisation; adopting an instrumented riser
with a journal entry; filing an out-of-scope defect with measured weight;
updating a pre-existing test that pinned the old model when the new
behaviour is upstream-sourced; regenerating `docs/catalog.md` on drift.

## Index

- [`decisions.md`](decisions.md) — D1–D5, **locked**
- [`batch-0/overview.md`](batch-0/overview.md) — pin the floor (T0)
- [`batch-1/overview.md`](batch-1/overview.md) — shared core skinparams (T1)
- [`batch-2/overview.md`](batch-2/overview.md) — resolver surface (T2)
- [`batch-3/overview.md`](batch-3/overview.md) — lane threading (T3)
- [`batch-4/overview.md`](batch-4/overview.md) — lane extents and widths (T4)
- [`batch-5/overview.md`](batch-5/overview.md) — origins and placement (T5)
- [`batch-6/overview.md`](batch-6/overview.md) — the chrome (T6)
- [`batch-7/overview.md`](batch-7/overview.md) — close-out (T7)
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — where the lane is lost
- [`diagrams/component-map.md`](diagrams/component-map.md) — write-set map
- [`decision-journal.md`](decision-journal.md) — appended during execution

## Progress

- [ ] Batch 0 — T0
- [ ] Batch 1 — T1
- [ ] Batch 2 — T2
- [ ] Batch 3 — T3
- [ ] Batch 4 — T4
- [ ] Batch 5 — T5
- [ ] Batch 6 — T6
- [ ] Batch 7 — T7
