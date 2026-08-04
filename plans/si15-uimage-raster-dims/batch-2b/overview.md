# Batch 2b — raster-dims reachability + formula correction (amendment)

Added mid-mission from T4's diagnosis (journal 2026-08-03, flagged): T1's
raster branch is unreachable on the description-engine SIZING path, and the
raster-dims formula must be `Math.round(declared)`, not the raw grid/IHDR
value (jar's PNG raster for a 16×16 grid at scale ~1.077 is 17px,
IHDR-decoded from the oracle's own output).

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|------------|------|
| T6 | Populate raster dims at the sizing resolver; correct the formula at both resolvers; re-measure | typescript-pro | `src/diagrams/description/leaf-sizing-entity.ts`, `src/diagrams/description/render-atoms.ts`, `tests/unit/core/svek/footprint-raster-dims.test.ts`, `tests/unit/creole-img-render.test.ts`, `tests/oracle/svg-conformance/class-usecase-actor.test.ts` (only if pins move) | T1, T3, T4 | [x] |
