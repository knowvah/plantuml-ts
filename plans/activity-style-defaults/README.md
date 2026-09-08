# Mission: `activity-style-defaults`

**Branch:** `feat/activity-style-defaults` · **Planned:** 2026-09-08 ·
**Baseline commit:** `5bd96186` (main, clean tree, all four gates green)

## Objective

Wire the activity engine to the **per-element style cascade it currently
ignores**. Upstream resolves a distinct `FontSize`, `LineThickness` and
`RoundCorner` for each activity element kind from
`plantuml.skin:358-385`'s `activityDiagram { }` block. We apply the
diagram-wide root default (`plantuml.skin:10`, `FontSize 14`) to all of it.

Nothing under `src/diagrams/activity/` calls `resolveElementFontSize` or
`resolveElementLineThickness` (`src/core/theme-element-resolve.ts`,
re-exported from `src/core/theme.ts:568`) — the seam
`src/diagrams/description/layout.ts:21,362` already consumes.

This is the successor `activity-element-granularity` named in its own
[D5]: *"Does not change font size. Ours 14 vs the jar's 12 is a theme
default, not element granularity."*

## The measurement

Font-size census over a 200-fixture window of
`test-results/dot-cache/activity/`, jar goldens vs our render:

| font-size | jar | ours |
|---|---|---|
| `12` (activity) | 1195 | 0 |
| `11` (diamond, arrow) | 461 | 0 |
| `18` (swimlane) | 80 | 0 |
| `13` (note) | 62 | 0 |
| `14` (root default) | 45 | **952** |

We emit a flat 14 where the jar resolves a per-element size.

## Upstream spec — read it, do not trust this table

`~/git/plantuml/src/main/resources/skin/plantuml.skin:358-385`:

```
activityDiagram {
	activity  { Padding 10; FontSize 12; RoundCorner 25 }
	composite { LineColor black; BackgroundColor transparent; LineThickness 1.5 }
	diamond   { FontSize 11 }
	arrow     { FontSize 11; LineThickness 1 }
	circle    { start, stop, end { LineThickness 1; LineColor #2; BackgroundColor #2 }
	            end { LineThickness 1.5 } }
	activityBar { BackgroundColor #5 }
}
```

Plus the root-level blocks activity inherits: `note { FontSize 13;
LineThickness 0.5 }` (`:317-321`) and `swimlane { FontSize 18; LineColor
black; LineThickness 1.5 }` (`:308-313`). The `activityDiagram { arrow {
FontSize 11 } }` override **beats** the root `arrow { FontSize 13 }`
(`:316`).

## The SECOND defect, same files

