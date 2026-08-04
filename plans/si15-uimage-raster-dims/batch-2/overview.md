# Batch 2 — emission rounding + ink-offset diagnosis (parallel)

Both depend on T1 (batch 1). Disjoint write-sets: T3 writes the SVG driver,
a fixture, and the conformance pins; T4 writes `.agent-notes/` only.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|------------|------|
| T3 | Round emitted `<image>` dims when raster-backed (D9 Am.1); jar-verify `<img>` first | typescript-pro | `src/core/klimt/drawing/svg/driver-image-svg.ts`, `tests/oracle/svg-conformance/class-usecase-actor.test.ts`, new authored fixture + golden under `oracle/goldens/`, unit test | T1 | [ ] |
| T4 | Re-measure SI14 T2's ~0.9px ink-offset `text+sprite` divergence; close with evidence or file it | debugger | `.agent-notes/si15-ink-offset.md` (create) | T1 | [ ] |

Gate note: T3 re-pins `class-usecase-inline-sprite` again (the
`image/@width`/`@height` entries should clear). Exit 0 on all gates at
batch close; `widened 0`.
