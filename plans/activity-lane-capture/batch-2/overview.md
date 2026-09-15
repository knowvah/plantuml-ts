# Batch 2 — lane helpers ‖ `if`, in parallel

Disjoint write-sets; run in separate worktrees
(`.agent-notes/batch-parallelism-needs-worktrees.md`). T2 is output-neutral
(aggregate 52954, every delta 0). T3 moves only `if` rows of
[`../fixtures.md`](../fixtures.md). Measure T3 against
`measurements/base.json`, with T2 absent, so the move is attributable.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Move lane helpers out; add `Tile.swimlaneOut` | typescript-pro | `src/diagrams/activity/layout/swimlane-lanes.ts` (new), `layout/swimlane-placement.ts`, `tiles/tile.ts`, `tests/diagrams/activity/layout/swimlane-placement.test.ts` | T1 | [x] |
| T3 | Capture the `if` swimlane at its opener | typescript-pro | `src/diagrams/activity/if-dispatch.ts`, `tests/unit/activity/parser-lane-capture.test.ts` (new) | T1 | [x] |

Specs: [`T2-lane-helpers-swimlane-out.md`](T2-lane-helpers-swimlane-out.md),
[`T3-if-capture.md`](T3-if-capture.md).

**Red allowance** (README): after T3, only the four activity oracle gates may
be red, only on journaled `if` slugs.
