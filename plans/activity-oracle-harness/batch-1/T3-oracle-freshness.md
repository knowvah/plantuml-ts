# T3 — Extend oracle-freshness to activity

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-oracle-harness`. `oracle-freshness.test.ts` guards against a
cache captured by a DIFFERENT jar than the one currently pinned. It has two
layers: a per-type **sentinel** (one slug, byte-compared against a fresh
render) and a whole-directory **homogeneity scan** for `SUPERSEDED_FORM`.

The homogeneity layer exists because the sentinel alone is blind to partial
staleness: on 2026-09-02, 244 of 266 component oracles were stale while the
sentinel was fresh. T0 just created a new cache type — it must be covered by
both layers from the start.

## Task
Add one activity entry to `SENTINELS` and confirm the homogeneity scan picks
the new type up. Pick a sentinel slug that is **representative, not
degenerate** — a fixture with real content, not a two-line diagram. Say in
your note why you picked it.

Verify by reasoning about the code, not by assumption: the homogeneity check
iterates `SENTINELS` and scans `join(CACHE, type)` for each. Adding the entry
should therefore cover the whole activity tree automatically — **confirm that
is what the code does** before claiming it.

## Write-set
- `tests/oracle/svg-conformance/oracle-freshness.test.ts`
- `.agent-notes/aoh-T3.md`

Nothing else. Not the ratchet test — that is T2.

## Read-set
- `tests/oracle/svg-conformance/oracle-freshness.test.ts:96-100` (SENTINELS),
  `:147-155` (sentinel check), `:191-216` (homogeneity scan)
- `test-results/dot-cache/activity/` — T0's output, to pick a slug
- T0's report — the captured slug list

## Architecture decisions
[D4] the cache is committed; an absent tree is a broken checkout.

## Interface contracts
None consumed downstream. Report the chosen slug and why.

## Acceptance criteria
- Given `SENTINELS`, then it carries exactly one activity entry naming a
  representative slug.
- Given the pinned jar present, when the suite runs, then the activity
  sentinel's cached `in.svg` is byte-identical to a fresh render.
- Given the activity cache, then the `SUPERSEDED_FORM` homogeneity scan
  covers the whole directory and reports **0** offenders.
- Given no jar available, then the check skips with a warning, as the
  existing types do — it does not fail.

## Observability
This task closes failure mode 3 from the mission's operational readiness: a
jar bump silently invalidating every activity baseline at once.

## Rollback
**Reversible.** A one-entry addition to an existing test.

## Quality bar
All four gates green.

## Commit
`test(aoh-T3): cover the activity oracle cache in the freshness gate`
