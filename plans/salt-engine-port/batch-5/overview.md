# Batch 5: residual drive (written at the batch-4 close)

The orchestrator writes this overview and one task spec per residual family at the batch-4
close (close-procedure "Batch-4 extras"), in the batch-2 format, with disjoint write-sets.
Target: D8 (51/51 salt conformant, seed rows pinned).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T5a](T5a-chrome-margin-scale.md) | salt export margin + `scale` through the shared chrome path (`finalizeTitledDiagramFragment` margin from the producer, `SALT` routed beside `MINDMAP`); closes `mejeki`, `vuxibo`, probes `common-commands`/`mainframe` | typescript-pro (opus) | `src/core/{assemble-svg,TextBlockExporter,document-margin}.ts`, `src/diagrams/salt/{index,PSystemSalt}.ts` (removal), `src/diagrams/mindmap/index.ts` (margin threading only) | T4a; approved 2026-10-12 (row 35), wave 1 | [x] |
| [T5b](T5b-creole-space.md) | `CommandCreoleSpace` + `AtomSpace` ported into klimt creole, registered at `CommandCreoleBuilder.java:115`'s position; closes `neguge` | typescript-pro (sonnet) | `src/core/klimt/creole/{command/CommandCreoleSpace,atom/AtomSpace,legacy/CommandCreoleBuilder}.ts` | T4a; approved 2026-10-12 (row 35), wave 1 | [x] |
| [T5c](T5c-dark-mode-color-mapper.md) | `ColorMapper` seam on the klimt `UGraphic` so `withDark` partners reach `asPaint()`; probe-only (`skinparam-mode-dark`), not on D8's path | typescript-pro (opus) | `src/core/klimt/drawing/UGraphic*.ts`, `src/core/klimt/color/**`, `src/diagrams/salt/{index,PSystemSalt}.ts` (removal) | T4a, T5a, T5b; **approved 2026-10-12 (row 36), wave 2 with T5-cov** | [ ] |
| [T5-cov](T5-cov-authored-fixtures.md) | authored MIT-clean fixtures + jar oracles for the corpus's thin spots (`!include`/macros, multi-popup menus, vertical tabs, `{S`/`{SI`/`{S-`, `{^`, `{T#` nesting, `<<sprite>>`, separators, `salt` keyword, scale/title); harness walks `tests/fixtures/salt/` too | typescript-pro (opus) | `tests/fixtures/salt/**`, salt harness files, `oracle/goldens/svg-salt/diff-baseline.json`, `src/diagrams/salt/**` (mechanism fixes) | T4a; approved 2026-10-12 (row 28) | [ ] |
