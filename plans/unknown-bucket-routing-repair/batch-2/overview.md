# Batch 2 — fixes by seam, and the dashboard row

The orchestrator fills the **Fixtures** column from batch 1's fragments
(every `fix-candidate` row grouped by `seam`) and journals the assignment.
A seam with no rows is skipped (push-forward). Tasks run in parallel in
separate worktrees; write-sets are disjoint by directory. A task that
discovers it needs a second seam stops (stop 8).

| ID | Seam | Writes | Fixtures | Depends On | Done |
|---|---|---|---|---|---|
| T7 | class | `src/diagrams/class/**`, its tests, `unknown-ledger/{T2-class,T3-class-refusals,T4-class-misroutes,T5-class}.json` | 66: T2 3 · T3 17 · T4 43 · T5 3 | T3, T4 | [x] |
| T8 | description | `src/diagrams/description/**`, `src/core/descriptive-keywords.ts`, tests, `unknown-ledger/{T3-description,T5-descr-seq}.json` | 6: T3 1 · T5 5, plus the D11 narrowing for T2's 5 cross-seam rows (no rows of its own) | T2, T4, T5 | [x] |
| T9 | state | `src/diagrams/state/**`, tests, `unknown-ledger/T6-jar-none.json` | 1: T6 1 | T2, T5, T6 | [x] |
| T10 | activity | `src/diagrams/activity/**`, tests, `unknown-ledger/T2-activity-jar.json` | 34: T2 34 (5 cross-seam, D11; dispatched after T8 lands) | T2, T8 | [x] |
| T11 | sequence | `src/diagrams/sequence/**`, tests, `unknown-ledger/{T4-sequence,T5-sequence}.json` | 9: T4 3 · T5 6 | T4, T5, T6 | [x] |
| T12 | block-extractor | `src/core/block-extractor.ts`, its tests, its ledger rows | 0 — SKIPPED (push-forward) | batch 1 | [x] |
| T13 | dashboard | `scripts/parity-dashboard-matrix.ts`, `tests/unit/scripts/parity-dashboard.test.ts`, `docs/parity-report.md` | — | — | [x] |

Ledger ownership in this batch: a fragment file is written by AT MOST one
task. If T3's rows split across two seams, the orchestrator splits the
fragment into `T3-class.json` / `T3-state.json` BEFORE dispatch and journals
it. Gate after merge: the four gates; `pin-corpus-tree.ts … --dry` lists zero
`fix-candidate` rows; the routing gate reports zero `[CHANGED]` and every
`[FIXED]` line is a fixture this batch claims (paste the list).
