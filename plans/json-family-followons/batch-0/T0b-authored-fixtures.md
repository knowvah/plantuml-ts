# T0b — authored fixtures and the authored positional measure

Agent: typescript-pro (sonnet, effort high), worktree `jff-T0b`. Include
[../task-contract.md](../task-contract.md). Commit: `test(oracle): authored
json-family title/scale fixtures and positional rows (T0b)`.

## Context
The fix in batch 2 is positional, and positional values bypass the structural
gate (jfp T1c). The positional ceiling (`json-family-positional.ts`) only reads
corpus rows from `test-results/dot-cache/`. This task authors the rows that
exercise title × scale and friends, renders their jar oracles, and makes the
positional measure read authored rows too (D4). It changes NO `src/` file and
NO pin file — the batch close seeds both gates.

## Task
1. Author the 8 fixtures in [../fixtures.md](../fixtures.md) "Authored rows"
   as `tests/fixtures/<type>/<slug>.puml` (follow the existing files'
   `@startjson … @endjson` shape, e.g. `tests/fixtures/json/scale-factor.puml`,
   `title-caption-both.puml`). Keep each minimal: one title/caption/scale
   feature combination over a 2-3 node body.
2. Render each through `scripts/oracle-render.sh <ABSOLUTE tmp dir> <puml>` and
   copy the `.svg` beside its `.puml` unmodified (`cmp` it).
3. Extend `measureResidue` to an `'authored'` source reading
   `tests/fixtures/<type>/<slug>.{puml,svg}` (reuse `AUTHORED_ROOT`,
   `json-family-structural.ts:62-63`; do not duplicate the path). The gate test
   iterates corpus rows as today plus every authored row present in the pin
   file under `authored:<type>/<slug>`. A row in the pin with no fixture on disk
   fails, as corpus rows do. `residue.mts --all` prints both.
4. Item 6, vapoda half: in `tests/oracle/svg-conformance/json-family-structural.ts:84-95`
   (`SMETANA_ROUNDED_CANVAS` JSDoc) drop the `shapes__c.java:253-254` citation —
   that is `poly_init`, not records; only `:1807-1808` applies (jfp ledger,
   `plans/json-family-parity/diagnosis/ledger.md:44-49`) — and name the
   mechanism U-REC (record POINTS rounding with no PAD vs graphviz `INCH2PS`,
   `~/git/graphviz/lib/common/shapes.c:3688-3689`). Comment only; the map is unchanged.
5. Unit-test the new branch (`tests/unit/oracle/json-family-positional.test.ts`):
   key parsing, the authored path, the missing-fixture failure.

## Write-set
`tests/fixtures/{json,yaml,hcl}/<the 8 new slugs>.{puml,svg}`,
`tests/oracle/svg-conformance/json-family-positional.ts`,
`tests/oracle/svg-conformance/json-family-positional.test.ts`,
`tests/oracle/svg-conformance/json-family-structural.ts` (the `SMETANA_ROUNDED_CANVAS` JSDoc only),
`tests/unit/oracle/json-family-positional.test.ts`,
`plans/json-family-followons/tools/residue.mts`.

## Read-set
`tests/oracle/svg-conformance/json-family-positional.ts:60-80,225-265`,
`tests/oracle/svg-conformance/json-family-structural.ts:55-70`,
`tests/oracle/svg-conformance/render-fixture-json.ts:89-131`,
`scripts/oracle-render.sh:1-20`, `oracle/goldens/json-family-positional.json` (shape only).

## Interface contract
See [overview.md](overview.md#interface-t0b--close-b2-exit). Existing callers
of `measureResidue(type, slug)` keep working (source defaults to `'corpus'`).

## Acceptance
- Given each new `.puml`, when re-rendered through `scripts/oracle-render.sh`, then `cmp` against the committed `.svg` is identical.
- Given `residue.mts json title-scale` (authored), then it reports a non-zero canvas `dw` (≈92 per the planning probe) — the pre-fix defect is visible to the gate.
- Given the unchanged corpus pin file, when `json-family-positional.test.ts` runs, then it passes with exactly today's 70 corpus rows (no authored rows are pinned yet).
- Given a pin key `authored:json/does-not-exist`, then the unit test asserts the gate fails naming it.

Observability: N/A. Rollback: Reversible.
