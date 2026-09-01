# A3 — participant labels and stereotypes

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

Carry the metrics from `computeParticipantLayout`, and route `renderLabel` and
the stereotype block through `sequenceText`, deriving the left edge per D4.

## Write-set

- `src/diagrams/sequence/sequence-layout-participants.ts`
- `src/diagrams/sequence/renderer-participant-shapes.ts`
- `tests/unit/sequence/participant-sizing.test.ts`,
  `tests/unit/sequence/renderer.test.ts` (and any other this change turns red)

## Read-set

- `src/diagrams/sequence/renderer-participant-shapes.ts:101-109` —
  `renderLabel`, the anchored call.
- `src/diagrams/sequence/renderer-participant-shapes.ts:170-200` —
  `renderNameBlock`, the stereotype rows.
- `src/diagrams/sequence/sequence-layout-participants.ts:415-465` —
  `buildParticipantGeo`, which already measures the label.
- `plans/sequence-text-and-y-convergence/decisions.md` — D1, D3, D4.
- Jar reference: `ComponentRoseParticipant#drawInternalU:100-115` — the text
  block is translated by `padding.getTranslate()`, and `HorizontalAlignment
  center` centres it in the box.

## Architecture decisions in force

- **D1** — `buildParticipantGeo` measures; the renderer does not.
- **D4** — `leftX = centerX - textWidth / 2`, computed in the renderer.
  Do not add a left-edge field to `ParticipantGeo`.

## Acceptance criteria

- Given `jobadi-87-jegi648`, when rendered, then the participant label is
  `x="17"` and `y="27.889"` with `textLength="24.938"` — the jar's own numbers.
- Given a single-character participant label (`covuco-47-sotu151`), when
  rendered, then no `textLength` is emitted, matching the jar.
- Given a participant with a visible stereotype (`birocu-87-xubi808`), when
  rendered, then both rows are left-edge positioned with their own baselines.
- Given the corpus, when rendered, then no participant `<text>` carries
  `text-anchor` or `dominant-baseline`.
- Given the corpus, when measured, then `text@x` distance has fallen by more
  than half.

## Observability

N/A. Gate is `text@x` / `text@y`, and the cohort line for stop condition 7.

## Rollback

**Reversible.** No baseline touched by this task.

## Quality bar

All four gates. Write-set exact.

## Commit

`fix(A3): emit participant labels at the jar's left edge and baseline`
