# Batch 4 — `repeat` in and out

Sequential after Batch 3.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | Give `repeat` its opener and out swimlanes | typescript-pro | `src/diagrams/activity/ast.ts`, `node-dispatch.ts` (`tryRepeat` only), `layout/tile-layout.ts` (`tileRepeat` only), `layout/tile-coordinates.ts` (only if T1's table requires), `tests/unit/activity/parser-lane-capture.test.ts`, `tests/diagrams/activity/layout/tile-layout.test.ts` | T4 | [x] |

Spec: [`T5-repeat-in-out.md`](T5-repeat-in-out.md). Expected movers: the
`repeat` rows of `fixtures.md`. **Stop 7 applies:** the six `*` rows reach
`ConnectionBackComplex1`. Journal them against `activity-repeat-entry-diamond`;
never port it.
