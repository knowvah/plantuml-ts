# Batch 1 — edge decorations and the if shapes the renderer lacks

Sequential after Batch 0 (T2 depends on T1's Q3 and Q5). No visible change
on any pin is expected: `arrowhead: false` and `if-label` have no emitter
yet, `if-merge` has no emitter in production, and the repeat migration is
placement-preserving per Q3.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | `ActivityEdgeGeo.arrowhead?: false`; `midArrow` -> `emphasize`; `if-merge` rhombus; `if-label` text; compress boxes | typescript-pro | `src/diagrams/activity/activity-layout-types.ts`, `renderer.ts`, `activity-renderer-shapes.ts`, `layout/compress/shapes-of.ts`, `layout/tile-coordinates.ts` (repeat case ONLY), their tests, `measurements/t2.json` | T1 | [x] |

Spec: [`T2-edge-decorations-and-if-shapes.md`](T2-edge-decorations-and-if-shapes.md).
Expected movers: none. A mover is stop 5 unless Q3 named it.
