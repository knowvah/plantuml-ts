# T2 — census `--json` + activity dispatch

## Context
`scripts/svg-conformance-census.ts` renders every cached fixture of a
type through the low-level `renderFixture*` helper with
`DeterministicMeasurer` and buckets the `compareSvg` diff count. It only
PRINTS; nothing reads it programmatically. `renderFixtureFor` (line
219-247) dispatches class/object, state, sequence, json/yaml/hcl, dot, and
falls through to description — `activity` falls through too, although
`tests/oracle/svg-conformance/render-fixture-activity.ts#renderFixtureActivity`
exists. Vitest tests live in `tests/unit/scripts/`.

## Task
1. Add `activity` to `renderFixtureFor`, calling `renderFixtureActivity`
   with the same `{ includeStore: fixtureIncludeStore() }` shape the
   sequence branch uses (check its signature first).
2. Add `--json <path>`: after the deterministic pass, write the file
   below and SKIP the jar pass (like `--per-fixture`). Pure function
   `toCensusJson(type, rows, meta)` exported for tests.
3. Keep every existing flag and printed line unchanged.

## Write-set
`scripts/svg-conformance-census.ts`, `tests/unit/scripts/svg-conformance-census.test.ts` (new)

## Read-set
- `scripts/svg-conformance-census.ts:1-70, 219-262, 300-405`
- `tests/oracle/svg-conformance/render-fixture-activity.ts:1-60` and its
  exported signature
- `tests/oracle/svg-conformance/render-fixture-sequence.ts` exported
  signature (for the call shape)
- `tests/unit/scripts/svg-parity.test.ts:1-40` (test style)

## Architecture decisions
`decisions.md#d5`, `#d2`.

## Interface contracts
`census-<type>.json`:
```
{ generatedAt: string, measuredAgainstCommit: string, type: string,
  measurer: 'deterministic',
  fixtures: [{ slug: string, status: 'ok' | 'error',
               diffCount: number | null,
               bucket: '0' | '1-3' | '4-10' | '11-30' | '31+' | null,
               reason?: string }] }
```
`measuredAgainstCommit` = `git rev-parse --short HEAD` at run time.
Consumed by T6.

## Acceptance criteria
1. Given `activity`, when the census runs, then it calls
   `renderFixtureActivity` (assert via a unit test of the dispatch table,
   or by extracting `helperFor(type)` as a pure exported function).
2. Given `--json out.json`, when the deterministic pass finishes, then
   the file matches the contract and no jar-pass output is printed.
3. Given an erroring fixture, when serialised, then `diffCount` and
   `bucket` are `null` and `reason` is set.
4. Given the same rows, when `toCensusJson` runs twice, then output is
   identical except `generatedAt`.

## Observability
N/A.

## Rollback
Reversible.

## Quality bar
Four gates green. Hook limits (≤30 NLOC, CCN ≤10, file ≤500 — the file
is 405 today; if the addition would cross 500, extract the JSON writer to
`scripts/svg-conformance-census-json.ts` and add it to the write-set via
the journal).

## Boundaries
Never change what the existing text report prints. Never run the census
over a full type in a unit test.

## Commit
`feat(pdr-T2): census --json output and activity dispatch`
