# Batch 2a: ELK maker + adapter types, harness preload

Starts after batch 1 closes (T1a's `ElkBackend` and T1b's `layoutEngine: 'elk'` merged).
The two tasks run in parallel in worktrees and write disjoint files. Close via
[../close-procedure.md](../close-procedure.md). Every agent prompt is
[../batch-1/task-preamble.md](../batch-1/task-preamble.md) followed by the task file.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-elk-maker-graph-build.md) | port `CucaDiagramFileMakerElk` (graph build + layout + `MinMax`) and define `ElkDiagramAdapter` (D13) | typescript-pro (opus) | `src/core/elk/{CucaDiagramFileMakerElk,ElkDiagramAdapter}.ts` (+tests), `docs/catalog.md` | T1a, T1b | [ ] |
| [T2e](T2e-harness-elk-preload.md) | harness preloads `loadElk()` once per process; full-corpus byte-identity proof (D2d, stop 14) | typescript-pro (sonnet) | `scripts/svg-parity-survey.ts`, `scripts/svg-conformance-census*.ts`, `tests/oracle/svg-conformance/render-fixture-class.ts`, `plans/class-divergence-drive/tools/*.mts` (+tests) | T1a | [ ] |
