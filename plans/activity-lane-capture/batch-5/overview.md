# Batch 5 — `fork` in and out

Sequential after Batch 4.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6 | Give `fork` its in and out swimlanes | typescript-pro | `src/diagrams/activity/ast.ts`, `node-dispatch.ts` (`tryFork`) or a new `parallel-dispatch.ts`, `layout/tile-layout.ts` (`tileFork`), `layout/walk-fork-branches.ts`, `layout/tile-coordinates.ts` (only if the fork context is built there), `tests/unit/activity/parser-lane-capture.test.ts`, `tests/diagrams/activity/layout/tile-layout.test.ts`, `tests/diagrams/activity/layout/compress/invariant.test.ts` | T5 | [ ] |

Spec: [`T6-fork-in-out.md`](T6-fork-in-out.md). Expected: the `fork` rows of
`fixtures.md` move, and the `bixefi` and `tobajo` entries leave
`ALLOWED_NEW_OVERLAPS`.
