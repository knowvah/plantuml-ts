# Batch 4 — text fix; container classification; xagonu self-loop xlabels; stroke-width/rx-ry

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T7 | Text x/y fix from the T6 artifact | typescript-pro | the files T6 named (see spec) | T6 | [x] |
| T8 | Container classification `foo1.foo2` (gerebe, jafexe) | typescript-pro | `parse-state.ts`, `layout-classify.ts`, `namespace-groups.ts` | T0 | [x] |
| T9 | xagonu self-loop xlabel TABLEs (TRACKER #16) | typescript-pro | `link-edge-attrs.ts`, `layout-dot-tree.ts` (edge part) | T0b | [x] |
| T10 | stroke-width / rx-ry | typescript-pro | `renderer-entity.ts` (+ resolution files) | T1c | [x] |

**One writer per file, decided at batch start.** Compare T6's fixer write-set with T8–T10's.
- If T7 needs `renderer-entity.ts`, collapse T10 into the T7 agent: one agent, both specs, two commits.
- If T7 needs `layout-dot-tree.ts`, collapse T9 into T7 the same way.

Journal the decision. All four start in parallel only where the write-sets are disjoint.
Close: [../close-procedure.md](../close-procedure.md).
