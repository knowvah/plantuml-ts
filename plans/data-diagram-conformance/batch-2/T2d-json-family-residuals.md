# T2d — json/yaml/hcl authored residuals: every row not clean after T1a/T1e

Agent: `typescript-pro` (sonnet, effort high), worktree `ddc-T2d`. Commit:
`fix(json): <families closed> (T2d)` (scope `yaml`/`hcl` when the origin is
their parser). Read [../task-contract.md](../task-contract.md) and
`fixtures.md`'s b1 residual list first. Diagnosis mode per family.

## Task
For every authored json/yaml/hcl row (T1e) and every corpus row with
structural diffs at the b1 close (outside the 3 ceilings):
`npx tsx $T/diff-one.mts <type> <slug> --structural`, group by firstDiff
family, trace to the Java (`TextBlockJson.java`, `JsonDiagram.java`,
`JsonDiagramFactory.java`, `StyleExtractor.java`, `yaml/parser/*`,
`hcl/HclParser.java`, `plantuml.skin:456-470,757-780`) and fix at the
origin. A geometry-only residual (positional attrs, root dims) is NOT a
defect — the gate already excludes it; a row whose only non-positional diff
is a Smetana integer-rounding artefact (`json-family-structural.ts:84-96`
pattern) is REPORTED for the user to decide (stop 9), never excused in code.

## Write-set
`src/diagrams/json/*` EXCEPT `JsonObject.ts`, `json-layout-prep.ts`,
`json-renderer-highlight.ts` (T2b's); `src/diagrams/yaml/*`,
`src/diagrams/hcl/*`; `tests/unit/{json,yaml,hcl}/*` except
`tests/unit/json/{JsonObject,highlight-dup-keys}.test.ts`. Needing one of
T2b's files is stop 1.

## Acceptance
- Given every row in the b1 residual list, when `diff-one.mts --structural` runs, then 0 diffs — or the hand-back names the row, mechanism, origin and the reason it is outside the write-set or a stop-9 candidate.
- Pinned json/yaml/hcl goldens byte-equal; every manifest `clean` row still clean; ceilings not exceeded.
- `npx vitest run tests/unit/json tests/unit/yaml tests/unit/hcl tests/oracle/svg-conformance/json-family-structural.test.ts tests/oracle/svg-conformance/{json,yaml,hcl}.golden.ratchet.test.ts --maxWorkers=2 --coverage.enabled=false` green.

Observability: N/A. Rollback: Reversible.
