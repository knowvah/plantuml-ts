# A5 — notes, dividers, conditions and box labels

> **Rewritten and RENAMED 2026-09-01** (was `A5-notes-dividers-newpage.md`).
> Three corrections: there are no newpage titles, the box group label was in no
> task's inventory, and the `ref` body moved to A4. Metrics ride on `TextRun`
> (D8).

## Context

`renderer.ts` carries four text sites after A4 takes the `ref` body. One of
them anchors (`renderNote`); another uses `dominant-baseline: 'hanging'`
(`renderDividerLabel`), an adaptation this task replaces with a real baseline.

These are the least numerous of the four kinds but the most varied — four
different fonts and three different vertical conventions.

**There are no newpage titles.** The previous version of this task listed one
at `renderer.ts:257`; that line is the divider label. `NewpageGeo` carries no
text, and neither does upstream — `ComponentRoseNewpage#drawInternalU` is three
statements ending in `ug.draw(ULine.hline(dimensionToUse.getWidth()))`
(`skin/rose/ComponentRoseNewpage.java:57-62`), and `renderNewpage:302` mirrors
it exactly. Do not invent one.

## The four sites

| site | today | notes |
|---|---|---|
| note body lines | `renderer.ts:82` (`renderNote`) | anchored; multi-line, split on `\n` at `:78` |
| `[condition]` branch labels | `renderer.ts:186` (`renderBranchSeparators`) | frame text, but this file's |
| divider label lines | `renderer.ts:257` (`renderDividerLabel`) | `dominant-baseline: 'hanging'`; multi-line |
| box group label | `renderer.ts:374` (`renderBoxBackground`) | **was unassigned**; single line, already left-edged |

## Task

Build the runs for each in layout, and route all four through `sequenceText`.

The box label is the cheapest of the four and the only one already at a left
edge (`box.x + padding`); it needs a measured width and nothing else.

## Write-set

- `src/diagrams/sequence/renderer.ts` — everything EXCEPT `renderRefBody`,
  which is A4's. If the two run in parallel, serialize them.
- `src/diagrams/sequence/sequence-layout-events.ts` — the note and divider
  functions ONLY; A4 owns frame layout in the same file
- `src/diagrams/sequence/geo.ts` — run fields on `NoteGeo` and `DividerGeo`,
  and on `BoxGeo`
- `tests/unit/sequence/renderer.test.ts`,
  `tests/unit/sequence/newpage-separator.test.ts`,
  `tests/unit/sequence/renderer-frame-blotter.test.ts`,
  `tests/unit/sequence/sequence-page.test.ts` (and any other this turns red)

## Read-set

- `src/diagrams/sequence/renderer.ts:66-91` — `renderNote`, the anchored one,
  and its `lineHeight = theme.fontSize * 1.4` — a RATIO, not a measurement.
  Replacing it with the measured `textLineHeight` will move note text; that is
  intended, but say so in the commit body, since it is the one place in this
  task where a y changes for a reason other than the baseline convention.
- `src/diagrams/sequence/renderer.ts:173-208` — `renderBranchSeparators`.
- `src/diagrams/sequence/renderer.ts:239-269` — `renderDividerLabel` and its
  `hanging` baseline, with the comment explaining the adaptation.
- `src/diagrams/sequence/renderer.ts:364-384` — `renderBoxBackground`.
- `src/diagrams/sequence/divider-style.ts:54-106` — `DIVIDER_FONT_SIZE` and the
  divider font spec, the per-element font precedent.
- `plans/sequence-text-and-y-convergence/decisions.md` — D1, D3, D4, D8.

## Architecture decisions in force

- **D3** — all four sites route through `sequenceText`; none keeps a bespoke
  `text()` call.
- **D4** — where a site centres, derive `leftX` from the centre and the width.
- **D8** — `DividerGeo.textWidth` and `.textHeight` ALREADY EXIST and mean
  something else: `AbstractTextualComponent#getTextWidth`, the text block plus
  `topRightBottomLeft(4,4,4,4)`, read by `renderDividerLabel` to size the
  label's background `<rect>`. They stay. Your new field must not collide with
  them, and must not be conflated with them — the box is 8 wider than the text.

## Acceptance criteria

- Given a fixture with a divider (`degire-21-dujo330`), when rendered, then the
  divider text carries a `textLength` and no `text-anchor`, and the label's
  background `<rect>` is UNCHANGED — it is sized from `DividerGeo.textWidth`,
  which this task does not touch.
- Given a fixture with a note, when rendered, then each note line has its own
  baseline one `textLineHeight` apart, and its own measured `textLength`.
- Given a fixture with an `alt`/`else` (`bovugo-63-lazo401`), when rendered,
  then the `[condition]` label is left-edge positioned with a `textLength`.
- Given a fixture with a `box` group carrying a label, when rendered, then the
  label carries a `textLength` and its `x` is unchanged.
- Given the whole corpus, when rendered, then `renderer.ts` emits no
  `text-anchor` and no `dominant-baseline`.

## Observability

N/A.

## Rollback

**Reversible.**

## Quality bar

All four gates — `npm test`, not `npx vitest run tests/unit`. Write-set exact.

## Commit

`fix(A5): route notes, dividers, conditions and box labels through the emitter`
