# Batch 0 — branch, b0, ledger, element census; harness-parity gate

No dependencies. T0a (orchestrator) and T0b (agent, worktree) write disjoint
sets and run in parallel. Batch 1 starts only after both land and `b0` exists.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-baseline-ledger.md) | branch, brief commit, b0 (all engines), ledger, `activity-probe-elements.ts` | orchestrator | `plans/activity-divergence-drive-2/{fixtures.md,decision-journal.md,measurements/*}`, `scripts/activity-probe-elements.ts`, `tests/unit/scripts/activity-probe-elements.test.ts` | — | [ ] |
| [T0b](T0b-harness-parity.md) | `activity.harness-parity.test.ts` (D4) | typescript-pro | `tests/oracle/svg-conformance/activity.harness-parity.test.ts` | — | [ ] |

Close: no measurement close — T0a's b0 IS the baseline. Tick both rows, commit
`chore(add2-b0): branch, b0 baseline, harness-parity gate`.
