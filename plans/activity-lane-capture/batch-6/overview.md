# Batch 6 — `split` in and out

Sequential after Batch 5. Same files as T6.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T7 | Give `split` its in and out swimlanes | typescript-pro | `src/diagrams/activity/ast.ts`, `node-dispatch.ts` (`trySplit`) or `parallel-dispatch.ts`, `layout/tile-layout.ts` (`tileSplit`), `layout/walk-fork-branches.ts`, `layout/tile-coordinates.ts` (only if needed), `tests/unit/activity/parser-lane-capture.test.ts`, `tests/diagrams/activity/layout/tile-layout.test.ts`, `tests/diagrams/activity/layout/compress/invariant.test.ts` | T6 | [ ] |

Spec: [`T7-split-in-out.md`](T7-split-in-out.md). Expected: the `split` rows
move, `jevoce`'s T1 mechanism is resolved (stop 5), and the `bugaja`,
`racana` and `maketa` entries leave `ALLOWED_NEW_OVERLAPS`, or are
re-attributed per stop 8.
