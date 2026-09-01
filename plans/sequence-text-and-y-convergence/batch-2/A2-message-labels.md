# A2 — message labels

## Context

Message labels are the one sequence text kind already positioned by a left
edge; what they lack is a baseline `y` and a `textLength`. Comparing
`TeozTimelineIssues_0003_Test`:

```
JAR   <text x="32.894" y="61.111" font-size="13" textLength="27.544">hello</text>
OURS  <text x="36.509" y="44"     font-size="13">hello</text>
```

The `y` is a block top where the jar's is a baseline, and there is no
`textLength`. `TextRun.y` therefore changes MEANING in this task — that is the
subtle part, and `sequence-page.ts` and `scale-geo.ts` both read it.

## Task

Give `TextRun` a width, change its `y` to a baseline, and route
`renderMessageLabel` through `sequenceText`.

## Write-set

- `src/diagrams/sequence/text-block-geo.ts`
- `src/diagrams/sequence/renderer-message.ts`
- `tests/unit/sequence/renderer.test.ts` — `messageLabelBlock` has no
  dedicated test file today; its coverage lives here. Adding
  `tests/unit/sequence/text-block-geo.test.ts` is welcome but not required.

## Read-set

- `src/diagrams/sequence/text-block-geo.ts:159-190` — `messageLabelBlock`,
  which already computes `blockLeft`, `labelLeft` and a per-line `y`.
- `src/diagrams/sequence/renderer-message.ts:74-86` — `renderMessageLabel`.
- `src/diagrams/sequence/sequence-page.ts:310-330` — reads run `y` for
  pagination. **Check this still holds** once `y` is a baseline.
- `src/diagrams/sequence/sequence-layout-shared.ts` — `arrowFontSpecOf`, the
  13pt arrow font these labels are measured at.
- `plans/sequence-text-and-y-convergence/decisions.md` — D1, D3.

## Architecture decisions in force

**D1** — `messageLabelBlock` already has the measurer; it populates the width
and the ascent. `renderMessageLabel` must not measure anything.

## Interface contract

Consumes A1's `sequenceText` and the `TextRun` metric fields. `TextRun.y`
becomes a **baseline**, and its doc comment must say so in those words —
nothing type-checks the difference.

## Acceptance criteria

- Given `TeozTimelineIssues_0003_Test`, when rendered, then the first message
  label is `x="32.894"`, `y="61.111"`, `textLength="27.544"`, matching the jar.
- Given any message label, when rendered, then `textLength` equals
  `measure(label, arrowFontSpecOf(theme)).width` to within 0.001.
- Given a multi-line label, when rendered, then each line's baseline is one
  `textLineHeight` below the previous.
- Given a paginated fixture (`newpage`), when rendered, then label positions
  are unchanged relative to their own page — the `y`-semantics change must not
  leak into pagination.
- Given the corpus, when measured, then `text@y` distance has fallen.

## Observability

N/A. Gate is the distance instrument's `text@x` / `text@y` rows.

## Rollback

**Reversible**, but see the mission README: code and `diff-baseline.json` must
revert together. This task does not re-pin, so reverting it alone is clean.

## Quality bar

All four gates. Write-set exact.

## Commit

`fix(A2): give message labels the jar's baseline and textLength`
