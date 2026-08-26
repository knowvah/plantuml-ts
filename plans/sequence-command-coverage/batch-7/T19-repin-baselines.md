# T19 — Re-pin the three baselines and reconcile the tally

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML. Three gates pin this
corpus, and this mission moves all three. Every pin is regenerated **from a
fresh measurement**, never by hand-editing an entry to make a gate pass — both
gate headers say so explicitly, and a fall is re-pinned to `agree`/`ok`, never
the reverse.

T18 has already adjudicated every ratchet rise and fixed every genuine
regression. This task records the result.

## Task

**1. `oracle/goldens/svg-conformance/refusal-baseline.json`** — the 163
`known-gap` pins whose commands now parse become `status: "ok"`, with their
`reason` removed and `measuredAt` / `measuredAgainstCommit` refreshed. A pin
that still gaps keeps `known-gap` and must carry a D7-grade reason: the unported
`Command` named, with its upstream `file:line`.

**2. `oracle/goldens/svg-conformance/routing-baseline.json`** — the 195
sequence `known-misroute` pins become `status: "agree"`.

`kokebo-27-vafi688` also needs re-pinning, for a different reason: it is a
CLASS misroute that **already routes correctly**, and the gate reports its pin
STALE with an explicit request to re-pin it to `agree` from a fresh
measurement. Do that cleanup — but it is **not** a sequence closure and must be
excluded from the bucket tally in step 5. Counting it would inflate the
mission's result by one.

**3. `oracle/goldens/svg-sequence/diff-baseline.json`** — the 195 `status:
"error"` rows become `status: "baseline"` with a **freshly measured**
`weightedScore`, `reason` removed. Fixtures T18 classified `artefact` or
`improved` get their new score. Regenerate `diff-census.json` from the same run.

**4. Hard shape assertions** — `tests/oracle/svg-conformance/refusal-coverage.test.ts:556-565`
asserts literal counts (`3158` fixtures, `8` jar errors, `169` erroring here).
The third moves; update it to the measured value and update the comment above
it so the number has a stated derivation, not just a value.

**5. Reconcile the tally.** The brief's bucket counts came from reason-text
classification with ±1 slop at bucket edges. Produce the exact per-bucket
closed count and record it for T20. If the total diverges from 195 by more than
10%, that is **stop condition 8** — the scope claim was wrong.

**`nuvoja-46-dezu541` is not a command gap.** Its source is `!includedef macro`
and it fails because that macro is absent from the fixture include store. Do
not pin it as a closed command bucket; T20 files it as a harness item.

## Write-set

- `oracle/goldens/svg-conformance/refusal-baseline.json`
- `oracle/goldens/svg-conformance/routing-baseline.json`
- `oracle/goldens/svg-sequence/diff-baseline.json`
- `oracle/goldens/svg-sequence/diff-census.json`
- `tests/oracle/svg-conformance/refusal-coverage.test.ts`
- `findings/tally.md` (new)

## Read-set

- `findings/adjudication.json` (T18) — **the only authorisation to re-pin**
- The `$comment` header of each of the three baseline files — each states its
  own regeneration rule; follow it
- `scripts/svg-conformance-census.ts:168`
- `../prior-observations.md#2` — the store and measurer are mandatory
- `../decisions.md#d5`, `#d6`

## Architecture decisions in force

D5 (locked): only a T18 verdict authorises a re-pin. A rise with no verdict, or
with a `regression` verdict, **must not** be re-pinned.
D6 (locked): a fixture may carry a poor score; that is the filed follow-on. It
may not carry an unmeasured one.

## Interface contracts

Produces `findings/tally.md` for T20: per-bucket closed counts, residuals with
mechanisms, and the reconciled total against the brief's 195.

## Acceptance criteria

- Given all three gates, when run, then all pass and the scoreboard reads
  refusal SLI 2 = 0, routing misroutes = 0, `diff-baseline` errors = 0 — or
  each residual carries a named mechanism.
- Given `kokebo-27-vafi688`, then its stale pin is re-pinned to `agree` from a
  fresh measurement, and it is excluded from the bucket tally.
- Given every re-pinned `diff-baseline` row, then its `weightedScore` came from
  this run's measurement, not from arithmetic on an old value.
- Given `refusal-coverage.test.ts`'s shape assertion, then the count matches
  the measurement and the comment states how it was derived.
- Given `findings/tally.md`, then the reconciled total is within 10% of 195; if
  not, **stop** rather than proceeding to T20.

## Observability

This task sets the mission's final scoreboard.

## Rollback

**Reversible.** The baselines are in-repo and revert with the merge commit.

## Quality bar

All four gates green. Every measurement passes
`tests/helpers/fixture-include-store.ts` and `DeterministicMeasurer`. Read gate
output with `--reporter=verbose`.

## Boundaries

- **Always**: regenerate from a fresh measurement.
- **Never**: hand-edit an entry to make a gate pass; never re-pin without a T18
  verdict; never count `kokebo-27-vafi688` as a sequence closure.
- **Ask first**: if the reconciled tally is outside ±10% of 195 — stop
  condition 8.

## Commit

`test(T19): re-pin refusal, routing and sequence-diff baselines`

Body required: the artefact/regression/improved split, the per-bucket closed
counts, and the derivation of the new shape-assertion number.
