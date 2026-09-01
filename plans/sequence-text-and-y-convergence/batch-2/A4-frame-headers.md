# A4 — frame headers and conditions

## Context

`renderer-frame-header.ts` is the ONE sequence renderer already emitting a
correct baseline: `:197` places the tab title at
`frame.y + paddingTop + textAscent(tabFontSize)`, jar-verified against
`bepipo-37-fego336` (a 13px tab title's baseline sits 10.111 below its block
top, an 11px comment's 8.556).

It gets two things wrong anyway: no `textLength`, and it computes the ascent
arithmetically. The arithmetic is exact for the three production measurers and
**wrong for `FixedMeasurer`**, which returns `lineHeight/4.5` where the helper
uses `fontSize/4.5` — a latent sizer/renderer split (D1, D2).

The `[condition]` labels at `renderer.ts:186` belong to A5, not here; this task
owns the frame's own header and comment.

## Task

Carry the metrics from frame layout, route the header and comment through
`sequenceText`, and delete the local `textAscent` (D2).

## Write-set

- `src/diagrams/sequence/renderer-frame-header.ts`
- `src/diagrams/sequence/sequence-layout-events.ts`
- `tests/unit/sequence/renderer-frame-header.test.ts`,
  `tests/unit/sequence/frame-style.test.ts` (and any other this turns red)

## Read-set

- `src/diagrams/sequence/renderer-frame-header.ts:60-73` — the local
  `textAscent` and its jar verification. **Preserve that citation** when you
  move the value into layout; it is the evidence the number is right.
- `src/diagrams/sequence/renderer-frame-header.ts:190-215` — the two emitters.
- `src/diagrams/sequence/sequence-layout-events.ts:221-260` —
  `computeFrameBody` and the header display, where the measurer is in scope.
- `plans/sequence-text-and-y-convergence/decisions.md` — D1, D2, D3.

## Architecture decisions in force

- **D2** — the local `textAscent` goes. The state and class copies **stay**;
  touching them is outside this write-set and is stop condition 1.
- **D1** — the ascent comes from layout, where a real measurer is in scope,
  so `FixedMeasurer` and `DeterministicMeasurer` can no longer disagree.

## Acceptance criteria

- Given `bepipo-37-fego336`, when rendered, then the tab title's baseline is
  unchanged from today (10.111 below its block top) — this task must not move
  the y it already gets right.
- Given the same fixture, when rendered, then the tab title now carries a
  `textLength` equal to its measured width.
- Given a layout driven by `FixedMeasurer(8, 16)`, when the frame header is
  rendered, then its baseline uses `16 - 16/4.5`, not `fontSize - fontSize/4.5`
  — the divergence D1 exists to close.
- Given the corpus, when rendered, then `renderer-frame-header.ts` contains no
  `textAscent` function.

## Observability

N/A. Gate is that the frame header's y does NOT move while its markup gains
`textLength`.

## Rollback

**Reversible.**

## Quality bar

All four gates. Write-set exact — in particular, do not touch
`state-render-colors.ts` or `class-visibility-icon.ts`.

## Commit

`fix(A4): give frame headers a textLength and a measured ascent`
