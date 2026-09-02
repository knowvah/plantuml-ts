# C2 — split every display on `\n`

## Context

`Display.getWithNewlines` splits a display on `\n`. This port applies it to
note bodies and to nothing else, so:

```
Alice -> Bob : one\ntwo          ours: one <text>, `one\ntwo`
participant "Carl\nsecond" as C  ours: one <text>, `Carl\nsecond`
note over Alice : n1\nn2         ours: two <text>, correct
```

The note arm being right is what makes this a wiring gap rather than a parser
bug: the splitting exists and two call sites do not reach it.

514 occurrences across 118 fixtures; 101 of the 410 short-circuiting fixtures
contain one; **75 fixtures have this as their ONLY root-child difference**.

## Task

Route every sequence display through `DisplayNewlines`' splitting before it
becomes runs — message labels, participant names and stereotypes, and any
frame or divider display that does not already split.

Reuse `splitDisplayLines`/`getWithNewlines3`; do not write a `split('\n')`.

## Write-set

- `src/diagrams/sequence/text-block-geo.ts`
- `src/diagrams/sequence/sequence-layout-participants.ts`
- `src/diagrams/sequence/sequence-layout-events.ts`
- `tests/unit/sequence/*` — whichever this turns red, plus one new test for the
  split itself

## Read-set

- `src/core/klimt/creole/DisplayNewlines.ts` — `splitDisplayLines`,
  `getWithNewlines3`, `parseWithNewlines`. Note the JAWS deprecation warning
  path; decide explicitly whether sequence surfaces it.
- `src/diagrams/sequence/text-block-geo.ts` — `messageLabelBlock`, which
  already advances a baseline per line and will simply receive more lines.
- `src/diagrams/sequence/sequence-layout-participants.ts#buildLabelRuns` —
  already builds one run per row; stereotype rows are the existing precedent
  for a multi-row head.
- `findings/starting-census.md#escaped-n` — the payoff and the fixtures.

## Architecture decisions in force

- **D4** — this task does `\n` and nothing else. No markup.
- **D5** — the extra lines are measured in layout, like the existing ones.

## Acceptance criteria

- Given `butali-53-kige134` (`"Bob\non 2 lines"`), when rendered, then the
  participant head emits two `<text>` runs whose baselines are one
  `textLineHeight` apart, each with its own `textLength`.
- Given `Alice -> Bob : one\ntwo`, when rendered, then two message-label runs,
  and the arrow's own y is unchanged — a multi-line label grows UPWARD.
- Given `cimofu-59-xotu865`, when rendered, then its root child count matches
  the jar's.
- Given the corpus, when measured, then `descended` has RISEN from 797 and no
  fixture has lost descent.
- Given a display with no `\n`, when rendered, then its output is byte-identical
  to before this task.

## Observability

The cohort line is this task's own instrument. Record `descended` before and
after in the decision journal.

## Rollback

**Reversible.**

## Quality bar

All four gates. Write-set exact.

## Commit

`fix(C2): split every sequence display on its escaped newlines`
