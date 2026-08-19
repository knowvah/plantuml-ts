# Batch 3 — Composite geometry (parallel; after Batch 2)

Serialized after Batch 2 because T6 changes the declared leaf sizes that feed
every composite ink walk — measuring composite geometry before that measures
the wrong input. Disjoint write-sets.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T8 | F7 — G4 `clusterPosMap: undefined` fallback at both call sites; stale "jar-verified" comments | general-purpose (Opus, effort high) | `src/diagrams/state/state-composite-geo.ts`, `state-composite-autonom.ts`, `state-composite-concurrent.ts`, `tests/unit/state/state-composite-cluster-ink.test.ts`, ratchet entries | T6, T7 | [x] |
| T9 | F8 — G5 RoundedSouth south-cap ink + G6 self-loop arrowhead ink | typescript-pro | `src/diagrams/state/layout-ink-extent.ts`, `tests/unit/state/layout-ink-extent.test.ts`, ratchet entries | T6, T7 | [x] |

**Expected manifest moves.** T8 → `bajelo-54-dixe684`, `cupesu-59-sajo991`,
`lojeju-04-fadu517`, `nuvura-69-mafe604`, `darime-88-moda428`,
`giniti-22-fexo000`, `lumamo-63-zupa263`, `jetuse-93-gopi146`,
`fotuje-06-fifa085` (+ any composite whose nested cluster was previously
mis-sized — list and confirm jar-ward). T9 → `pacami-67-dafe414`,
`tofezi-64-koda860`, `xojudi-20-keco020`, `decede-10-buvu414`,
`pebepi-32-cati486`, `taxile-56-goca422`, `tigibi-80-zidi137` (+ any composite
with rounded corners / a self-loop — same rule).
