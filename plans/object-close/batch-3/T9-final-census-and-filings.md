# T9 — file engine divergences, final census, mission summary

## Context

The mission's last task. `decisions.md` D6 requires every confirmed
`@knowvah/dot-engine` divergence to be filed as a self-contained
`docs/graphviz-issues/*.md` plus a `docs/graphviz-issues/TRACKER.md` line — living only in a
mission ledger does not count as filed, and an unfiled `gvts-blocked` verdict
fails the D1 exit bar.

## Task

1. For each `gvts-blocked` verdict in `ledger.md`, confirm a
   `docs/graphviz-issues/*.md` exists and is self-contained (reproducer DOT,
   expected vs actual, measured delta, affected fixtures), and that
   `docs/graphviz-issues/TRACKER.md` carries a line for it. Write any that batch-2 missed.
2. Run the final census on a **cold tree**: `rm -rf packages/*/assets` (or the
   project's generated-asset equivalent) then `npm test` — twice. Warm
   gitignored assets have hidden worker races before. Never pipe a gate.
3. Refresh the 80/80 attribution table in `ledger.md` against the final
   numbers; re-verify the arithmetic sums to 80.
4. Write the mission-closing summary into `plans/object-close/README.md`:
   trajectory (baseline → final), mechanisms landed per iteration, the final
   residue table by category, and reopeners ranked by expected reach.

## Write-set

- `docs/graphviz-issues/**`
- `docs/graphviz-issues/TRACKER.md`
- `plans/object-close/ledger.md`
- `plans/object-close/README.md`

## Read-set

- `plans/object-close/ledger.md`, `decision-journal.md`
- `docs/graphviz-issues/` — an existing file, for house format
- `plans/g3-object-svg/README.md:62-171` — G3's closing-summary shape, which
  is the house style for the trajectory and residue tables

## Architecture decisions in force

D1 (no anonymous misses), D6 (filed, not chased).

## Acceptance criteria

- Given every `gvts-blocked` row, when checked, then each has both a
  `docs/graphviz-issues/*.md` and a `docs/graphviz-issues/TRACKER.md` line.
- Given each issue file, when read, then it stands alone: reproducer,
  expected vs actual, measured delta, affected fixtures.
- Given a cold tree, when `npm test` runs twice, then both runs pass.
- Given the final table, when summed, then conformant + non-conformant == 80
  and the conformant count equals the final census.
- Given the summary, when read, then it states the 23/80 baseline, the final
  number, and a named disposition for every remaining fixture.

## Observability requirements

This task closes the loop opened by T1: the summary is the durable record of
what the gates read at close. State the frozen counts as verified at close,
not as remembered.

## Rollback

**Reversible** — documentation and issue filings only.

## Quality bar

Cold-tree verification is the gate, not a nicety. If a second cold run
disagrees with the first, STOP — that is a worker race, not a flake.

Return only the deliverables. No preamble, no trailing summary.

## Boundaries

- **Always:** run the gates cold, twice, unpiped.
- **Ask first:** closing the mission with any fixture lacking a named
  disposition — that fails D1 and is the maintainer's call, not the
  executor's.
- **Never:** pipe a gate; report a remembered number as a measured one.

## Commit format

```
docs(object): close the object-close mission

Baseline 23/80 -> <final>/80. Every remaining fixture carries a named
mechanism or a filed engine divergence.
```
