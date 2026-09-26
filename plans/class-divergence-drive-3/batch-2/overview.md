# Batch 2 — structure (DOT order, clusters, ids, attributes)

Written by T6 from the batch-0 diagnoses (`diagnosis/*.md`). Every task
re-runs its diagnosis probe first (T6's HIGH-claim spot-check is carried
by each fix task's step 1; journal row 14).

Wave A: T14 ∥ T17 in worktrees (disjoint primaries). Wave B serial in the main checkout: T15 → T16 → T18 → T19 (T14/T16/T18/T19 share `class-dot-graph.ts`, `graph-layout.types.ts`, `svek-dot-emit.ts`, `graph-layout-build.ts`).

| ID | Description | Agent | Primaries | Depends On | Done |
|---|---|---|---|---|---|
| [T14](T14-creation-order-dot.md) | Creation-order DOT emission | typescript-pro (opus) | `src/diagrams/class/class-dot-graph.ts`… | T13 | [x] |
| [T17](T17-assoc-couple-uid.md) | Association couple orientation + subsumed-link uid | typescript-pro (sonnet) | `src/diagrams/class/class-assoc-couple.ts`… | T13 | [x] |
| [T15](T15-opale-single-bezier.md) | Opale single-bezier guard + freestanding scope | typescript-pro (sonnet) | `src/core/svek/image/Opale.ts`… | T14 | [x] |
| [T16](T16-inverted-edge-node-order.md) | printCluster1 / getNodesOrderedTop | typescript-pro (opus) | `src/core/svek-dot-order.ts`… | T15 | [x] |
| [T18](T18-together-clusters.md) | `together {}` as `subgraph cluster<N>t<k>` | typescript-pro (opus) | `src/diagrams/class/class-container.ts` (+ parser state)… | T16 | [x] |
| [T19](T19-layout-attributes.md) | DOT attribute fidelity: weight, searchsize, label-first lines | typescript-pro (sonnet) | `src/diagrams/class/class-dot-edges.ts`… | T18 | [x] |
| [T20](T20-close.md) | Residual round + close | orchestrator | close-procedure | T14, T17, T15, T16, T18, T19 | [x] |
