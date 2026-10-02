# Batch 0 — branch, baseline, ledger, freeze gate

No dependencies. T0a (orchestrator) and T0b (agent, worktree) write disjoint
sets and run in parallel. Batch 1 starts only after both land and `b0` exists.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-baseline-ledger.md) | branch, brief commit, b0 on activity + all engines, ledger corrections, classify tool, mkwt | orchestrator | `plans/activity-divergence-drive/{fixtures.md,measurements/*}`, `scripts/activity-probe-classify.ts`, `tests/unit/scripts/activity-probe-classify.test.ts`, `docs/catalog.md` | — | [x] |
| [T0b](T0b-freeze-gate.md) | `activity.golden.ratchet.test.ts`, `pin-goldens.mts`, `status: "pinned"` across the four baselines' readers | typescript-pro | `tests/oracle/svg-conformance/activity.golden.ratchet.test.ts`, `…/activity.diff-baseline.ratchet.test.ts`, `scripts/repin-activity-{baselines,promote}.ts`, `tests/unit/scripts/repin-activity-*.test.ts`, `plans/activity-divergence-drive/tools/pin-goldens{,.test}.mts`, `oracle/goldens/svg-activity/README.md` | — | [x] |

Close: no measurement close for batch 0 — T0a's `b0` IS the baseline. Tick
both rows, commit `chore(add1-b0): branch, b0 baseline, freeze gate`.
