# T4 — sweep, record, close

Measurement and documentation only. **No `src/` writes.** If this task finds
something needing a code change, it reports it.

## Task

1. Run `scripts/shape-match-report.ts` and record final numbers against
   T1's baseline. Report the per-fixture delta list: what improved, what
   moved and should not have, what did not move and was expected to.
2. For every family fixture still not exact, state a **named mechanism**
   with a `file:line`. "Still off by N" is not a mechanism.
3. Confirm the non-class engines did not move (state, description,
   sequence, activity). This is a stop condition, so verify it rather than
   assuming the write-set implies it.
4. Check whether any class or object fixture became newly pin-eligible
   (zero-diff SVG under `DeterministicMeasurer` AND `dotEqual`; see
   `oracle/goldens/svg-class/README.md`'s add rule and
   `.agent-notes/g7-followup-pin-eligibility.md` for why size-exactness is
   NOT eligibility). Pin any that qualify.
5. Update `.agent-notes/class-ink-shared-offset-groups.md` item **(b)** to
   the tree as it now is — closed, or re-scoped with the residual named.
   Its current text says a real fix "needs a per-USymbol ink rule … not
   another special case"; if that landed, that sentence must not survive
   unchanged. Item (a) is already closed and item (c) is a separate
   mission — leave both alone.
6. Write the outcome into the brief's README: the measurement table filled
   in, what the brief got WRONG, and what is left.

## Read-set

- `scripts/shape-match-report.ts`
- `.agent-notes/usymbol-ink-family.md` — T1's baseline and family
- `plans/usymbol-ink-rule/decision-journal.md` — every entry
- `.agent-notes/class-ink-shared-offset-groups.md`
- `oracle/goldens/svg-class/README.md` — the add rule

## Write-set

- `plans/usymbol-ink-rule/README.md`, `decision-journal.md`,
  `batch-*/overview.md` (checkboxes)
- `.agent-notes/class-ink-shared-offset-groups.md`,
  `.agent-notes/usymbol-ink-family.md`
- `oracle/goldens/svg-class/ratchet.json` + new golden dirs, **only** if a
  fixture genuinely qualifies under both add-rule conditions

## Acceptance criteria

1. Given the final run, when reported, then every non-exact family fixture
   carries a named mechanism with a `file:line`, or an explicit statement
   that one could not be established and what would establish it.
2. Given the README, when read, then its measurement table shows baseline
   and final for every row, from THIS task's commands.
3. Given item (b) of the shared-offset note, when read, then it reflects
   the current tree.
4. Given the non-class engines, when checked, then the close-out states the
   evidence they did not move — not merely that they should not have.

## Quality bar

All four gates exit 0 on the full branch. class DOT-parity 712/712. All
pins hold.

**Do not redefine the exit bar to make it look met.** If the mission fell
short, the close-out says so, with the numbers.

## Boundaries

- **Always:** state a mechanism with `file:line` for every residual.
- **Ask first:** anything requiring a `src/` change.
- **Never:** run a git command. Never re-baseline a pin to make a gate pass.
