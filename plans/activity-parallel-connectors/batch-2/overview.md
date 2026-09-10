# Batch 2 — connectors and dedupe

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Fork/split connectors as vertical drops at branch x, `hasPointOut` gating, `pushEdge` dedupe, drop the `===` collapse | typescript-pro | `src/diagrams/activity/layout/tile-coordinates.ts`, `src/diagrams/activity/routing/gconnection-side-then-vertical-then-side.ts`, `tests/diagrams/activity/layout/tile-coordinates.test.ts`, `tests/diagrams/activity/routing/gconnection.test.ts` | T1 | [x] |

**Stop condition 7 applies.** The pre-planned outcome: `simuti-16-lece058`
falls below 219 with zero zero-length segments; the 21 detach fixtures lose
their spurious join edges. Any riser needs a mechanism before the commit.
