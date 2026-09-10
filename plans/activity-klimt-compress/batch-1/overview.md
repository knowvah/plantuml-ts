# Batch 1 — the two pure ports, in parallel

Disjoint write-sets; run in separate worktrees
(`.agent-notes/batch-parallelism-needs-worktrees.md`). T1 moves the
polygon family (pre-named); T2 moves nothing.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `ArrowsRegular` as the shared arrowhead | typescript-pro | `src/diagrams/activity/arrows-regular.ts`, `src/diagrams/activity/renderer.ts`, `tests/unit/activity/arrows-regular.test.ts`, `tests/unit/activity/renderer.test.ts` | — | [x] |
| T2 | `Slot`, `SlotSet`, `CompressionTransform` | typescript-pro | `src/diagrams/activity/layout/compress/slot.ts`, `compression-transform.ts`, `tests/diagrams/activity/layout/compress/slot.test.ts`, `compression-transform.test.ts` | — | [x] |

**Stop condition 6 applies to T2:** 42511 exactly. **Stop 7 applies to T1:**
the polygon family is pre-named; any other family that rises needs its own row.
