# C3 — apply the vertical terms, together

## Context

C2 proved a set of vertical terms. This task lands them **as one change**,
because landing them one at a time is measurably worse: the document margin
applied alone raises total distance by 35 145.

## Task

Apply exactly what C2 proved. Nothing C2 did not prove.

## Write-set

**Defined by C2.** Expected to include
`src/diagrams/sequence/sequence-layout-participants.ts`,
`src/diagrams/sequence/layout.ts`,
`src/diagrams/sequence/renderer-message.ts`, and their tests — but C2's
findings are authoritative, and a file outside them is stop condition 1.

## Read-set

- `plans/sequence-text-and-y-convergence/findings/vertical-terms.md` — the
  spec for this task.
- `plans/sequence-text-and-y-convergence/decisions.md` — D7, the axis-split
  gate this task is measured on.

## Architecture decisions in force

- **D7** — gate on the per-AXIS subtotals C1 added, not the flat table.
- Stop condition 4 — every constant carries its `file:line`. This mission
  exists downstream of one that removed an uncited 80.

## Acceptance criteria

- Given the corpus, when measured, then the Y-axis subtotal FALLS. A rise is
  stop condition 11 unless diagnosed.
- Given the corpus, when measured, then total distance falls.
- Given `jobadi-87-jegi648`, when rendered, then its document height matches the
  jar's, or the residual has a stated mechanism.
- Given the five fixtures the previous mission adjudicated as rises
  (`mifafi-02-dofi536`, `musive-74-reva838`, `posura-78-koji601`,
  `rapoto-38-neca900`, `vekuno-87-ponu028`), when measured, then their document
  height is exact again — they are the canaries for this exact term.
- Given the cohort line, then `descended` has not fallen.

## Observability

Report the per-axis subtotal before and after, not just the total.

## Rollback

**Reversible.** No re-pin happens in this task.

## Quality bar

All four gates. Write-set matches C2's findings exactly.

## Commit

`fix(C3): land the vertical terms C2 derived`
