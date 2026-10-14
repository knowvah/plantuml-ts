# T1g: `PSystemDonors` + `PSystemSkinparameterList`

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (sonnet).

## Task (TDD)
Complete `donors/PSystemDonors.java` (180; T0c landed `getCols`) + `PSystemDonorsFactory.java`
(`(?i)^(donors)\s*$`, java:49) over T0e's `DONORS`, and `donors/PSystemSkinparameterList.java` (112)
+ `PSystemSkinparameterListFactory.java` (`(?i)^(skinparameters)\s*$`, java:48) over T0e's
`SKINPARAMETER_NAMES`. No corpus rows: jar values from authored probes via `scripts/oracle-render.sh`
(commit the probes under `tests/fixtures/utility/` as `<slug>.puml` + `<slug>.svg`).

## Write-set
`src/diagrams/donors/{PSystemDonors,PSystemDonorsFactory,PSystemSkinparameterList,PSystemSkinparameterListFactory}.ts`, `tests/fixtures/utility/{donors,skinparameters}.*`, their unit tests under `tests/unit/` (mirror the source path), `docs/catalog.md`,
`.agent-notes/ufp-T1g.md`. Any OTHER file is a stop — in particular NOT `src/index.ts` (T2a
registers every plugin) and not `oracle/goldens/**`.

## Interface contract (→ T2a)
Export `donorsPlugin`, `skinparameterListPlugin` (a `singleLinePlugin`, or the base-class plugin shape T0c landed) and the
factory's accept function; record the exact export names in the report.

## Acceptance
- Given the `donors` and `skinparameters` probes, then compareSvg has zero diffs (or residuals named).
- Given a line the factory does not accept (and a 4-line source), then it refuses.
- Given each corpus row rendered three times, then the outputs are identical.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
