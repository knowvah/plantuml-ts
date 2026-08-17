# Batch 1 — core building blocks

Two tasks, parallel, disjoint write-sets. T1 moves one fixture; T2 moves none.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Quantifier visibility strip (`focaci`) | `typescript-pro` | `src/core/edge-label-box.ts`, `tests/unit/core/edge-label-box.test.ts`, `oracle/goldens/class/label-size-backlog.json` | — | [x] |
| T2 | Arrow-label font building block (D3), no consumer | `typescript-pro` | `src/core/style-cascade-class.ts`, `src/core/style-map-theme.ts`, `src/core/theme-graph-colors-a.ts`, `src/core/theme.ts` (only if the graph merge list needs keys), `src/core/skinparam-key-handlers.ts`, `src/core/skinparam-accumulator.ts`, `src/core/skinparam-theme-builder.ts`, `src/core/arrow-label-font.ts` (new), `tests/unit/core/style-cascade-class.test.ts`, `tests/unit/style-map-theme.test.ts`, `tests/unit/core/arrow-label-font.test.ts` (new), skinparam tests | — | [x] |

**Batch exit:** all gates; class DOT EQUAL ≥ 699; T2's census/DOT/ratchets
byte-identical to the T1-merged baseline (stop 8).
