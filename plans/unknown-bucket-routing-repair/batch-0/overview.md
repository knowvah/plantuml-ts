# Batch 0 — tooling and the settled rows

Two independent tasks; run in parallel, separate worktrees (link the CHILDREN
of `test-results/`; no Serena edit tools).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | `scripts/pin-corpus-tree.ts` — committed pin generator (D5) + unit test | typescript-pro (sonnet) | `scripts/pin-corpus-tree.ts`, `tests/unit/scripts/pin-corpus-tree.test.ts` | — | [x] |
| T1 | ledger fragment for the 668 settled rows (agree 538, jar-error 26, no-engine 96, files 8) | typescript-pro (sonnet) | `tests/oracle/svg-conformance/unknown-ledger/T1-settled.json` | — | [x] |

Gate after merge: the four gates, plus `npx jiti scripts/pin-corpus-tree.ts
unknown --tree test-results/dot-cache-unknown-2026-09-20 --ledger
tests/oracle/svg-conformance/unknown-ledger --dry` prints a tally whose
`unpinned` count equals 157 (the batch-1 rows) and whose `additive` check
passes — proves T0 and T1 agree on the schema before batch 1 depends on it.
