# A2 — message labels

> **Rewritten 2026-09-01** for D8. A1 already added the three metric fields to
> `TextRun` and populated them in `messageLabelBlock`, so this task is smaller
> than it was: what remains is the `y` semantics and the renderer.

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

## Already done by A1 — do not redo

- `TextRun.textWidth` / `.textAscent` / `.textLineHeight` exist, are required,
  and are populated by `messageLabelBlock` from the ARROW font spec.
- `scale-geo.ts#scaleRun` scales all three.
- `sequence-text.ts#sequenceText` exists and is tested.

## Task

Change `TextRun.y` from a block top to a baseline, and route
`renderMessageLabel` through `sequenceText`.

The ascent A1 already carries is the conversion: a run whose top is `t` has its
baseline at `t + textAscent`. Make that change in `messageLabelBlock`, where
the measurer is, and NOT in the renderer (D1).

## Write-set

- `src/diagrams/sequence/text-block-geo.ts`
- `src/diagrams/sequence/renderer-message.ts`
- `tests/unit/sequence/text-block-geo-metrics.test.ts` — A1 created this; the
  `y`-advance assertions in it are the ones your change must keep true.
- `tests/unit/sequence/renderer.test.ts`, `tests/unit/sequence/sequence-page.test.ts`
  (and any other this turns red)

`MessageGeo` needs **no** new field: `labelLines` and `labelNumber` are already
`TextRun`s. A2 does not write `geo.ts`.

## Read-set

- `src/diagrams/sequence/text-block-geo.ts:189-239` — `messageLabelBlock`,
  which already computes `blockLeft`, `labelLeft`, a per-line `y`, and now the
  metrics.
- `src/diagrams/sequence/renderer-message.ts:93-150` — `renderMessageLabel`.
- `src/diagrams/sequence/sequence-page.ts` — reads run `y` for pagination.
  **Check this still holds** once `y` is a baseline.
- `src/diagrams/sequence/sequence-layout-shared.ts` — `arrowFontSpecOf`, the
  13pt arrow font these labels are measured at.
- `plans/sequence-text-and-y-convergence/decisions.md` — D1, D3, D8.

## Architecture decisions in force

**D1** — `messageLabelBlock` has the measurer; it owns the conversion.
`renderMessageLabel` must not measure or derive anything.

## Interface contract

Consumes A1's `sequenceText` and `TextRun`. `TextRun.y` becomes a **baseline**,
and its doc comment must say so in those words, replacing A1's deliberately
neutral "in whatever convention its producer documents" — nothing type-checks
the difference.

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

**Reversible.** This task does not re-pin (D5), so reverting it alone is clean.

## Quality bar

All four gates — `npm test`, not `npx vitest run tests/unit`. Write-set exact.

## Commit

`fix(A2): give message labels the jar's baseline and textLength`
