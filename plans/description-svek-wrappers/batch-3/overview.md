# Batch 3 — wrappers (port + kermor); dashboard regen

T4 and T5 have disjoint write-sets and run in parallel after batch 2 merges.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Description wrappers: port (`hasPort`) and kermor families (D6) | `dsw-wrappers` resumed via `SendMessage` | `src/diagrams/description/layout-dot-tree.ts`, `src/diagrams/description/layout.ts`, `tests/unit/description/description-svek-wrappers.test.ts` | T3 | [x] |
| T5 | Dashboard `layoutEqual` column; regenerate `dot-parity.json` + `docs/parity-report.md` with tightened dotEqual | typescript-pro (sonnet) | `scripts/parity-dashboard*.ts`, `scripts/dot-parity-rows.ts`, `tests/unit/scripts/parity-dashboard.test.ts`, `tests/oracle/svg-conformance/dot-parity.json`, `docs/parity-report.md` | T1b, T2 | [x] |

T5 regenerates from the **batch-2 close** survey outputs. The batch-3 close regenerates the report again
after T4 merges (close step 8), so T5's committed numbers are an intermediate state, by design.

| T4b+T4c | Core a/i for linked port groups; kermor alpha/beta/gamma (stop-7 ruling, journal 32) | dsw-wrappers | core + description, [T4bc spec](T4bc-core-port-kermor-wrappers.md) | T4 | [x] |
| T4d | Group header sprite stereo / title sprite / title creole (journal 38) | typescript-pro | description, [T4d spec](T4d-group-header-sprites-creole.md) | T4, T5 | [x] |

Close: [../close-procedure.md](../close-procedure.md).
