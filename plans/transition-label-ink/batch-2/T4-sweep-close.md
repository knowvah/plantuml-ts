# T4 — sweep, record, close

Measurement and documentation only. **No `src/` writes.**

## Task

1. Run `measure-composite-declared-size.ts` over the full state cache.
   Record final counts against the 2454 / 2642 baseline, and the per-fixture
   list of anything that moved.
2. For every composite still mismatched, state a **named mechanism** with a
   `file:line`, or say explicitly that one could not be established and what
   would establish it. Expect many to remain — `evidence.md` §6 shows the
   corpus deltas range −36 to +5.8, so this mission was never going to move
   them all. Do not imply otherwise.
3. Re-run `shape-match-report.ts` and confirm 776 / 25695 did not fall.
4. Confirm no non-state diagram type moved, with evidence rather than
   inference.
5. Update `.agent-notes/class-ink-shared-offset-groups.md` item **(c)**. It
   currently says the composite's own node-size derivation "is where a fix
   has to start" — the predecessor mission disproved that, and this one
   resolved (or re-scoped) the real cause. That sentence must not survive
   unchanged.
6. Write the outcome into this brief's README: the measurement table filled
   in, what the brief got wrong, and what is left.

## Read-set

- `scripts/measure-composite-declared-size.ts`,
  `scripts/shape-match-report.ts`
- `plans/transition-label-ink/decision-journal.md` — every entry
- `.agent-notes/class-ink-shared-offset-groups.md`,
  `.agent-notes/transition-label-ink.md`

## Write-set

- `plans/transition-label-ink/README.md`, `decision-journal.md`,
  `batch-*/overview.md` (checkboxes)
- `.agent-notes/class-ink-shared-offset-groups.md`,
  `.agent-notes/transition-label-ink.md`

## Acceptance criteria

1. Given the final run, every still-mismatched composite carries a named
   mechanism or an explicit "not established, and here is what would".
2. Given the README, its numbers came from THIS task's commands, not from
   the brief's predictions.
3. Given item (c) of the shared-offset note, it reflects the current tree.
4. Given the close-out, it states what the mission did NOT fix as plainly as
   what it did.

## Quality bar

All four gates exit 0 on the full branch. **Do not redefine the exit bar to
make it look met.** If the mission fell short, say so with the numbers.

## Boundaries

- **Always:** a mechanism with `file:line` for every residual.
- **Ask first:** anything needing a `src/` change.
- **Never:** run a git command.
