# A4 — frame headers, comments and `ref` bodies

> **Rewritten 2026-09-01** for D8. Metrics ride on `TextRun`. `ref` bodies move
> here from A5: they are frame text, and `FrameGeo.refBody` is already a
> placed-run type in all but name.

## Context

`renderer-frame-header.ts` is the ONE sequence renderer already emitting a
correct baseline: `:197` places the tab title at
`frame.y + paddingTop + textAscent(tabFontSize)`, jar-verified against
`bepipo-37-fego336` (a 13px tab title's baseline sits 10.111 below its block
top, an 11px comment's 8.556).

It gets two things wrong anyway: no `textLength`, and it computes the ascent
arithmetically. The arithmetic is exact for the three production measurers and
**wrong for `FixedMeasurer`**, which returns `lineHeight/4.5` where the helper
uses `fontSize/4.5` — a latent sizer/renderer split (D1, D2). A1's
`tests/unit/sequence/text-block-geo-metrics.test.ts` already pins the correct
behaviour for message runs; this task extends it to frames.

The `[condition]` labels at `renderer.ts:186` belong to A5, not here — they
live in `renderer.ts`, and the split is by file.

## Task

Build the frame's runs in layout, route the header, the comment and the `ref`
body through `sequenceText`, and delete the local `textAscent` (D2).

`FrameGeo.refBody` is `{ text: string; x: number }[]` today, with the renderer
supplying the `y`. Promote it to `readonly TextRun[]` and move that `y`
arithmetic (`renderer.ts:130-142`) into layout, preserving its doc comment —
it explains the two deliberate substitutions upstream does not make.

## Write-set

- `src/diagrams/sequence/renderer-frame-header.ts`
- `src/diagrams/sequence/sequence-layout-events.ts` — frame layout ONLY;
  A5 owns the note and divider functions in the same file
- `src/diagrams/sequence/geo.ts` — `FrameGeo`: the tab runs, and `refBody`'s
  promotion to `TextRun[]`
- `src/diagrams/sequence/renderer.ts` — `renderRefBody` ONLY. **Coordinate with
  A5**, which owns the rest of this file; if the two run in parallel, serialize
  them.
- `tests/unit/sequence/renderer-frame-header.test.ts`,
  `tests/unit/sequence/frame-style.test.ts`,
  `tests/unit/sequence/renderer-frame-blotter.test.ts`
  (and any other this turns red)

## Read-set

- `src/diagrams/sequence/renderer-frame-header.ts:60-73` — the local
  `textAscent` and its jar verification. **Preserve that citation** when you
  move the value into layout; it is the evidence the number is right.
- `src/diagrams/sequence/renderer-frame-header.ts:192-215` — the two emitters.
- `src/diagrams/sequence/renderer.ts:130-142` — `renderRefBody` and the `y`
  arithmetic that moves to layout.
- `src/diagrams/sequence/sequence-layout-events.ts:305-360` — the `FrameGeo`
  construction site, where the measurer is in scope.
- `src/diagrams/sequence/text-block-geo.ts` — `refBodyLines`/`refBodyHeight`/
  `refBodyWidth`, which already measure this body for SIZING. Reuse those
  measurements; do not take a second, independent one — that is the
  sizer/renderer split `planning/sizer-renderer-parity.md` names.
- `plans/sequence-text-and-y-convergence/decisions.md` — D1, D2, D3, D8.

## Architecture decisions in force

- **D2** — the local `textAscent` goes. The state and class copies **stay**;
  touching them is outside this write-set and is stop condition 1.
- **D1** — the ascent comes from layout, where a real measurer is in scope,
  so `FixedMeasurer` and `DeterministicMeasurer` can no longer disagree.
- **D8** — runs, not scalars. `FrameGeo` already has `tabTextWidth`; decide
  explicitly whether it survives alongside the runs or is subsumed by them, and
  say which in the commit body. It is read for the tab's own WIDTH, which is a
  box dimension, not a text metric — the same distinction that made
  `DividerGeo.textWidth` uncarryable.

## Acceptance criteria

- Given `bepipo-37-fego336`, when rendered, then the tab title's baseline is
  unchanged from today (10.111 below its block top) — this task must not move
  the y it already gets right.
- Given the same fixture, when rendered, then the tab title now carries a
  `textLength` equal to its measured width.
- Given a layout driven by `FixedMeasurer(8, 16)`, when the frame header is
  rendered, then its baseline uses `16 - 16/4.5`, not `fontSize - fontSize/4.5`
  — the divergence D1 exists to close. Mirror A1's own assertion for this.
- Given a two-line `ref over` frame, when rendered, then each body line carries
  its OWN measured `textLength` and its own baseline.
- Given the corpus, when rendered, then `renderer-frame-header.ts` contains no
  `textAscent` function.

## Observability

N/A. Gate is that the frame header's y does NOT move while its markup gains
`textLength`.

## Rollback

**Reversible.**

## Quality bar

All four gates — `npm test`, not `npx vitest run tests/unit`. Write-set exact —
in particular, do not touch `state-render-colors.ts` or
`class-visibility-icon.ts`.

## Commit

`fix(A4): give frame headers a textLength and a measured ascent`
