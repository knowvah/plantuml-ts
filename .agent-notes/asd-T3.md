# asd-T3 — the live activity sizer

## Observation: `activity-layout-helpers.ts` and its cluster are not on the render path

- **Context**: applying the mission brief's T3 exactly as written, then
  measuring.
- **Finding**: aggregate `weightedScore` moved 61677 → 61677, 0 of 268
  fixtures. `activityPlugin.layoutSync` calls `layoutActivity` from
  `layout/tile-layout.ts` (`index.ts:10,25`), which builds the `Gtile*`
  classes in `src/diagrams/activity/tiles/`; each sizes itself in its own
  constructor. `activity-layout-helpers.ts` is imported only by
  `layout.old.ts` and its nine `activity-layout-*.ts` siblings (~2049 LOC),
  and the live path imports `layout.old.ts` for TYPES ONLY
  (`layout/tile-layout.ts:30`, `layout/tile-coordinates.ts:2`). That cluster
  is kept alive solely by `tests/unit/activity/layout.test.ts:9`.
- **Impact**: any future work on activity geometry must target
  `src/diagrams/activity/tiles/`. Editing the old cluster is a silent no-op
  — it typechecks, it passes its own tests, and it changes no output. Filed
  for a separate mission; deleting it means rewriting `layout.test.ts`.
- **Confidence**: High — measured, and the import graph is `import type`
  on both live edges.

## Observation: three of the six live font sites carried the same unsourced `- 2`

- **Context**: mapping each `Gtile` to its upstream StyleSignature.
- **Finding**: `gtile-diamond.ts:17`, `gtile-note.ts:20`, `gtile-spot.ts:31`
  and `gtile-label.ts:23` all measured at `theme.fontSize - 2`. Against the
  Java, the four want four DIFFERENT sizes: diamond 11
  (`plantuml.skin:370`), note 13 (`:323`), spot and label the inherited root
  14. The single expression was wrong in three different directions at once
  — and for the note it was wrong in SIGN: the jar draws note text LARGER
  than action text, not smaller.
- **Impact**: `- 2` reads like a deliberate relative offset. It was one
  constant standing in for four unrelated upstream declarations, which is
  why it survived so long — it is close enough to look considered.
- **Confidence**: High.

## Measured effect of T3

| quantity | before | after |
|---|---|---|
| aggregate `weightedScore` (268) | 61677 | **61644** (−0.05%) |
| fixtures risen | — | **0** |
| fixtures fallen | — | 16 |
| font-size histogram (ours) | `{14: 1577, 10: 4, 19: 4, 8: 3}` | unchanged |
| `textCount` (ours) | 1588 | unchanged |
| censuses moved | — | 120 of 268 |
| canvas exact match vs jar | 0 of 268 | 0 of 268 |

The histogram is unchanged **because T3 is the sizer**: the renderer still
writes `theme.fontSize` into the `font-size` attribute, which is T5/T6's
line. What moved is geometry — 120 canvases. `textCount` holding exactly is
T0's tripwire behaving as designed: a line-advance change moves positions
and box heights, never element counts.

The −0.05% is small against the 61677 floor, and that is expected rather
than disappointing: `svg/g[][childCount]` short-circuits hold 91.6% of the
weight (`element-baseline.json`), so no measurement change can move much of
it until the structure aligns. Zero risers is the load-bearing number here.

## Sizer ↔ renderer parity audit (activity), per `planning/sizer-renderer-parity.md`

Applied to the live path only. `threaded` = both sides read the same
resolved value; `GAP` = the renderer reads it and the sizer does not.

| setting | sizer | renderer | verdict |
|---|---|---|---|
| `activity` FontSize | `gtile-action.ts` | `activity-renderer-shapes.ts#renderMultilineText` — still `theme.fontSize` | **GAP — T5 closes it** |
| `diamond` FontSize | `gtile-diamond.ts` | `renderDiamond`/`renderHexagon` — still `theme.fontSize` | **GAP — T5** |
| `note` FontSize | `gtile-note.ts` | note text — still `theme.fontSize` | **GAP — T5** |
| line ADVANCE (1.0×) | `gtile-action.ts` (this task) | `renderMultilineText` (`aeg` T3) | `threaded` — the two now agree, which is D6's whole point |
| `arrow` LineThickness | n/a | `renderer.ts` — still 1.5 | `size-neutral` for the sizer (an edge stroke does not resize a tile) — **T6** |
| `swimlane` FontSize | lane chrome, `renderer.ts` | `renderer.ts` | **GAP — T6** |
| `activity` RoundCorner | n/a (corner radius draws inside the box) | `ACTION_RX = 8`, unsourced | `size-neutral` — **T5** |

Nothing new surfaced beyond what T5 and T6 already own. The one item worth
naming: **every renderer-side font is still `theme.fontSize`**, so between
this commit and T5 the sizer and renderer disagree on SIZE while agreeing on
ADVANCE. That is a deliberate, transient state of this batch, not a new
defect — and it is why the font-size histogram above did not move.
