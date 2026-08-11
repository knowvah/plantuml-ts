# T8 — supersede G3's residue table; update the mission index

## Context

`decisions.md` D5. G3 is a closed mission whose README carries a residue table
that measurement has falsified. Its *mechanism writeups*
(`plans/g3-object-svg/ledger.md`) remain valid precedent and are not touched —
only the residue attribution failed.

## Task

1. Add a banner at the top of `plans/g3-object-svg/README.md`'s
   "Final residue table" section: the table is superseded, why (measured
   2026-08-11: zero fixtures under 0.5px; 19 non-geometry), and a link to
   `plans/object-close/ledger.md`. **Leave the table itself in place** —
   closed missions are historical record.
2. Update `planning/mission-index.md`:
   - Amend the **G3** row: still `done`, but note the residue attribution was
     superseded by object-close, with the corrected baseline.
   - Add an **object-close** row with its outcome.
   - Add the tracked follow-up for the stale `class`/`state`/`usecase`
     dot-caches (recorded by T1).

## Write-set

- `plans/g3-object-svg/README.md` (banner only — do not alter the table, the
  trajectory, or the mechanism list)
- `planning/mission-index.md`

## Read-set

- `plans/g3-object-svg/README.md:118-171` — the residue table and reopeners.
- `planning/mission-index.md` — the G1–G5 block, for row format.
- `plans/object-close/ledger.md` — the corrected numbers.

## Architecture decisions in force

D5.

## Acceptance criteria

- Given G3's README, when read, then the residue table is preceded by a
  banner naming the supersession and linking the new ledger, and the table's
  own rows are byte-unchanged.
- Given `planning/mission-index.md`, when read, then the G3 row states the
  attribution was superseded and the object-close row records the outcome.
- Given the stale sibling caches, when the index is read, then a tracked
  follow-up row exists for them.
- Given the files, when the gates run, then all four pass.

## Observability requirements

N/A — documentation only.

## Rollback

**Reversible** — single documentation commit.

## Quality bar

`technical-writer` rewrites whole files. After it returns, run
`git diff --numstat plans/g3-object-svg/README.md` and confirm the change is
the banner alone — a rewritten table would destroy the historical record this
task exists to preserve.

## Boundaries

- **Always:** verify the diff is additive on G3's README.
- **Ask first:** any change to G3's ledger.
- **Never:** edit or delete G3's residue table rows; rewrite its trajectory or
  mechanism sections.

## Commit format

```
docs(object): supersede G3's residue attribution, keep its record intact
```
