# T5 — Wire sequence into the cross-type harness surfaces

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/sequence-oracle-harness`. **No `src/`** — stop 3.

Two existing cross-type surfaces do not know sequence exists. Both are small
edits; the second is not optional.

## Task
1. **`scripts/svg-conformance-census.ts`** — add `sequence` to the type
   dispatch (currently component / usecase / class / object / state / dot /
   json / yaml / hcl), routing through T1's `renderFixtureSequence`. Follow
   the file's own doc comment on how each type's pipeline is dispatched.
2. **`tests/oracle/svg-conformance/oracle-freshness.test.ts`** — add a
   sequence sentinel.

**Read that file's doc comment before touching it.** It exists because a
stale cache silently reported false conformance (`object`: 0/80 reported,
23/80 real), and then **recurred** on `class`/`state`/`usecase` because the
guard had been scoped to a single type. Staleness is a whole-cache property,
so ONE sentinel per type is enough — follow the existing pattern exactly
rather than inventing a per-fixture check.

## Write-set
- `scripts/svg-conformance-census.ts`
- `tests/oracle/svg-conformance/oracle-freshness.test.ts`
- `.agent-notes/g1h-T5.md`

## Read-set
- `scripts/svg-conformance-census.ts` — its doc comment and type dispatch
- `tests/oracle/svg-conformance/oracle-freshness.test.ts` — **doc comment in
  full**, then the sentinel list
- `.agent-notes/g1h-T0.md` (the captured slug list), `g1h-T1.md` (the helper)
- `plans/sequence-oracle-harness/decisions.md` D7, D6

## Acceptance
- Given `npx tsx scripts/svg-conformance-census.ts sequence`, then it reports
  an N/M conformance count without error.
- Given the freshness suite, then a sequence sentinel exists and follows the
  one-per-type pattern.
- Given a deliberately stale sequence sentinel (simulate it in a scratch
  probe, do not commit the simulation), then the suite FAILS — demonstrate
  the guard actually guards.
- Given the existing sentinels, then none is modified.

## Observability
N/A — no new observable operations.

## Rollback
Reversible: two modified files, one commit.

## Quality bar
Four gates green. Probes under `scripts_scratch/T5/`, deleted before you
finish.

## Report (<=300 tokens)
The census output for sequence; the sentinel you added; the evidence that a
stale sentinel actually fails the suite; the four gates.
