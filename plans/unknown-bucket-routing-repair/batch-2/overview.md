# Batch 2 — fixes by seam, and the dashboard row

The orchestrator fills the **Fixtures** column from batch 1's fragments
(every `fix-candidate` row grouped by `seam`) and journals the assignment.
A seam with no rows is skipped (push-forward). Tasks run in parallel in
separate worktrees; write-sets are disjoint by directory. A task that
discovers it needs a second seam stops (stop 8).

| ID | Seam | Writes | Fixtures | Depends On | Done |
|---|---|---|---|---|---|
| T7 | class | `src/diagrams/class/**`, its tests, `unknown-ledger/T3-*.json` + `T4-*.json` rows it resolves | from T3, T4 | T3, T4 | [ ] |
| T8 | description | `src/diagrams/description/**`, `src/core/descriptive-keywords.ts`, tests, its ledger rows | from T2, T4, T5 | T2, T4, T5 | [ ] |
| T9 | state | `src/diagrams/state/**`, tests, its ledger rows | from T2, T5, T6 | T2, T5, T6 | [ ] |
| T10 | activity | `src/diagrams/activity/**`, tests, its ledger rows | from T2 | T2 | [ ] |
| T11 | sequence | `src/diagrams/sequence/**`, tests, its ledger rows | from T4, T5, T6 | T4, T5, T6 | [ ] |
| T12 | block-extractor | `src/core/block-extractor.ts`, its tests, its ledger rows | any | batch 1 | [ ] |
| T13 | dashboard | `scripts/parity-dashboard-matrix.ts`, `tests/unit/scripts/parity-dashboard.test.ts`, `docs/parity-report.md` | — | — | [ ] |

Ledger ownership in this batch: a fragment file is written by AT MOST one
task. If T3's rows split across two seams, the orchestrator splits the
fragment into `T3-class.json` / `T3-state.json` BEFORE dispatch and journals
it. Gate after merge: the four gates; `pin-corpus-tree.ts … --dry` lists zero
`fix-candidate` rows; the routing gate reports zero `[CHANGED]` and every
`[FIXED]` line is a fixture this batch claims (paste the list).
