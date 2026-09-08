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
- [ ] Batch 4 — T5, T6, T7
