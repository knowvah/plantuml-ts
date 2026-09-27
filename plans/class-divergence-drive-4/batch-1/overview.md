# Batch 1 — independent work (all parallel)

Primaries are disjoint, so run them in worktrees (memory: parallel batches
need worktrees; link test-results children; no Serena edit tools inside a
worktree). Merge onto the branch serially: T1, T2, T4, T3, T5, T6, T7a. Then
run the close procedure (N=1).

| ID | Description | Agent | Primaries | Depends On | Done |
|---|---|---|---|---|---|
| [T1](T1-acceptances.md) | Sign luzive, sadamo, zuduxu | orchestrator | `oracle/accepted-divergences.json` | T0e | [x] |
| [T2](T2-besepi-oracle.md) | Re-render besepi oracle (D5) | orchestrator | besepi oracle SVG + `test-results/dot-cache/class/besepi-37-rori892/` | T0e | [x] (closed open: jar drift, row 7) |
| [T3](T3-tracker-residuals.md) | Re-verify still-open G rows, TRACKER | debugger (sonnet) | `docs/graphviz-issues/**` | T0e | [x] (n/a: no open G rows after T0d) |
| [T4](T4-census-harness.md) | Census sprite store + popesa pipeline | typescript-pro (sonnet) | `scripts/svg-conformance-census.ts` + its unit test | T0e | [x] |
| [T5](T5-diagnose-p-rows.md) | Diagnose jakapi, lecelo, gujigi | debugger (opus) | `diagnosis/*.md`, `diagnosis/scratch/` | T0e | [x] |
| [T6](T6-sokevu-description.md) | E3-9 patch + E3-10b hasPort | typescript-pro (opus) | `src/diagrams/description/{index,layout-helpers-types,renderer}.ts`, `src/core/svek-dot-emit-clusters.ts`, tests | T0e | [x] |
| [T11](T11-unplaced-label-consumer.md) | gvi 25 consumer: skip unplaced edge label | typescript-pro (sonnet) | `src/core/graph-layout*.ts` (read), `class/class-edge-geo.ts`, tests | T0e | [x] |
| [T7a](T7a-theme-execution.md) | Theme sources + `executeTheme` port | typescript-pro (opus) | `scripts/build-theme-sources.ts` (new), `src/core/themes-source*.ts` (generated), `src/core/tim/{TContext,EaterTheme}.ts`, tests | T0e | [x] |

T6's `svek-dot-emit-clusters.ts` is shared by no other batch-1 task. If T5's
fix shapes need it, the batch-2 tasks run after T6 merges.
