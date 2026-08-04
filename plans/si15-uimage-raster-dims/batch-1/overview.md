# Batch 1 — core fix + sweep (parallel)

Two independent tasks, disjoint write-sets. T1 is the mission's point; T2 is
SI14 T5's named follow-up. Both are safe to run concurrently — T1 never
touches `src/diagrams/class/` sources, T2 never leaves them (plus tests).

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|------------|------|
| T1 | `UImage`/`ResolvedAtomImage` raster dims; `Footprint.drawImage` guarded raster−1; re-pin the sprite fixture with measured post-fix values | typescript-pro | `src/core/klimt/shape/UImage.ts`, `src/diagrams/description/render-atoms.ts`, `src/core/svek/image/{Footprint,EntityImageDescriptionTextBlock,EntityImageDescriptionDelegates}.ts`, `tests/oracle/svg-conformance/class-usecase-actor.test.ts`, `tests/unit/core/svek/footprint-raster-dims.test.ts` (new) | — | [x] |
| T2 | Delete `atomsWidth` + `tryRenderUSymbol` atom-label fallback closure | typescript-pro | `src/diagrams/class/renderer.ts`, `src/diagrams/class/class-geo-types.ts`, affected class tests | — | [x] |

Every gate must exit 0 at batch close — T1 re-pins
`class-usecase-inline-sprite` itself with the values it MEASURES (the
`image/@width`/`@height` rounding residual survives until T3; that is
expected and stays pinned). Size-deltas `widened 0`; conformant count may
rise (sprite bucket).
