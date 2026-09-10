# Batch 5 — text positioned by x

The largest change: eight `textAnchor` sites, one helper contract.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | Text positioned by `x` per shape, never by `text-anchor` | typescript-pro | `src/diagrams/activity/activity-renderer-shapes.ts`, `src/diagrams/activity/renderer.ts`, `tests/unit/activity/renderer-shapes.test.ts`, `tests/unit/activity/renderer.test.ts` | T1 | [x] |

**Stop condition 9 applies:** if this needs `src/core/svg.ts` or a shared
text helper's contract to change, halt.
