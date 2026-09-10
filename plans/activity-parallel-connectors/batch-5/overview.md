# Batch 5 — cross-lane elbows

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | Fork/split cross-lane edges at `+4` / `−14`; `EdgeMeta.shape` | typescript-pro | `src/diagrams/activity/layout/swimlane-placement.ts`, `src/diagrams/activity/layout/tile-coordinates.ts`, `tests/diagrams/activity/layout/swimlane-placement.test.ts`, `tests/diagrams/activity/layout/tile-coordinates.test.ts` | T2, T4 | [x] |

**Stop condition 10 applies:** lane origins and widths are not touched.
