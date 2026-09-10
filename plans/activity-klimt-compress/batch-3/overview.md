# Batch 3 — the transforming pass, pure and unconsumed

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | `compressGeometry`: `UGraphicCompressOnXorY`'s rules on nodes, edges, lanes; ON_X then ON_Y; bounds via the transform | typescript-pro | `src/diagrams/activity/layout/compress/compress-geometry.ts`, `tests/diagrams/activity/layout/compress/compress-geometry.test.ts` | T3 | [ ] |

**Stop condition 6 applies:** 42511 exactly — nothing calls it until T5.