The renderer advances text lines at exactly **1.0×** font size, with an
upstream citation (`activity-renderer-shapes.ts:33-42`,
`StringBounderFromWidthTable.java:71` — *"the returned height is `size`,
unconditionally"*). The sizer still uses **1.4×**
(`activity-layout-helpers.ts:44,62`).

The sizer over-reserves 40% of the height of every multi-line action and
note. This is the recurring class `planning/mission-guide.md` names —
*"a feature reaches the renderer and the sizer keeps measuring something
else"* — and `planning/sizer-renderer-parity.md` is its reusable audit.
In scope, confirmed at planning ([D6]).

## Why this ranks above the bigger-looking families

`oracle/goldens/svg-activity/diff-census.json` (measured 2026-09-03 at
`53942ff7`; Σ`weightedScore` **61677** over 268 comparable fixtures):

| path | weight | share | fixtures | relation to this mission |
|---|---|---|---|---|
| `svg/g[][childCount]` | 24588 | 39.87% | 206 | partly downstream |
| `svg/g[]/line[]/@x1,@x2,@y1,@y2` | ~9343 | 15.1% | 256 | downstream of box sizing |
| `svg/g[]/text[]/@x,@y` | 2640 | 4.28% | 264 | downstream of measurement |
| `svg/g[]/line[]/@stroke-width` | 2319 | 3.76% | 256 | **direct** — arrow `LineThickness 1` |
| `svg/g[]/text[]/@font-size` | 1316 | 2.13% | 263 | **direct** |

Font size is upstream of text width → box width → canvas size → every edge
coordinate. On `bakopu-96-pudu086` we render **482×382** against the jar's
**327×280**. The directly-attributable share is ~6%; the share it *feeds*
is most of the rest.

## Exit bar

- Aggregate `weightedScore` over the 268 comparable fixtures **falls**, and
  the fall is stated against the `61677` starting figure
- `svg/g[]/text[]/@font-size` and `svg/g[]/line[]/@stroke-width` each have
  their post-mission weight restated against 1316 / 2319
- The font-size histogram of our render is restated against the jar's
- **Zero fixtures rise** against T0's pin; any rise is named with a mechanism
- Both filed follow-ons are resolved or explicitly re-scoped with a reason:
  `activity-diamond-font-skinparams`, `activity-edge-stroke-width`
- Sequence, state, class, description and json conformance suites **unmoved**
- All four gates green: `npm test`, `npm run typecheck`, `npm run lint`,
  `npm run build`

## What this mission does NOT do

- **Does not restructure swimlane drawing.** It may wire `FontSize 18`, but
  the divider-line-vs-header visual model is `activity-swimlane-rendering`,
  filed separately ([D7]).
- **Does not seed shared SNames.** `theme.colors.elements` is a **flat**
  map — `style-map-element.ts:76-85` collapses `<diagramType>.<sname>` to
  the bare `sname` — so a global `elements.arrow.fontSize = 11` would move
  description, class and state arrows. See [D2]; this is the mission's
  central design constraint.
- **Does not chase `style=` vs presentation attributes.**
  `normalize.ts:13-15` expands `style="k:v"` into attributes before
  comparing; work there measures nothing.
- **Does not add an activity DOT gate.** Upstream `activitydiagram3` never
  uses dot — verified at the oracle-harness close-out ([D9] there).
- **Does not touch** `activity-note-after-terminal`,
  `activity-note-width-overscan`, `activity-nested-split-geometry`,
  `activity-embedded-diagram-labels`, or `activity-parser-gaps` (the 82
  `status:"error"` fixtures). Each is filed and separately owned.

## Index

- [`decisions.md`](decisions.md) — D1–D9, **locked**
- [`batch-0/overview.md`](batch-0/overview.md) — pin the floor (T0)
- [`batch-1/overview.md`](batch-1/overview.md) — the seam (T1)
- [`batch-2/overview.md`](batch-2/overview.md) — resolution module (T2)
- [`batch-3/overview.md`](batch-3/overview.md) — sizer (T3, T4)
- [`batch-4/overview.md`](batch-4/overview.md) — renderer + re-pin (T5, T6, T7)
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — where the size is lost
- [`diagrams/component-map.md`](diagrams/component-map.md) — write-set map
- [`decision-journal.md`](decision-journal.md) — appended during execution

## Progress

- [x] Batch 0 — T0
- [x] Batch 1 — T1
- [x] Batch 2 — T2
- [x] Batch 3 — T3, T4
- [x] Batch 4 — T5, T6, T7

---

## Close-out — 2026-09-08

Executed on `feat/activity-style-defaults` from baseline `5bd96186`. Eight
tasks, five batches, all landed. **Two halts, both resolved by the human**
(D3a, and the T3 re-scope); both are recorded in
[`decisions.md`](decisions.md) and [`decision-journal.md`](decision-journal.md).

### Exit bar — scored

| bar | result |
|---|---|
| Aggregate `weightedScore` **falls**, stated against `61677` | ✅ **61677 → 52565, −14.77%** over the same 268 fixtures |
| `svg/g[]/text[]/@font-size` restated against `1316` | ✅ **1316 → 291, −77.9%**; 263 → 120 fixtures |
| `svg/g[]/line[]/@stroke-width` restated against `2319` | ✅ **2319 → 143, −93.8%**; 256 → 55 fixtures |
| Font-size histogram restated beside the jar's | ✅ below |
| **Zero fixtures rise** against T0's pin; any rise named with a mechanism | ⚠️ **14 rose, every one named with a mechanism** (see below) — the bar as written was not met; the escape clause was |
| Both filed follow-ons resolved or re-scoped with a reason | ✅ `activity-edge-stroke-width` **closed**; `activity-diamond-font-skinparams` **partially resolved and re-scoped** |
| Sequence, state, class, description, json suites unmoved | ✅ 5 files, **1564 tests**, all passing |
| All four gates green | ✅ `npm test` 693 files / 18737 tests, typecheck, lint, build |

### The histogram, ours beside the jar's

`font-size` over every `<text>`, 268 fixtures:

| size | ours (before) | ours (after) | jar |
|---|---|---|---|
| `12` activity | 0 | **1008** | 996 |
| `11` diamond, arrow | 0 | **258** | 614 |
| `18` swimlane | 0 | **140** | 135 |
| `13` note | 0 | **146** | 102 |
| `14` root | **1577** | 15 | 16 |

`stroke-width` over every `<line>` INVERTED: ours `{1.5: 2503, 1: 199}` →
`{1: 2610, 1.5: 90}`, against the jar's `{1: 2976, 1.5: 224, 2.5: 90, …}`.
`rx` over every `<rect>`: ours `{8: 915}` → `{12.5: 915}`, against the jar's
`{12.5: 929}`.

The remaining font gap is the **`11`** row — 258 against 614. Not chased:
those are branch labels and conditions in fixtures whose structure diverges
for reasons this mission scoped out.

### The 14 risers, and why the bar was written wrong

Two mechanisms, both instrumented rather than guessed:

1. **T4, 14 fixtures.** Deriving the box height made `rect/@height` exact
   (it disappears from 13 of the 14 diff lists) and so SHRANK the canvas —
   which was already short, because `LAYOUT_MARGIN = 12` against the jar's
   16 puts every rect at `12,12` instead of `16,16`. Filed as
   `activity-canvas-margin`.
2. **T5 (8) and T6 (5), overlapping the above.** `compareSvg` pairs
   elements POSITIONALLY. On a fixture whose draw order already diverges,
   correcting a value adds one more differing attribute to a pairing that
   was already wrong — a swimlane header paired against an action label
   ([D7]), a note drawn one position early (`activity-note-after-terminal`),
   an arrowhead paired against a `path`, a nested `split` at childCount 58
   vs 20.

**None of the 14 is a wrong value.** The exit bar demanded "zero rises"
from a mission that corrects values inside a structure known to be wrong;
that combination is not achievable, and the bar should have asked for zero
*unexplained* rises from the start. Every riser was adopted deliberately,
with its mechanism in the journal, before its commit landed.

### A premise this mission measured FALSE

**T3's write-set was on dead code.** `activity-layout-helpers.ts` and the
whole `layout.old.ts` cluster (~2049 LOC across ten files) are NOT on the
render path: `activityPlugin.layoutSync` calls `layoutActivity` from
`layout/tile-layout.ts`, which builds the `Gtile*` classes in `tiles/`, and
the live path imports `layout.old.ts` for **types only**. Applying the
brief's T3 verbatim moved the aggregate `61677 → 61677`, 0 of 268 fixtures.
The real sizer is `src/diagrams/activity/tiles/`, where the `1.4×` advance
and four separate `theme.fontSize - 2` expressions actually lived. The
cluster is kept alive by `tests/unit/activity/layout.test.ts` alone and is
filed for its own mission.

The brief was also wrong on one SName: it assigned the repeat/while
condition to `activity`; upstream assigns it `diamond`
(`gtile/GtileIfHexagon.java:184`, `gtile/GtileHexagonInside.java:64`,
`gtile/GtileRepeat.java:89`). The brief's own "verify each against
upstream's ftile" instruction is what caught it.

### Follow-ons filed, with measured weight

| mission | measured |
|---|---|
| `activity-canvas-margin` | the mechanism behind all 14 risers; flipped the corpus from too-tall (154/105) to too-short (198/69) |
| `activity-swimlane-line-thickness` | **51 of the 143** remaining `line/@stroke-width` units; one line, forbidden here by [D7] |
| `activity-min-box-width` | `ACTION_MIN_WIDTH = 120` vs upstream's `MinimumWidth` default of `0`; `cizixu-00-koro700` is 120 wide against the jar's 26.675 |
| `activity-layout-old-cluster` (see the journal) | ~2049 LOC of superseded engine, one test file holding it alive |
| `activity-diamond-font-skinparams` | re-scoped: the flat and `<style>` spellings work; the block-nested one needs key-normalization work spanning every diagram type |

### Where the weight is now

`svg/g[][childCount]` is **24911 of 52565 — 47.4%**, up from 39.9% as a
SHARE precisely because everything else fell. It is the next thing to
attack, and it is structural, not stylistic.
