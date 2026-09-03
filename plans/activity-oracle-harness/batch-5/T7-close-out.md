# T7 — Close-out

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-oracle-harness`. All prior tasks are complete.

## Task
1. **Final gates on the whole branch**, not just the last commit. Report the
   `npm test` wall-clock (advisory context in this repo, not a gate) and the
   delta against the pre-mission baseline.
2. **`npm run catalog`** — the catalog is generated and drift-gated. Confirm
   no drift.
3. **Check `docs/parity-report.md`.** `dot-sync-report.ts` enumerates types
   from its manifest directory (`manifestTypes()`, `:305`), so activity should
   NOT have sprouted a DOT-parity row. Confirm it did not. If one appeared,
   that contradicts [D9] and is a finding, not a cosmetic fix.
4. **`DIVERGENCES.md`** — add a line only if the project's own rules call for
   one. T5 changed activity's SVG root shape; that is a move TOWARD upstream,
   so it is likely not a divergence at all. Decide and say which.
5. **Write the mission summary** at the bottom of `README.md`: tasks completed
   vs planned, decisions made (with any flagged for review), gate results, the
   headline descent number from T6, and known follow-ons.
6. **File the follow-on work** so it does not live only in this ledger:
   - the ~90 parser-gap fixtures ([D8]) — the largest tracked queue
   - the geometry residual, with its measured both-way direction (T6's census)
   - any `@knowvah/dot-engine` finding, if one surfaced, needs a
     self-contained `.md` in `docs/graphviz-issues/` plus a `TRACKER.md` line
     — filed before this mission closes. Living only in a mission ledger is
     **not filed**. (None is expected; activity uses no dot.)
7. Confirm the decision journal records every non-trivial judgment call made
   during execution.

## Write-set
- `plans/activity-oracle-harness/README.md` (summary section)
- `plans/activity-oracle-harness/decision-journal.md`
- `docs/catalog.md` (regenerated)
- `DIVERGENCES.md` (only if warranted)
- `planning/next-missions.md` (follow-on entries)

## Read-set
- T6's report — the headline numbers
- `oracle/goldens/svg-activity/diff-census.json` — the follow-on queue
- `planning/next-missions.md` — the existing format

## Architecture decisions
[D8] the parser gaps are a tracked queue, not this mission's work ·
[D9] activity has no DOT row.

## Acceptance criteria
- Given `npm run catalog`, then no drift.
- Given the four gates on the full branch, then all green, with the wall-clock
  reported.
- Given `docs/parity-report.md`, then activity gained no misleading DOT-parity
  row.
- Given the follow-on work, then it is filed in `planning/next-missions.md`
  with the measured numbers, not only in this plan directory.

## Observability
N/A.

## Rollback
**Reversible.** Documentation only.

## Quality bar
All four gates green on the full branch.

## Commit
`docs(aoh-T7): close out the activity oracle harness mission`
