# T4 — close-out

## Context

The mechanism has landed. This task makes the written record match what was
measured, so the next reader inherits facts rather than optimism.

## Task

1. Flip `planning/mission-index.md`'s **SI17** row with the measured
   numbers. If the gate reads 710/711, say so and name
   `besepi-37-rori892` — do not round up to the exit bar's headline.
2. Update `.agent-notes/T8-member-ports-wrong-mechanism.md`: the mechanism
   it describes is retired; record the commit and leave the diagnosis
   intact as history.
3. Write a new `.agent-notes/` entry for anything discovered here that a
   future task would otherwise re-derive.
4. `DIVERGENCES.md` — an entry ONLY if something is deliberately left
   diverging, naming the mechanism. Absence of effort is not a divergence.
5. Append the mission summary to `../README.md`: tasks completed vs planned,
   decisions flagged for review, gate results, known follow-ups.

## Write-set

- `planning/mission-index.md`
- `.agent-notes/**`
- `DIVERGENCES.md` (conditional)
- `plans/si17-class-row-ports/README.md`
- `plans/si17-class-row-ports/ledger.md` (create if batch-2 ran)

## Read-set

- `../decision-journal.md` — the whole thing; it is the source for every
  number you write.
- `../decisions.md#adr-6` — the exit-bar arithmetic.
- `planning/mission-index.md` — the SI17 row and its neighbours' style.

## Acceptance criteria

- Given the SI17 row, then it states the measured class DOT count and, if
  below 711, the named cause — never a bar reported as met when it is not.
- Given `.agent-notes/T8-member-ports-wrong-mechanism.md`, then it records
  the retirement and the commit, with the original diagnosis preserved.
- Given a scope claim in the original SI17 row that this mission falsified,
  then the row says so explicitly rather than being quietly rewritten.
- Given the four gates, then all pass.

## Observability requirements

N/A — documentation only.

## Rollback

**Reversible.** Documentation only.

## Quality bar

Every number traceable to a journal entry and a command. Four gates green.

## Boundaries

- **Always:** prefer the measured number to the planned one.
- **Never:** report an exit bar as met when the gate says otherwise; delete
  a prior diagnosis instead of superseding it.

## Commit format

```
docs(T4): close SI17 with the measured class DOT number
```
