# Batch 5: residual drive (written at the batch-4 close)

The orchestrator writes this overview and one task spec per residual family at the batch-4
close (close-procedure "Batch-4 extras"), in the batch-2 format, with disjoint write-sets.
Target: D8 (51/51 salt conformant, seed rows pinned).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T5-cov](T5-cov-authored-fixtures.md) | authored MIT-clean fixtures + jar oracles for the corpus's thin spots (`!include`/macros, multi-popup menus, vertical tabs, `{S`/`{SI`/`{S-`, `{^`, `{T#` nesting, `<<sprite>>`, separators, `salt` keyword, scale/title); harness walks `tests/fixtures/salt/` too | typescript-pro (opus) | `tests/fixtures/salt/**`, salt harness files, `oracle/goldens/svg-salt/diff-baseline.json`, `src/diagrams/salt/**` (mechanism fixes) | T4a; approved 2026-10-12 (row 28) | [ ] |
