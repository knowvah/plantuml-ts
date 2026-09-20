# T4 — DOT parity rows: `n/a (no DOT stage)` + exported module

## Context
`scripts/dot-sync-report.ts --markdown` generates `docs/parity-report.md`
(28 rows from `tests/visual/data/*.json`, `manifestTypes()` line 371).
`markdownRowForType` (line 378-396) prints "not yet measured" for any
type without a cache dir or without an `EXPECTED_TAG` entry (line 62-68:
component, usecase, class, object, state). Sequence, activity, json, yaml,
hcl and dot have caches but no DOT stage upstream (sequence/activity never
call graphviz; json/yaml/hcl/gitgraph are Smetana, `DIVERGENCES.md:17-58`;
dot is a passthrough) and today print "not yet measured", which reads as
unfinished work. The file is 596 lines, over the 500-line complexity hook,
so no edit lands until it shrinks.

## Task
1. Create `scripts/dot-parity-rows.ts` and MOVE (not copy) into it:
   `EXPECTED_TAG`, `TypeRow`, `NOT_MEASURED`, `manifestTypes`,
   `markdownRowForType`, the markdown table/legend emission. Export:
   ```
   export const NON_SVEK_TYPES: ReadonlySet<string>
     // sequence activity json yaml hcl dot gitgraph
   export function dotParityRows(jar: string): TypeRow[]
   export function dotParityMarkdown(rows: TypeRow[], generatedOn: string): string
   ```
   `TypeRow.note` vocabulary: `'—'` · `'n/a (no DOT stage)'` ·
   `'no oracle captured'` · `'no data-diagram-type classification'`.
2. `dot-sync-report.ts` imports these; behaviour of every CLI mode is
   unchanged. File must end under 500 lines.
3. Legend gains one line explaining `n/a (no DOT stage)`.

## Write-set
`scripts/dot-sync-report.ts`, `scripts/dot-parity-rows.ts`,
`tests/unit/scripts/dot-parity-rows.test.ts` (new)

## Read-set
- `scripts/dot-sync-report.ts:1-70, 340-430, 540-596`
- `scripts/dot-sync-fixtures.ts:40-60` (`DATA_DIR`, `CANON_DIR`)
- `docs/parity-report.md` (46 lines, current output)
- `DIVERGENCES.md:17-58`
- `tests/unit/scripts/dot-sync-fixtures.test.ts` (test style)

## Architecture decisions
`decisions.md#d2` (T6 consumes `dotParityRows`), `#d8`.

## Interface contracts
`TypeRow = { type, comparable: number, equal: number, pct: string,
oracleBlind: number, note: string }`. Consumed by T6.

## Acceptance criteria
1. Given sequence/activity/json/yaml/hcl/dot, when rows are built, then
   `note === 'n/a (no DOT stage)'` and `comparable === 0`.
2. Given a manifest type with no cache dir, when rows are built, then
   `note === 'no oracle captured'`.
3. Given the five svek types, when `--markdown` runs before and after the
   extraction, then the numeric cells are identical (paste the diff of
   the two outputs into the journal; only notes and legend may differ).
4. `wc -l scripts/dot-sync-report.ts` < 500.

## Observability
N/A.

## Rollback
Reversible.

## Quality bar
Four gates green; hook limits. `dot-sync-report.ts --markdown` runs
(needs the jar at `oracle/dist/plantuml-oracle.jar`, present).

## Boundaries
Never change any numeric result. Never touch `test-results/`.

## Commit
`refactor(pdr-T4): extract dot-parity-rows with n/a rows for non-svek types`
