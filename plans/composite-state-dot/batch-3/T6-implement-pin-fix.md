# T6 — Implement the pin fix

**Blocked on T5.** Do not start until T5's mechanism entry exists in
`decision-journal.md` with all four required elements.

## Context

Read [batch-3/overview.md](overview.md) and T5's journal entry. The frontier
calculator and border-point recognition are verified correct — the defect is
upstream of them, in whatever T5 identified.

## Task

Implement the fix T5's mechanism indicates.

## Write-set

**Determined by T5.** Expected within `src/diagrams/state/state-composite-*.ts`
or `src/diagrams/state/state-dot-graph.ts`, plus the corresponding unit tests.

**If T5's mechanism lands outside those files, STOP** and report rather than
widening the write-set.

## Read-set

- T5's `decision-journal.md` entry — the mechanism, origin and ruled-out list
- Whichever files that entry names
- [decisions.md](../decisions.md) ADR-1, ADR-5

## Architecture decisions (locked)

- Fix the mechanism at its ORIGIN, not the symptom downstream. A change spread
  across several symptom sites means the root was not actually found.
- No fitted constants. The 26.5px is evidence, not a formula — shipping it as an
  offset would be the exact failure the port-label collision work avoided.

## Acceptance criteria

- Given `temuxi-28-cega322`, when rendered, then document height is 418.
- Given the same fixture, when rendered, then each pin-bearing frame's height
  matches jar's (`flop` 170, `counter` 300, `module` 316).
- Given the state census, when run, then no fixture's diff count rises.
- Given any residual, when recorded, then it carries a named mechanism.

## Observability requirements

N/A — no new observable operations.

## Rollback

Reversible — single commit, state-local.

## Quality bar

All four gates green, plus the component/usecase/state census. If the mechanism
turns out to touch shared layout code, census class and object too.

## Commit

`feat(T6): <what T5's mechanism turned out to be>`
