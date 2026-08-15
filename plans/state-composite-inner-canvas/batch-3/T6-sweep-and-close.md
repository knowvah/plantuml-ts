# T6 — sweep, record, close

Measurement and documentation only. **No `src/` writes.** If this task
finds something that needs a code change, it reports it; it does not fix it.

## Task

1. Run T1's harness over the full state cache and record the final numbers
   against the Batch 1 baseline: `exact`, `mismatched`, `unmatched`, and
   the per-fixture list of anything still mismatched.
2. For every composite still mismatched, state a **named mechanism** with a
   `file:line`. "Still off by N" is not a mechanism. If a mechanism cannot
   be established for one, say so explicitly and name what would establish
   it — an unexplained residual recorded as unexplained is honest; one
   quietly omitted is not.
3. Re-run `measure-state-size-deltas.ts`. Expect `improved` entries. Tighten
   the backlog only where it improved — it is **tighten-only**, and removal
   is maintainer-ruled. `tumaba-64-tosu281`'s pre-existing 1e-6 wobble stays
   as-is; do not re-pin it to make the harness exit 0.
4. Check whether any state fixture became newly pin-eligible (BOTH zero-diff
   SVG under `DeterministicMeasurer` AND `dotEqual` in `parity-state.json`
   — see `oracle/goldens/svg-state/README.md#add-rule`, and
   `.agent-notes/g7-followup-pin-eligibility.md` for why size-exactness
   alone is NOT eligibility). Pin any that qualify. Expect none: the
   corpus-wide entity-wrapping `childCount` divergence gates most composite
   fixtures, and that is out of scope per decision D4.
5. Update `.agent-notes/class-ink-shared-offset-groups.md` item **(c)** to
   record the outcome — closed, or re-scoped with the residual named. Its
   current text says the derivation "is where a fix has to start"; that
   sentence must not survive unchanged if the fix landed.
6. Write the mission outcome into the brief's README: the measurement table
   filled in, what the brief got WRONG, and what is left with where it is
   written down.

## Read-set

- `scripts/measure-composite-declared-size.ts`, `scripts/measure-state-size-deltas.ts`
- `plans/state-composite-inner-canvas/decision-journal.md` — every entry
- `.agent-notes/class-ink-shared-offset-groups.md`, `.agent-notes/g7-followup-pin-eligibility.md`
- `oracle/goldens/svg-state/README.md` — the add rule

## Write-set

- `plans/state-composite-inner-canvas/README.md`, `decision-journal.md`,
  `batch-*/overview.md` (checkboxes)
- `.agent-notes/class-ink-shared-offset-groups.md`
- `oracle/goldens/svg-state/ratchet.json` + new golden dirs, **only** if a
  fixture genuinely qualifies under both add-rule conditions

## Acceptance criteria

1. Given the final harness run, when reported, then every still-mismatched
   composite carries a named mechanism with a `file:line`, or an explicit
   statement that one could not be established and what would.
2. Given the brief README, when read after this task, then its measurement
   table shows baseline and final for every row.
3. Given `.agent-notes/class-ink-shared-offset-groups.md`, when read, then
   item (c) reflects the tree as it now is.
4. Given the backlog, when re-measured, then `widened` is 0 apart from the
   pre-existing `tumaba` entry, which is unchanged.
5. Given the close-out, when it states a number, then that number came from
   a command in this task — not from the brief's predictions.

## Quality bar

All four gates exit 0 on the full branch. state DOT-parity 268/268. All
pins hold.

**Do not redefine the exit bar to make it look met.** If the mission fell
short, the close-out says so, with the numbers.

## Boundaries

- **Always:** state a mechanism with `file:line` for every residual.
- **Ask first:** anything that would require a `src/` change.
- **Never:** run a git command. Never re-baseline a pin or loosen a backlog
  allowance to make a gate pass.
