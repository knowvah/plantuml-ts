# Batch 3: residual drive (written at the batch-2 close) + authored fixtures

The orchestrator writes one task spec per residual family at the batch-2 close
(`../close-procedure.md` "Batch-2 extras"), with disjoint write-sets. A family whose mechanism
lives in `src/core/` is a stop-10 report that waits for maintainer approval before it runs.
T3-cov runs in the last wave, after every residual fix has merged.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3-cov](T3-cov-authored-fixtures.md) | authored fixtures + jar oracles for every factory without a corpus row; harness walks `tests/fixtures/utility/` | typescript-pro (opus) | `tests/fixtures/utility/**`, `oracle/goldens/svg-utility/authored-baseline.json`, the utility harness files, utility package dirs (mechanism fixes, except files a parallel task owns) | T2a + the residual tasks | [ ] |

Target: D11.
