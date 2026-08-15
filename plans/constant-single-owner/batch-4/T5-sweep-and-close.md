# T5 — sweep, record, close

Measurement and documentation only. **No `src/` writes.**

## Task

1. Run `scripts/constant-inventory.ts` and record the final counts against
   Batch 1's baseline: duplicated names, redundant declarations, same-value,
   different-value, known-exceptions.
2. **Account for every remaining duplicate.** Each one is either
   `coincidence` (with its one-line reason), `known-exception` (D5), or
   `unknown` (origin not established, with what would establish it). A
   remaining duplicate with no classification is unfinished work, and the
   close-out says so rather than rounding it off.
3. Confirm the mission moved nothing: `shape-match-report.ts` at **776 /
   25695**, full suite green with no expectation changed. State the evidence,
   not the intention.
4. Record how many rows flipped classification during execution — a `share`
   that turned out to be a `coincidence` on the second read is the most
   valuable thing this mission learns, and the count of them is the honest
   measure of how good the value-equality heuristic was.
5. Write the outcome into the brief's README: the counts, what the brief got
   wrong, and what is left.
6. Update `.agent-notes/constant-inventory.md` to final state so it is a
   standing reference rather than a mid-mission scratchpad.

## Read-set

- `scripts/constant-inventory.ts`, `.agent-notes/constant-inventory.md`
- `plans/constant-single-owner/decision-journal.md` — every entry
- `plans/constant-single-owner/README.md`

## Write-set

- `plans/constant-single-owner/README.md`, `decision-journal.md`,
  `batch-*/overview.md` (checkboxes)
- `.agent-notes/constant-inventory.md`

## Acceptance criteria

1. Given the final inventory, when reported, then every remaining duplicate
   carries a classification and a reason.
2. Given the README, when read, then its counts are baseline-and-final and
   came from THIS task's commands, not from the brief's estimates.
3. Given the "moves no fixture" claim, when the close-out states it, then it
   cites the harness numbers and the suite result.
4. Given the classification flips, then their count and the notable ones are
   recorded.

## Quality bar

All four gates exit 0 on the full branch.

**Do not redefine the exit bar to make it look met.** If a batch fell short,
or a cluster was left alone, the close-out says which and why. "Every
remaining duplicate is one somebody deliberately kept" is the bar — not a
target number of removals.

## Boundaries

- **Always:** classify every remaining duplicate.
- **Ask first:** anything requiring a `src/` change.
- **Never:** run a git command.
