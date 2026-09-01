# C2 — derive every vertical term from the Java

## Context

Two Y terms are already derived, cited, and waiting:

- **The vertical document margin, 10 top and bottom.**
  `SequenceDiagram#getDefaultMargins:624-628` returns
  `ClockwiseTopRightBottomLeft.same(5)` in Teoz mode, `TextBlockExporter:173`
  applies it, and `SequenceDiagramFileMakerTeoz#getTextBlock:132` adds its own
  `UTranslate(5, 5)`. The previous mission derived all four sides and applied
  only X.
- **`SELF_LOOP_HEIGHT` 20 against upstream's 13.**
  `ComponentRoseSelfArrow#getArrowOnlyHeight:321-323` returns 13, and
  `jobadi-87-jegi648`'s golden drops `y1="53"` to `y2="66"`.

Neither can land alone — see the batch overview. This task finds the rest of
the set so C3 can land them together.

## Task

Read the Java and derive every remaining vertical term. Write it up. **No code.**

At minimum, settle: `messageSpacing`, note vertical spacing and padding, frame
header and separator heights, divider height, the footbox row, and the body's
own 5px surplus that made the margin probe overshoot.

## Write-set

- `plans/sequence-text-and-y-convergence/findings/vertical-terms.md` (create)

## Read-set

- `plans/sequence-text-and-y-convergence/findings/text-convention.md` — A6's
  recorded per-attribute numbers, now axis-split by C1. **This is the input
  D6 gates on.**
- `plans/sequence-coordinate-convergence/findings/document-margins.md` — the
  margin already derived, X half applied.
- `plans/sequence-coordinate-convergence/findings/activation-verify.md` — the
  `SELF_LOOP_HEIGHT` citation.
- Jar: `sequencediagram/teoz/` — `CommunicationTile`, `CommunicationTileSelf`,
  `NoteTile`, `GroupingTile`, `PlayingSpace`, and every `getPreferredHeight`.
- **Grep `src/main/java/net/`, not `net/sourceforge/plantuml/`** — that scope
  silently misses `net/atmp/`.

## Acceptance criteria

- Given each vertical term this port uses, when the findings are written, then
  each has an upstream `file:line` or is explicitly recorded as uncited and
  unexplained.
- Given the margin probe's +35 145 result, then the findings EXPLAIN it — which
  term makes the body 5 too tall, with a named fixture.
- Given the findings, then they state which terms must land together and why,
  so C3 is one change rather than a guess.
- Given any constant proposed for C3, then it carries its citation. A term
  without one is stop condition 4.

## Observability

N/A — derivation only.

## Rollback

N/A — documentation only.

## Quality bar

All four gates still green (nothing changes). Every claim quotable: "matches
upstream" puts `file:line` in the same sentence.

## Commit

`docs(C2): derive the sequence engine's vertical terms`
