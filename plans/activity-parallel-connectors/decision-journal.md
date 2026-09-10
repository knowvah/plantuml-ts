# Decision journal — `activity-parallel-connectors`

Appended during execution. One row per non-trivial judgment call: if a
reasonable developer might have chosen differently, log it.

Log the execution plan here at startup (autonomous mode replaces the
user-review step with this entry — `rules/parallelism.md`).

| Date | Task | Decision | Rationale | Evidence |
|---|---|---|---|---|
| 2026-09-10 | plan | Execution plan: batches strictly sequential (T0 orchestrator -> T1 -> T2 -> T3 -> T4 -> T5 -> T6), one agent per batch, measured on the subset probe between each. No parallel batches exist in the brief, so no worktrees. | Every task after T1 writes `tile-coordinates.ts` or its siblings; the brief sequences them to attribute movement. | `batch-*/overview.md` |
| 2026-09-10 | T0 | Probe reproduced the baseline exactly: 43977 / 8218, 0 movers, 2 zero-length on `simuti`, 7 jar near-zero on the 3 named fixtures; gates 1260/1260. Recorded the terminator count under two definitions (11 strictly inside a branch; 22 anywhere) rather than the brief's single 21. | The 11 is D5's actual population; the brief's 21 mixes in diagrams that `stop` after the join. | `.agent-notes/apc-T0.md` |
| 2026-09-10 | T0 | Filed for T3: `ParallelBuilderSplit#doStep2` clamps `first`/`last` to `geom.getLeft()` (`:171-176`), which D4's wording omits. Not a contradiction of D4 (an elaboration), so no halt. | The jar's `simuti` bottom line spans `76.025..119.375`, which `first..last over out-branches` alone cannot produce. | `ParallelBuilderSplit.java:171-176`, apc-T0 note |
| 2026-09-10 | T1 | D5 amended, flagged for review: fork's `hasPointOut()` is unconditionally `true`, split's is `hasOut()`. Continued rather than halting, following the precedent of the amb/asr missions (Java-verified, fidelity-increasing, no consumer yet). | `ParallelBuilderFork#doStep2` never builds `FtileKilled`; the join `FtileBlackBlock` has `outY = height` and `appendBottom` takes the lower tile's out point. | `ParallelBuilderFork.java:110-131`, `FtileBlackBlock.java:94`, `FtileGeometryMerger.java:49-53` |
| 2026-09-10 | T1 | Accepted the agent's concrete `true` default on `TileLeaf`/`TileComposite` (every production tile overrides with a citation) instead of abstract members. | Abstract would have forced edits to two test-only subclasses outside the write-set (stop 1); the prompt named this fallback. | `tests/diagrams/activity/tiles/tile.test.ts`, `swimlane-placement.test.ts` |
| 2026-09-10 | T1 | Gate: probe 43977 -> 43977, subset 8218 -> 8218, 0 movers (stop 6 met); typecheck/lint/build green; `npm test` 700 passed + 1 skipped of 701 files; write-set exact; catalog no drift. | | probe run after `1a7c8e33` |
