# T8 — re-pin every baseline the routing change moved

## Context

Routing changes move rendered bytes across several engines at once: a fixture
that changes engine is rendered by different code, so its diff count against
the jar changes. Batches 2–4 deliberately touched no baseline
(`../decisions.md#d5`), which is why this task exists as its own reviewable
commit rather than as noise inside the change that caused it.

Only **two** `diff-baseline.json` files exist in the repo —
`oracle/goldens/svg-sequence/` and `oracle/goldens/svg-description/`. The
other engines gate through zero-diff promotion lists (`ratchet.json`), which
are **T9's** and must not be edited here.

## Task

1. Re-measure and rewrite the two diff baselines from fresh measurements
2. Regenerate `oracle/goldens/svg-sequence/diff-census.json`
3. Re-pin T1's `routing-baseline.json` to the new, lower misroute count
4. Record the before/after distribution in the journal

## Read-set

- `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts:55-75`
  — the documented re-measure procedure
- `oracle/goldens/svg-sequence/README.md` — the "Current state" block, which
  must be refreshed if its figures move (it went stale once already and was
  fixed at the close of `sequence-root-chrome`)
- `../decisions.md#d4` of `plans/sequence-root-chrome/decisions.md` — why the
  **gated** sequence quantity is `weightedScore`, not `diffCount`
- `../decisions.md#d5`

## Write-set

- `oracle/goldens/svg-sequence/diff-baseline.json`
- `oracle/goldens/svg-sequence/diff-census.json`
- `oracle/goldens/svg-sequence/README.md` (only if its figures move)
- `oracle/goldens/svg-description/diff-baseline.json`
- `oracle/goldens/svg-conformance/routing-baseline.json`

Nothing else. If a file outside this set needs changing, **STOP and report it** rather than changing it.

## Acceptance criteria

1. Given a fresh measurement, then every changed entry carries a new measured
   value plus updated `measuredAt` and `measuredAgainstCommit`, and **no
   number is hand-edited to make a gate pass**
2. Given the sequence ratchet, then it gates on `weightedScore` — a risen
   `diffCount` beside a fallen `weightedScore` is expected and is not a failure
3. Given `routing-baseline.json`, then its `known-misroute` count has **fallen**
   and every remaining entry is named in the journal with the reason it
   survives
4. Given `sequence-diff-census.ts` run twice, then `diff-census.json` is
   byte-identical both times — run it twice and diff; do not assume
5. Given any fixture whose measurement **rose**, then it is investigated and
   named with a mechanism, never re-pinned to silence it

## Quality bar

All four gates green — this task is what closes them.

## Observability

This task **is** the observability update: the baselines are the mission's
measurement surface.

## Rollback

Reversible, but only together with batches 2–4. Reverting `src/` alone leaves
baselines pinned to output that no longer exists.

## Boundaries

- **Always:** derive every number from a command you ran, and put the command
  in the journal
- **Never:** hand-edit a measurement; promote a fixture into any
  `ratchet.json`; touch `src/**`
- **Ask first:** if a baseline outside the two named files needs to move

## Commit

One commit: `chore(T8): re-pin the baselines the routing change moved`
