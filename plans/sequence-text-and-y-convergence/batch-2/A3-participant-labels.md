# A3 — participant labels and stereotypes

> **Rewritten 2026-09-01** for D8. The metrics ride on `TextRun`, so this task
> gives `ParticipantGeo` a run array rather than three scalars — which is also
> what makes the multi-row stereotype case expressible at all.

## Context

The heaviest of the four: participant head and foot labels are the most
numerous text in the corpus and are the ones the phantom-distance measurement
was taken on.

```
JAR   <text x="17"     y="27.889" font-size="14" textLength="24.938">Bob</text>
OURS  <text x="29.469" y="14"     font-size="14"
            text-anchor="middle" dominant-baseline="middle">Bob</text>
```

Our 29.469 is a centre and the jar's centre is `17 + 24.938/2 = 29.469`. **The
text is already in exactly the right place** — only the units are wrong.

## Task

Build the head/foot label runs in `computeParticipantLayout`, carry them on
`ParticipantGeo`, and route `renderLabel` through `sequenceText`.

A participant head is **one to N runs**: `renderNameBlock:169-182` stacks the
`stereotypeLines` above the display name, each at its own `cy`. All of them are
this task's, and a single scalar width could not have described them — that is
why D8 moved the metrics onto the run.

## Write-set

- `src/diagrams/sequence/sequence-layout-participants.ts`
- `src/diagrams/sequence/renderer-participant-shapes.ts`
- `src/diagrams/sequence/geo.ts` — ONE field on `ParticipantGeo`
- `tests/unit/sequence/participant-sizing.test.ts`,
  `tests/unit/sequence/renderer.test.ts`,
  `tests/unit/sequence/renderer-lifeline.test.ts`
  (and any other this change turns red — hand-built `ParticipantGeo` literals
  are common in this suite)

## Read-set

- `src/diagrams/sequence/renderer-participant-shapes.ts:101-109` —
  `renderLabel`, the anchored call. It is reached from BOTH the head and the
  foot, and from both the name and the stereotype rows.
- `src/diagrams/sequence/renderer-participant-shapes.ts:169-182` —
  `renderNameBlock`, the stereotype stack and its `cy` arithmetic.
- `src/diagrams/sequence/renderer-participant-shapes.ts:199-223` — `labelCy`,
  which resolves the vertical centre per participant kind. Its per-kind
  citations must survive the move to layout.
- `src/diagrams/sequence/sequence-layout-participants.ts:487-540` —
  `buildParticipantGeo`, which ALREADY calls `measurer.measure(p.display,
  fontSpec)` and keeps the result in `measured`. That is your width.
- `plans/sequence-text-and-y-convergence/decisions.md` — D1, D3, D4, D8.
- Jar reference: `ComponentRoseParticipant#drawInternalU:100-115` — the text
  block is translated by `padding.getTranslate()`, and `HorizontalAlignment
  center` centres it in the box.

## Architecture decisions in force

- **D1** — `buildParticipantGeo` measures; the renderer does not.
- **D4** — `leftX = centerX - textWidth / 2`. `centerX` stays the model's
  authoritative anchor; do not add a stored left-edge field to
  `ParticipantGeo` that could drift from it.
- **D8** — one run array, not three scalars.

## Interface contract

`ParticipantGeo` gains one field. Name it for what it holds, and document
whether foot labels share it or get their own — a foot label has the same text
and width but a different `y`, and the geometry does not know
`lifelineEndY` at the time the head is built. Deriving the foot run from the
head run in the renderer is legitimate under D4 (same derivation, different
axis); storing a second array is also legitimate. Say which, and why, in the
field's doc comment.

## Acceptance criteria

- Given `jobadi-87-jegi648`, when rendered, then the participant label is
  `x="17"` and `y="27.889"` with `textLength="24.938"` — the jar's own numbers.
- Given a single-character participant label (`covuco-47-sotu151`), when
  rendered, then no `textLength` is emitted, matching the jar.
- Given a participant with a visible stereotype (`birocu-87-xubi808`), when
  rendered, then both rows are left-edge positioned with their own baselines,
  and each row's `textLength` is ITS OWN measured width — the stereotype and
  the name are different strings and must not share one.
- Given the corpus, when rendered, then no participant `<text>` carries
  `text-anchor` or `dominant-baseline`.
- Given the corpus, when measured, then `text@x` distance has fallen by more
  than half.

## Observability

N/A. Gate is `text@x` / `text@y`, and the cohort line for stop condition 7.

## Rollback

**Reversible.** No baseline touched by this task.

## Quality bar

All four gates — `npm test`, not `npx vitest run tests/unit`. Write-set exact.

## Commit

`fix(A3): emit participant labels at the jar's left edge and baseline`
