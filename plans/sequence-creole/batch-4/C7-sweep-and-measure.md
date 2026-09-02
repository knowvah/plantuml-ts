# C7 — sweep, adjudication and measurement

## Context

The mission claimed 440 content mismatches and 75 closable fixtures. This task
proves what actually moved and records what did not, so the next mission starts
from a measurement rather than an estimate.

## Task

1. **Sweep.** Re-run the content census and the element census from
   `findings/starting-census.md` and diff them against it.
2. **Adjudicate** with `scripts/sequence-ratchet-adjudicate.ts --base <mission
   base ref>` as an INSTRUMENT. Every `regression` needs a stated mechanism.
   Do not re-pin.
3. **Measure** the cohort line and report `descended` against the starting 797.
4. Write `findings/creole-close.md` and tick the README.

## Write-set

- `plans/sequence-creole/findings/creole-close.md` (create)
- `plans/sequence-creole/README.md` (status ticks only)
- `plans/sequence-creole/decision-journal.md` (append)

No source changes.

## Read-set

- `findings/starting-census.md` — every number this task compares against.
- `scripts/sequence-geometry-distance.ts` — the cohort line.
- `scripts/sequence-ratchet-adjudicate.ts:1-70` — usage and the three
  measurement hazards.

## Acceptance criteria

- Given the corpus, when the content census is re-run, then creole mismatches
  have fallen from 440, and every class that did NOT fall is recorded with a
  mechanism.
- Given the cohort line, then `descended` is at least 797, and the rise from
  C2 is stated separately from the rest.
- Given the adjudication, then every `regression` verdict carries a mechanism
  or the mission stops.
- Given any corpus figure quoted, then it either excludes
  `SequenceArrows_0001_Test`/`_0002_Test` and `zudize-61-vomi445` and says so,
  or reports concentration alongside.
- Given `findings/creole-close.md`, then it names what creole did NOT reach —
  atoms with no measured fixture, the draw-order non-goal, and any residual —
  as concrete follow-ons rather than prose.

## Observability

This task IS the observability step.

## Rollback

N/A — documentation and measurement only.

## Quality bar

All four gates still green. No source file changes.

## Commit

`docs(C7): measure what wiring creole into sequence bought`
