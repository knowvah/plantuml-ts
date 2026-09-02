# C6 — notes, dividers and box labels

## Context

`renderer.ts` draws four text kinds itself, and notes are where the remaining
creole urls live: `cedeti-10-bufu072` writes `note over Bob: [[url]]`.

Notes already split on `\n` — they are the one call site that always did — so
this task is markup and urls only.

## Task

Route note bodies, divider labels and box-group labels through C1's producer,
and wrap url-bearing runs.

## Write-set

- `src/diagrams/sequence/geo-annotation.ts`
- `src/diagrams/sequence/sequence-layout-events.ts` — the NOTE and DIVIDER
  functions only (`noteBodyRuns`, `dividerLabelRuns`). **C5 owns the frame
  functions.**
- `src/diagrams/sequence/layout.ts` — `boxLabelRun`
- `src/diagrams/sequence/renderer.ts` — everything EXCEPT `renderRefBody` and
  `renderBranchSeparators`, which are C5's
- `tests/unit/sequence/annotation-text-placement.test.ts`, and any this turns
  red

## Read-set

- `src/diagrams/sequence/sequence-layout-events.ts` — `noteBodyRuns`,
  `dividerLabelRuns`.
- `src/diagrams/sequence/layout.ts#boxLabelRun` — and its recorded divergence
  note: the jar draws a box label at `box { FontSize 13, FontStyle bold }`
  (`plantuml.skin:162-167`) and this port uses 11 plain. **That is not this
  task's to fix**; leave the note in place.
- `findings/starting-census.md`

## Architecture decisions in force

- **D3** — url-bearing runs wrap in `linkWrap`.
- **D5** — measured in layout.
- The note's own font is `note { FontSize 13 }` (`plantuml.skin:312-316`),
  already applied by the parent mission. The atom engine must not override it.

## Acceptance criteria

- Given `cedeti-10-bufu072`, when rendered, then its `note over Bob: [[url]]`
  emits an `<a>`.
- Given a note body with `<b>` markup, when rendered, then the bold run is a
  sibling `<text>` with `font-weight="700"`, not a `<tspan>`.
- Given `degire-21-dujo330`, when rendered, then its divider label is unchanged
  — a divider with no markup must not move.
- Given a note with no markup, when rendered, then its output is
  byte-identical to before this task.
- Given the corpus, when measured, then `descended` has not fallen and
  `renderer.ts` still emits no `text-anchor` or `dominant-baseline`.

## Observability

N/A beyond the content census.

## Rollback

**Reversible.**

## Quality bar

All four gates. Write-set exact.

## Commit

`fix(C6): render notes, dividers and box labels through creole`
