# Batch 5 — G15 composite-anchor spline clip (serial)

PlantUML clips a cluster-sourced edge at the cluster rectangle **in Java** —
`DotPath#simulateCompound`, called from `SvekEdge.java:671-672` — not through
graphviz. We keep the in-cluster segment the jar clips away, so its control
point lands inside the composite and inflates the ink extent by exactly the
distance from that control point to the cluster's frontier: **+7.820 px** on
`fovafu-44-mifu394`.

Reclassified 2026-08-19 from `docs/graphviz-issues/15-*` — originally filed as
a dot-engine ranking defect, proven not to be one. dot-engine reproduces native
graphviz byte-for-byte on this fixture's own DOT and on five hand-built
variants; the jar and graphviz compute the same curve. The work is ours.

**This is a shared-seam extraction, not a local patch.** The faithful
`simulateCompound` port already exists at
`src/diagrams/description/spline-clip.ts`, and `layering.test.ts` Rule 2
forbids `src/diagrams/state/` importing it. It moves to `src/core/` first —
the SI27 pattern — then both engines consume it. Duplicating it is forbidden.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | Move `spline-clip.ts` to `src/core/`, repoint description, clip state composite-anchor transitions before the ink walk | general-purpose (opus) | `src/core/spline-clip.ts` (new), `src/diagrams/description/spline-clip.ts` (deleted), description's importers, `src/diagrams/state/layout-ink-extent.ts`, their unit tests | T4 | [x] |
