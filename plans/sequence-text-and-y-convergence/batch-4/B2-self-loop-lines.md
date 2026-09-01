# B2 — the self loop is three lines, not one path

## Context

This port draws a self-message loop as a single `<path>`; the jar draws three
`<line>` elements. `compareSvg` short-circuits on a tag mismatch
(`compare.ts:229`) and never descends into the `d` attribute's numbers, so
**every self-message geometry in the corpus is invisible to the comparator**.

That is not theoretical. Batch 8 of the previous mission corrected the self
loop's width from 40 to the jar's 42 — jar-verified, exact on
`jobadi-87-jegi648` — and total distance moved by **exactly zero**, because the
comparator could not see it. 79 fixtures emit our path where the jar emits
none.

CLAUDE.md: a structural divergence IS the bug.

## Task

Emit the three strokes upstream emits, in upstream's order.

## Write-set

- `src/diagrams/sequence/renderer-message.ts`
- `tests/unit/sequence/renderer.test.ts` (its self-loop assertions),
  `tests/unit/sequence/participant-sizing.test.ts` (its Batch 8 pin)

## Read-set

- `src/diagrams/sequence/renderer-message.ts:25-70` — `SELF_LOOP_WIDTH` (42,
  cited), `SELF_LOOP_HEIGHT` (20, cited, and deliberately still wrong — that is
  C3's, not this task's) and the path builder.
- Jar reference: `ComponentRoseSelfArrow#drawRightSide:124-126` — the three
  strokes, in order:
  `hline(xRight - x1)`, `vline(arrowHeight)` at `xRight`, `hline(xRight - x2)`.
- `test-results/dot-cache/sequence/jobadi-87-jegi648/in.svg` — the jar's three
  lines for a bare self message.

## Architecture decisions in force

None specific. Do **not** change `SELF_LOOP_HEIGHT`; it is C3's, and changing
it here would confound this task's measurement.

## Acceptance criteria

- Given `jobadi-87-jegi648`, when rendered, then three `<line>` elements are
  emitted with x values 34.469→76.469, 76.469→76.469 and 35.469→76.469,
  matching the jar's, and no `<path>` remains for the loop.
- Given the corpus, when rendered, then the count of `<path>` elements falls by
  roughly 220 and the count of `<line>` rises by roughly three times the number
  of self messages.
- Given the corpus, when measured, then total distance CHANGES — a self-message
  fixture that previously reported zero movement now reports real numbers. A
  RISE here is expected and benign: geometry that was invisible is now
  measured. Adjudicate it, do not revert it.
- Given the cohort line, then `descended` has not fallen.

## Observability

The point of this task is that it makes a whole feature observable. Record the
before/after distance for a named self-message fixture in the journal.

## Rollback

**Reversible.**

## Quality bar

All four gates. Write-set exact.

## Commit

`fix(B2): draw a self loop as the jar's three lines, not one path`
