# Batch 2 — Golden ratchet · cause census · cross-type wiring (PARALLEL)

Three tasks with disjoint write-sets, all depending on T2's pinned baseline.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Golden ratchet (ships EMPTY) + the directory README | typescript-pro (sonnet) | `tests/oracle/svg-conformance/sequence.golden.ratchet.test.ts`, `oracle/goldens/svg-sequence/ratchet.json`, `oracle/goldens/svg-sequence/README.md`, `.agent-notes/g1h-T3.md` | T2 | [x] |
| T4 | Cause classifier + census, computed by committed code | general-purpose (opus) | `tests/oracle/svg-conformance/sequence-diff-census.ts`, `tests/oracle/svg-conformance/sequence-diff-census.test.ts`, `oracle/goldens/svg-sequence/diff-census.json`, `.agent-notes/g1h-T4.md` | T2 | [x] |
| T5 | Wire sequence into the two cross-type harness surfaces | typescript-pro (sonnet) | `scripts/svg-conformance-census.ts`, `tests/oracle/svg-conformance/oracle-freshness.test.ts`, `.agent-notes/g1h-T5.md` | T0, T1 | [x] |
