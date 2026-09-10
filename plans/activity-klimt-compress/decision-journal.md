# Decision journal — `activity-klimt-compress`

Appended during execution. One row per non-trivial judgment call: if a
reasonable developer might have chosen differently, log it.

Log the execution plan here at startup (autonomous mode replaces the
user-review step with this entry — `rules/parallelism.md`).

| Date | Task | Decision | Rationale | Evidence |
|---|---|---|---|---|
| 2026-09-10 | plan | Execution plan: B0 T0 (orchestrator) → B1 T1 ‖ T2 (two `typescript-pro` agents in separate worktrees, disjoint write-sets) → B2 T3 → B3 T4 → B4 T5 → B5 T6 (orchestrator). Probe reused from `activity-parallel-connectors`, extended with counts, family tables and `--removed`. | `rules/parallelism.md` autonomous exception: plan logged here instead of user review. B1 runs in worktrees per `.agent-notes/batch-parallelism-needs-worktrees.md`. | `.agent-notes/akc-T0.md` |
| 2026-09-10 | T0 | Chose `pujozo-36-nino158` as the laned-`if` dump and `nomeco-93-minu967` as the `while` dump. | Smallest-scored fixtures whose source has lanes + `if` (no fork/while/repeat) and `while` only (no lanes/fork/if/repeat), so each dump isolates one mechanism. | probe rows sorted by score |
| 2026-09-10 | T0 | Recorded that `Recentred`, not compression, absorbs the jar's leading 14 px `xMargin` on splits; `simuti`'s left residual after T5 is filed to `activity-canvas-margin`, not a target here. | `SlotSet#reverse()` emits only gaps between occupied slots; `AbstractParallelFtilesBuilder.java:130` `xMargin = 14`; `ActivityDiagram3.java:212`. | `.agent-notes/akc-T0.md` |
| 2026-09-10 | T0 | Predicted a 20 px Y removal on `nomeco-93-minu967` (ours only) — named now so T5 does not treat it as an unexplained riser or reserve it. | The out-edge leaves 20 below the action; only a `ULine` sits in `[144,174]`. | `.agent-notes/akc-T0.md` |
