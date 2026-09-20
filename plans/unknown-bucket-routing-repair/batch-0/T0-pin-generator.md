# T0 — `scripts/pin-corpus-tree.ts`, the committed pin generator

## Context
plantuml-ts (TypeScript port of PlantUML; the jar is the oracle). Two gates
walk `test-results/dot-cache/**` and fail on any fixture missing from
`oracle/goldens/svg-conformance/routing-baseline.json` /
`refusal-baseline.json`. Three missions in a row pinned new trees with a
scratch script; this task commits the tool. The measurement it must reproduce
EXACTLY is the gates' own: `renderSync(markup, { measurer: new
DeterministicMeasurer(), includeStore: fixtureIncludeStore() })`; jar type =
`data-diagram-type="([A-Z]+)"` in the golden's first 4096 bytes else `NONE`;
`isJarErrorPage` = `/>(?:PlantUML version [^<]*\[[^<]*\]|An error has
occurred[^<]*)<\/text>/` on that head; `weErrored` = our whole document
contains `>${fullDescription()}</text>`; `engine` = `(Assumed diagram type:
X)` when errored else our root type lower-cased else `none`. Row shapes are in
the two baselines (see read-set).

## Task
```
npx jiti scripts/pin-corpus-tree.ts <type> --tree <dir> --ledger <dir> [--dry]
```
- `--tree` defaults to `test-results/dot-cache/<type>`; `--ledger` to
  `tests/oracle/svg-conformance/unknown-ledger` (a DIRECTORY of `*.json`
  fragments, D4 row shape; merged by slug; a slug in two fragments is an error).
- Measure every `<tree>/<slug>/{in.puml,in.svg}`; derive per fixture:
  routing status `jar-error` (jarErrored; row carries `jarErrored: true`),
  `agree` (jarType === ourType), else `known-misroute` + ledger `reason`;
  refusal status `jar-error` (`jarRendered: false`), else `ok`
  (`weErrored: false`), else `known-gap` + ledger `reason`.
- Refuse (exit 1, nothing written) when: a measured misroute or refusal has
  no ledger row or no `reason`; a reason fails `/\w+\.java:\d+/`; a
  pre-existing baseline row would change (compare the JSON of the existing
  `fixtures` prefix byte-for-byte after write-back); a ledger row is
  `fix-candidate` (batch 2 must resolve it first).
- `--dry` prints the tally (per cohort × routing status × refusal status,
  plus `unpinned` = measured rows with no usable ledger row) and writes
  nothing. Without `--dry`, append rows in slug order, `measuredAt` =
  today (`date +%Y-%m-%d`), `measuredAgainstCommit` = `git rev-parse
  --short=8 HEAD`, append one sentence to each `$comment`, write with
  `JSON.stringify(..., null, 2) + '\n'`.
- Pure and exported: `deriveRow(measured, ledgerRow)` → `{ routing, refusal }`
  and `checkAdditive(before, after)`; the measurement loop stays impure.

## Write-set
`scripts/pin-corpus-tree.ts`, `tests/unit/scripts/pin-corpus-tree.test.ts`.

## Read-set
- `tests/oracle/svg-conformance/routing-conformance.test.ts:110-175`
  (`diagramTypeOf`, `isJarErrorPage`, `readHead`) and
  `refusal-coverage.test.ts:130-195` (`weErroredIn`, `engineOf`)
- `scripts/repin-sequence-baselines.ts:1-60` (orchestrator-only header,
  measurement seams, `today`/`commit`)
- `oracle/goldens/svg-conformance/routing-baseline.json` and
  `refusal-baseline.json`: first 3 entries, one `known-misroute` entry (grep
  `bomino-39-tipo216`), one `jar-error` entry (grep `luzive-62-zote562`), one
  `known-gap` entry (grep `jiliba-03-lapi286`)
- `plans/unknown-bucket-routing-repair/decisions.md#d4`, `#d5`
- `tests/unit/scripts/dot-parity-rows.test.ts` (hermetic temp-tree style)

## Architecture decisions
D4 (row shape), D5 (this tool; orchestrator-only), D6 (`--tree` exists so
the parked tree can be measured without moving it).

## Interface contracts
Ledger fragment = `{ rows: LedgerRow[] }` with the D4 row. Baseline rows
exactly as the existing files' shapes (routing: `tree,type,slug,jarType,
[jarErrored],ourType,status,measuredAt,measuredAgainstCommit,[reason]`;
refusal: `tree,type,slug,jarRendered,weErrored,engine,status,measuredAt,
measuredAgainstCommit,[reason]`). Consumed by T1 (schema), T14 (the run).

## Acceptance criteria
1. Given a temp tree of 4 fixtures (agree, jar error page, misroute with
   reason, refusal with reason) and a ledger dir, when run with `--dry`,
   then the printed tally matches and nothing is written.
2. Given a measured misroute whose ledger row has no reason, when run,
   then it exits 1 naming the slug and both baselines are byte-unchanged.
3. Given a ledger row `fix-candidate`, when run without `--dry`, then it
   refuses naming the slug.
4. Given a run that would alter a pre-existing row (inject a changed copy in
   the test), when `checkAdditive` sees it, then it refuses.
5. Given the 4-fixture tree, when run for real against copies of the two
   baselines in the temp dir (paths injectable), then both gain exactly 4
   rows in slug order and every pre-existing row is byte-identical.

## Observability
N/A — a CLI tool; its refusals are its alarms.

## Rollback
Reversible: one new script, one new test.

## Quality bar
Hook limits (≤30 NLOC/function, CCN ≤10, ≤5 params, ≤500 lines — split a
`pin-corpus-tree-measure.ts` if needed and say so). `npx vitest run
tests/unit/scripts/pin-corpus-tree.test.ts` (1 file collected), typecheck,
lint. Never invoke the jar; never read the real baselines in a unit test
except read-only for a shape check.

## Boundaries
Never write the real baselines from this task. Never touch `test-results/`.

## Commit
`feat(ubrr-T0): commit the corpus-tree pin generator`
