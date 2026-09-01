# A5 — notes, dividers and newpage titles

## Context

`renderer.ts` carries the remaining four text sites: note bodies (`:136`),
divider text (`:82`), frame `[condition]` labels (`:186`) and newpage titles
(`:257`). One of them anchors (`:86`); another uses
`dominant-baseline: hanging` (`:264`), an adaptation this task replaces with a
real baseline.

These are the least numerous of the four kinds but the most varied — four
different fonts and three different vertical conventions.

## Task

Carry the metrics for each, and route all four through `sequenceText`.

## Write-set

- `src/diagrams/sequence/renderer.ts`
- `tests/unit/sequence/renderer.test.ts`,
  `tests/unit/sequence/newpage-separator.test.ts`,
  `tests/unit/sequence/renderer-frame-blotter.test.ts` (and any other this
  turns red)

## Read-set

- `src/diagrams/sequence/renderer.ts:78-95` — divider text, the anchored one.
- `src/diagrams/sequence/renderer.ts:128-145` — note body lines.
- `src/diagrams/sequence/renderer.ts:180-195` — `[condition]` labels.
- `src/diagrams/sequence/renderer.ts:245-270` — newpage titles and the
  `hanging` baseline, with its own comment explaining the adaptation.
- `src/diagrams/sequence/divider-style.ts:54-106` — `DIVIDER_FONT_SIZE` and
  `dividerFontSpecOf`, the per-element font precedent.
- `plans/sequence-text-and-y-convergence/decisions.md` — D1, D3, D4.

## Architecture decisions in force

- **D3** — all four sites route through `sequenceText`; none keeps a bespoke
  `text()` call.
- **D4** — where a site centres, derive `leftX` from the centre and the width.

## Acceptance criteria

- Given a fixture with a divider (`degire-21-dujo330`), when rendered, then the
  divider text carries a `textLength` and no `text-anchor`.
- Given a fixture with a note, when rendered, then each note line has its own
  baseline one `textLineHeight` apart, and no `dominant-baseline` attribute
  survives anywhere in the file.
- Given a fixture with an `alt`/`else` (`bovugo-63-lazo401`), when rendered,
  then the `[condition]` label is left-edge positioned with a `textLength`.
- Given the whole corpus, when rendered, then `renderer.ts` emits no
  `text-anchor` and no `dominant-baseline`.

## Observability

N/A.

## Rollback

**Reversible.**

## Quality bar

All four gates. Write-set exact.

## Commit

`fix(A5): route notes, dividers and newpage titles through the emitter`
