# Archived notes — task/port completion records

Moved here 2026-08-13 so the top level of `.agent-notes/` stays scannable.
**Nothing here was deleted, and nothing here is known to be wrong.**

## The rule that decided what moved

> A note **cited from `src/`, `tests/`, `oracle/` or `scripts/` stays at the
> top level.** It is load-bearing documentation, not history — the code
> references it precisely because the code cannot fully explain itself.

That rule was learned the hard way during this sweep. The first pass archived
28 notes on the basis of their *shape* (organized around a task rather than a
finding). Checking for dangling references then showed **39 citations from
`src/` alone**, in the full-path form `.agent-notes/T10a-separator-primitives
.md` — so 14 of those 28 were live documentation with a task-shaped title, and
went straight back up. Shape was the wrong discriminator; reachability from
code is the right one.

What remains here is the residue: task records that nothing in the codebase
points at.

## Why they moved rather than got deleted

**They are not empty.** The premise that these were pure "what I did" records
turned out to be wrong on inspection — most wrap real Observations that are
not obviously recoverable from the code:

- `si1-t7-bodier` — `getRegexp()` is consumed both transformed and raw
  upstream.
- `T1b-diff-baseline` — where `render-fixture.ts` and the census script agree
  and where they do not.
- `T6-link-port` — why `Link.java` was split, and along which seam.

So this directory is **searchable history, not a wastebasket**. `grep -r` here
before concluding something was never investigated. If a note in here turns
out to describe live behavior, move it back up rather than duplicating it —
and if you add a citation to one from code, move it back up as part of that
change.

## What did NOT move

Anything recording an open gap, a tooling trap, or a mechanism that still
governs current code — including the `a2s-r2*` and `r2*` round notes, which
are task-*banners* over live findings ("direction words up/left invert the
WHOLE link", "colocated `src` tests never run under `npm test`") rather than
completion records.
