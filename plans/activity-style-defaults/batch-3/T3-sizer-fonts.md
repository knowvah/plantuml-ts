# T3 — Per-element font in the measurement helpers

**Agent:** `typescript-pro`
**Depends on:** T2

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read
[`../README.md`](../README.md) and [`../decisions.md`](../decisions.md);
[D1] and [D6] govern this task and are locked.

`activity-layout-helpers.ts` measures every activity element at the
diagram-wide root font (14), with one unsourced `- 2` for diamonds. It also
advances multi-line text at `fontSize * 1.4` while the renderer advances at
`1.0x` with an upstream citation — a live sizer/renderer divergence.

## Prior observation — read before starting

`planning/mission-guide.md` names this defect class: *"A feature reaches
the renderer and the sizer keeps measuring something else."* It recurred
four times in the description engine alone. `planning/sizer-renderer-parity.md`
is the reusable audit and has a "reuse for another engine" section. Apply
it to activity as part of this task and report what else it surfaces —
finding a third instance is a success, not scope creep, but **fix only the
font and line-height items**; file anything else.

## Read-set

- `src/diagrams/activity/activity-layout-helpers.ts` (whole file, 121 lines)
- `src/diagrams/activity/activity-renderer-shapes.ts:30-96` — the cited
  1.0x advance and its `StringBounderFromWidthTable.java:71` citation
- `src/diagrams/activity/activity-style-defaults.ts` (T2's output)
- `planning/sizer-renderer-parity.md`

## Write-set

- `src/diagrams/activity/activity-layout-helpers.ts`
- `tests/unit/activity/activity-layout-helpers.test.ts`

## Task

1. Replace every `ctx.theme.fontSize` with the T2 resolver for that
   element's own SName: `actionSize` → `activity`, `noteSize` → `note`,
   `diamondSize` → `diamond`, `repeatCondSize` / `parallelogramSize` →
   `activity` (verify each against upstream's ftile for that shape before
   assigning it an SName; if the mapping is not obvious from the Java,
   halt and journal rather than guessing).
2. Delete the `- 2` in `diamondSize` — the diamond's 11 now comes from the
   skin, and `14 - 2` was never the same number as `11`.
3. Replace `lineHeight = ctx.theme.fontSize * 1.4` at both sites with the
   renderer's cited `1.0x` advance ([D6]).

## Boundaries

**Always:** cite `plantuml.skin:NNN` or the Java `file:line` for every
number. **Never:** re-declare a value T2 owns. **Never:** fit a constant to
a golden. **Ask first (halt and journal):** if an element's correct SName
is not determinable from the Java.

## Acceptance criteria

- Given a single-line action label, when `actionSize` is called with the
  default theme, then the label is measured at size `12`, not `14`
- Given a diamond label, when `diamondSize` is called, then the label is
  measured at size `11`
- Given a note label, when `noteSize` is called, then the label is measured
  at size `13`
- Given a three-line action label, when `actionSize` is called, then the
  reserved height uses a `1.0x` per-line advance and equals what
  `renderMultilineText` draws for the same lines
- Given the activity ratchet, when run, then **no fixture rises** against
  T0's pin; every fixture that rises is named with a mechanism in the
  journal before the commit lands

## Quality bar

All four gates green: `npm test` (full suite), `npm run typecheck`,
`npm run lint`, `npm run build`.

## Commit

`fix(asd-T3): measure activity text at its own resolved font size`
