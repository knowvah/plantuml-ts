# T6 — Dividers, band and floating titles

**Agent:** `typescript-pro` · **Depends on:** T2, T5

## Context

Read [`../README.md`](../README.md) and [`../decisions.md`](../decisions.md);
[D2], [D3] and [D5] govern this task and are locked. `renderSwimlanes`
(`renderer.ts:212-268`) draws a filled header band from x=0, bold titles
inside it, dividers only BETWEEN lanes, and a horizontal separator the jar
never draws.

## Read-set

- `src/diagrams/activity/renderer.ts:212-268` — `renderSwimlanes`
- `~/git/plantuml/.../ftile/LaneDivider.java:83-100` — `drawU`: ONE
  `ULine.vline(height)` at `UTranslate.dx(x1)`, coloured by
  `PName.LineColor`, stroked by `getStyle().getStroke()`
- `~/git/plantuml/.../ftile/Swimlanes.java:318-350` — the divider loop
  (note it draws one per boundary, both outer edges included);
  `:357-367` `drawTitlesBackground`; `:369-377` `drawTitles` and
  `CenteredText`
- `src/diagrams/activity/activity-style-defaults.ts` — T2's resolvers
- `plantuml.skin:309-314`

## Task

1. **Dividers.** One full-height `<line>` per lane boundary INCLUDING both
   outer edges — 3 lines for 2 lanes — at the resolved border colour and
   thickness. This closes the filed `activity-swimlane-line-thickness`
   (51 of the 143 remaining `line/@stroke-width` residual units).
2. **Band.** Emit the transparent title-band rect ([D3]) at the measured
   band height ([D2] — `max` of title heights, never the FontSize constant).
3. **Titles.** Drawn LAST ([D5]), centred per lane per `CenteredText`, NOT
   bold, at the resolved title font and colour.
4. Delete the horizontal separator line and the filled band. Retire
   `SWIMLANE_HEADER_H`.

## Boundaries

**Always:** cite `plantuml.skin:NNN` or a Java `file:line` for every value.
**Never:** re-declare a value T2 owns.
**Never:** change lane geometry — T5 owns it.

## Acceptance criteria

- Given a two-lane diagram, then exactly THREE divider `<line>`s are
  emitted, each spanning the full content height at `stroke-width="1.5"`
- Given the default theme, then a `fill="none"` band rect is emitted ([D3])
- Given a lane title, then it is centred within its lane, not bold, at
  `font-size="18"`, and appears AFTER the dividers in document order ([D5])
- Given `skinparam SwimlaneTitleFontSize 30`, then the title renders at 30
- Given the ratchet, then any risen fixture is named with a mechanism

## Observability

N/A.

## Rollback

**Reversible.**

## Quality bar

All four gates green; full `npm test`. Pre-existing tests that pin the old
boxed-header model are expected to fail — update them; the new behaviour is
upstream-sourced (a push-forward condition).

## Commit

`fix(asr-T6): draw swimlanes as dividers with floating titles`
