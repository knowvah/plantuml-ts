# Batch 1 — diagnosis, one task per jar-type cohort

Five parallel agents, separate worktrees, **read-only on `src/`**. Each task
writes its ledger fragment and a diagnosis note and nothing else. Every row
ends `fix-candidate { seam, command, size }` or `known-misroute`/`known-gap`
`{ reason }` (or `agree`/`jar-error` if re-measurement says so). The
orchestrator groups all `fix-candidate` rows by `seam` into batch 2's tasks.

| ID | Cohort (`cohorts/TN.tsv`) | n | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|---|
| T2 | activity-jar: `activity-legacy1-example-*` 25 + ACTIVITY→description/class/state/refusals 13 | 38 | typescript-pro | `unknown-ledger/T2-activity-jar.json`, `diagnosis/T2.md` | T0, T1 | [x] |
| T3 | class-jar refusals: `Class-visibility-*` 16 + 3 | 19 | typescript-pro | `unknown-ledger/T3-class-refusals.json`, `diagnosis/T3.md` | T0, T1 | [x] |
| T4 | class-jar misroutes: CLASS→DESCRIPTION 42, →SEQUENCE 3, →STATE 1 | 46 | typescript-pro | `unknown-ledger/T4-class-misroutes.json`, `diagnosis/T4.md` | T0, T1 | [x] |
| T5 | description-, sequence- and state-jar: 12 + 5 + 1 | 18 | typescript-pro | `unknown-ledger/T5-descr-seq.json`, `diagnosis/T5.md` | T0, T1 | [x] |
| T6 | jar NONE: we error 35, NONE→STATE 1 | 36 | typescript-pro | `unknown-ledger/T6-jar-none.json`, `diagnosis/T6.md` | T0, T1 | [x] |

Gate after merge: four gates; `pin-corpus-tree.ts unknown --tree <parked>
--ledger <dir> --dry` reports `unpinned: 0` and lists every `fix-candidate`
row (expected, batch 2 resolves them). Orchestrator then journals the
seam assignment for batch 2.
