# Batch 5: residual drive (written at the batch-4 close) + authored fixtures

The orchestrator writes one task spec per residual family at the batch-4 close
(close-procedure "Batch-4 extras"), in the batch-1 format, with disjoint write-sets. A family
whose mechanism lives in `src/core/` is a stop-10 report that waits for maintainer approval
before it runs (sep T2f/T2g/T5a/T5b/T5c precedent). T5-cov runs in the last wave, after every
`src/diagrams/wbs/**` fix has merged.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T5-cov](T5-cov-authored-fixtures.md) | authored MIT-clean fixtures + jar oracles for the corpus's thin spots; harness walks `tests/fixtures/wbs/` | typescript-pro (opus) | `tests/fixtures/wbs/**`, salt-style authored manifest `oracle/goldens/svg-wbs/authored-baseline.json`, the wbs harness files, `src/diagrams/wbs/**` (mechanism fixes, except files a parallel task owns) | T4a + the residual tasks | [ ] |

Target: D10 (204/204, pins, bozido slot, 0 losses).
