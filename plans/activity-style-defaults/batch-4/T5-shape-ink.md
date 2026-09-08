# T5 — Resolved font, corner radius and circle ink in the shapes

**Agent:** `typescript-pro`
**Depends on:** T2, T3

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification — **read the method body**.
Read [`../README.md`](../README.md) and [`../decisions.md`](../decisions.md);
[D1], [D4] and [D5] govern this task and are locked.

`activity-renderer-shapes.ts` draws every element at `theme.fontSize`, uses
`rx="8"` with no `ry`, and draws the start/stop ellipse with a fill and no
stroke.

## Read-set

- `src/diagrams/activity/activity-renderer-shapes.ts` (484 lines)
- `src/diagrams/activity/activity-style-defaults.ts` (T2's output)
- `src/diagrams/activity/activity-layout-helpers.ts` (T3's output — the
  renderer must draw at the size the sizer measured)
- `~/git/plantuml/src/main/resources/skin/plantuml.skin:317-321, 358-385`
- `test-results/dot-cache/activity/bakopu-96-pudu086/in.svg` — a concrete
  golden showing `rx="12.5" ry="12.5"`, note text at 13, activity text at
  12, and the start ellipse's `fill="#222"` + `stroke:#222;stroke-width:1`

## Write-set

- `src/diagrams/activity/activity-renderer-shapes.ts`
- `tests/unit/activity/activity-renderer-shapes.test.ts`

## Task

1. Every `theme.fontSize` becomes the T2 resolver for that shape's own
   SName — the SAME SName T3 assigned that shape in the sizer. Sizer and
   renderer must agree; that agreement is this mission's second defect and
   must not be reintroduced.
2. Delete the `theme.fontSize - 2` at line 245 — the diamond's size is 11
   from the skin, not `14 - 2`.
3. `rx` and `ry` both come from `activityRoundCorner(...) / 2` ([D4]). The
   literal `8` is deleted.
4. The start/stop/end circle draws its `LineThickness 1` stroke and its
   `#2`-resolved `LineColor` / `BackgroundColor` ([D5]). `end` takes
   LineThickness 1.5.
5. The note draws `LineThickness 0.5` (`plantuml.skin:320`).

## Boundaries

**Always:** cite `plantuml.skin:NNN` for every number.
**Never:** write `'#222'`, `12.5`, `13`, `0.5` or any other value as a bare
literal in this file — each comes from T2's module. **Never** fit to a
golden.
**Ask first (halt and journal):** if a shape's SName is ambiguous, or if
sizer and renderer would end up disagreeing.

## Acceptance criteria

- Given the default theme, when an activity node renders, then its `<text>`
  carries `font-size="12"` and its `<rect>` carries `rx="12.5" ry="12.5"`
- Given the default theme, when a note renders, then its `<text>` carries
  `font-size="13"` and its outline carries `stroke-width="0.5"`
- Given the default theme, when a `start` renders, then its `<ellipse>`
  carries both a fill and a stroke resolved from `#2`
- Given any shape, when rendered, then the font size it draws equals the
  font size T3's sizer measured for the same shape — assert this directly,
  not by eye
- Given the activity ratchet, when run, then no fixture rises against T0's
  pin, or every riser is named with a mechanism

## Quality bar

All four gates green: `npm test` (full suite), `npm run typecheck`,
`npm run lint`, `npm run build`. `src/core/svg-shapes.ts` must be
**unchanged** — sequence and json share it.

## Commit

`fix(asd-T5): draw activity shapes at their resolved style values`
