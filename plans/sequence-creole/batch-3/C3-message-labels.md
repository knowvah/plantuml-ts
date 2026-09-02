# C3 — message labels and the autonumber

## Context

A message label is the most numerous creole-bearing text in the engine, and it
carries a second, separate gap the parent mission recorded but could not fix:

> `number.text` is whatever the autonumber format produced, creole markup
> included. Upstream runs it through `getCreole` (`Display.java:704`), so
> `<font color=red>[001]</font>` becomes a red `[001]`; this port emits the
> markup literally. That is a creole gap, not a text-block one.
> — `text-block-geo.ts`

`create0`'s `createMessageNumber` arm is upstream's own answer, and C1 exposed
the machinery behind it.

## Task

Route a message label's lines and its autonumber through C1's producer, and
have `renderMessageLabel` emit each resulting run's style.

## Write-set

- `src/diagrams/sequence/geo-message.ts` (only if a field is needed)
- `src/diagrams/sequence/text-block-geo.ts` — `messageLabelBlock`
- `src/diagrams/sequence/renderer-message.ts`
- `tests/unit/sequence/text-block-geo-metrics.test.ts`,
  `tests/unit/sequence/message-label-placement.test.ts`, and any this turns red

## Read-set

- `decisions.md#d3`, `#d5`
- `src/diagrams/sequence/text-block-geo.ts` — `messageLabelBlock`, which
  already places runs and advances baselines.
- `src/core/klimt/creole/DisplayCreole.ts:211-230` — `create0`'s dispatch,
  including the `createMessageNumber` arm. Read it for the SEMANTICS even
  though D1 routes through the atom engine rather than calling it.
- `findings/starting-census.md` — the reference fixtures.

## Architecture decisions in force

**D5** — `messageLabelBlock` has the measurer; `renderMessageLabel` must not
acquire one.

## Acceptance criteria

- Given `Alice -> Bob : a <b>bold</b> label`, when rendered, then three sibling
  `<text>` runs, of which only `bold` carries `font-weight="700"`, and each
  carries its own `textLength`.
- Given `bakuba-09-fica741`, when rendered, then its `""x->  ""` label emits
  `x->` — no quotes — in the monospace family.
- Given an autonumber whose format carries creole, when rendered, then the
  markup is interpreted rather than emitted literally.
- Given a label with no markup, when rendered, then its output is
  byte-identical to before this task.
- Given the corpus, when measured, then `descended` has not fallen.

## Observability

N/A beyond the content census.

## Rollback

**Reversible.**

## Quality bar

All four gates. Write-set exact.

## Commit

`fix(C3): render message labels and autonumbers through creole`
