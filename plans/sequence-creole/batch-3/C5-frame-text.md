# C5 — frame tab, comment, `ref` body and `[condition]`

## Context

Frames carry four displays and one of them is where creole `[[url]]` lives most
often: `cikoca-19-feji527` writes `ref over Alice, Dummy : [[url]] Foo2`, and
`cedeti-10-bufu072` writes `alt [[url]]` and `else [[url]]`.

Those are the B3 leftovers. B3 closed participant-DECLARATION urls (42 of 89);
the remaining 47 are creole urls inside label text, and this task plus C6 own
them.

## Task

Route the tab title, the `[comment]`, the `ref` body lines and the `else`
`[condition]` through C1's producer, and wrap any url-bearing run per D3.

## Write-set

- `src/diagrams/sequence/geo-frame.ts`
- `src/diagrams/sequence/sequence-layout-events.ts` — the FRAME functions only
  (`computeHeaderTab`, `buildTabRuns`, `refBodyRuns`, `branchConditionRun`)
- `src/diagrams/sequence/renderer-frame-header.ts`
- `src/diagrams/sequence/renderer.ts` — `renderRefBody` and
  `renderBranchSeparators` ONLY. **C6 owns the rest of this file.**
- `tests/unit/sequence/frame-text-placement.test.ts`,
  `tests/unit/sequence/renderer-frame-header.test.ts`, and any this turns red

## Read-set

- `src/diagrams/sequence/sequence-layout-events.ts` — `buildTabRuns`,
  `refBodyRuns`, `branchConditionRun`, each already producing measured runs at
  its own font.
- `src/core/svg.ts#linkWrap` — the `<a>` emitter, already used by
  `renderer-participant-shapes.ts` for declaration urls.
- `findings/starting-census.md` — the url fixtures.
- **The parent mission's font findings**: `reference { FontSize 12 }`
  (`plantuml.skin:145-151`) and `referenceHeader { FontSize 13, FontStyle bold }`
  (`:153-160`) are already applied. Do not re-derive them, and do not let the
  atom engine's own default font override them.

## Architecture decisions in force

- **D3** — a url-bearing run wraps in `linkWrap`.
- **D5** — the frame's runs are measured in layout.

## Acceptance criteria

- Given `cikoca-19-feji527`, when rendered, then its `ref` body emits an `<a>`
  around the url-bearing run and the label text reads `Foo2` without markup.
- Given `cedeti-10-bufu072`, when rendered, then the `alt` and `else`
  conditions each emit their own `<a>`.
- Given `bepipo-37-fego336`, when rendered, then the tab title's baseline and
  `textLength` are UNCHANGED — a frame with no markup must not move.
- Given a `ref` body run, when rendered, then its font is still 12 and the
  header's still 13-bold — the atom engine must not substitute its own.
- Given the corpus, when measured, then the `<a>` count has risen from 42 and
  `descended` has not fallen.

## Observability

N/A beyond the element census's `a` row.

## Rollback

**Reversible.**

## Quality bar

All four gates. Write-set exact — in particular, do not touch the note or
divider functions in `sequence-layout-events.ts`, or the rest of `renderer.ts`.

## Commit

`fix(C5): render frame text through creole, urls included`
