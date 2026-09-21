# Batch 5 — B3 link layout features

Qualifier boxes (`Kal`), `groupInheritance` sametail suppression + shared
triangle, and role labels — all three touch edge geometry and layout in the
same files (`class-edge-geo.ts`, `renderer-edge.ts`) and each moves DOT node
sizes or label reservations for its own fixture set, so they run
sequentially: T15 first (new module, margins), T16 next (needs T15's edge
geo shape to add suppression + the shared triangle without fighting a
concurrent edit to the same functions), T17 last (adds a second label
anchor per end, easiest to reason about once the qualifier-box and grouped-
link geometry are settled). This batch moves layout for all three tasks.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T15 | Qualifier `Kal` box: measure, margins, extremity translate, emit (LNK M1, D6) | typescript-pro (opus) | `class-kal.ts` (new), `class-layout-edge-labels.ts`, `class-dot-graph.ts`, `class-edge-geo.ts`, `renderer-edge.ts`, `style-cascade-class.ts`/`theme-graph-colors-*.ts`, tests | — | [ ] |
| T16 | `groupInheritance`: sametail decor/dash suppression + shared triangle (LNK M7, ENT E11) | typescript-pro (sonnet) | `class-edge-geo.ts`, `renderer-edge.ts`, `renderer-group.ts`, tests | T15 | [ ] |
| T17 | Role labels (LNK M8) | typescript-pro (sonnet) | `class-layout-edge-labels.ts`, `class-edge-label-anchor.ts`, `class-geo-types.ts`, `renderer-edge.ts`, tests | T16 | [ ] |

Specs: [`T15-qualifier-kal.md`](T15-qualifier-kal.md),
[`T16-group-inheritance.md`](T16-group-inheritance.md),
[`T17-role-labels.md`](T17-role-labels.md).
Batch close: [`close.md`](close.md).
