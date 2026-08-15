# Batch 1 — gate, order function, byte-identical fold

Three independent pieces; nothing draws differently yet. T1 pins the
starting numbers, T2 builds the ordering as a pure AST function with its own
tests, T3 folds the two arrays into one (concatenation order) so T4 has only
to sort and loop.

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | `--vs-jar` over all fixtures + `--check-order`; capture baselines | typescript-pro | `scripts/note-order-report.ts`, `plans/leaf-draw-order/baseline/*` | — | [x] |
| T2 | `computeLeafDrawOrder(ast)` — jar's `printGroups`/`printEntities` order | typescript-pro | `src/diagrams/class/class-leaf-order.ts`, `tests/unit/class/class-leaf-order.test.ts` | — | [x] |
| T3 | Fold `classifiers`+`notes` into `leaves` (`ClassLeafGeo`), byte-identically | typescript-pro | `src/diagrams/class/{class-geo-types,note-layout-types,note-layout-tip,note-opale,note-tips-resolve,layout,class-geo-builders,class-ink-box,layout-ink-extent,renderer,renderer-uid,renderer-note}.ts`, `tests/unit/class/*` | — | [x] |

Parallel: disjoint write-sets. T1 must capture its baselines from the base
commit BEFORE T3's changes exist in the tree — run T1 first (it is ~10 min),
or capture on a clean checkout of the base commit.

## Batch exit bar

1. `--vs-jar` reports exactly `same=678 order-only=47 other=77`;
   `--check-order` vs `baseline/note-order.txt` reports 0 moved.
2. `computeLeafDrawOrder` passes its four acceptance cases (T2).
3. `ClassGeometry.notes` and `.classifiers` no longer exist; every consumer
   reads `leaves`; all four gates green; shape-match/DOT-sync diff-empty.
