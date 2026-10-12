# Batch 0: branch, b0 baseline, harness, `getWBSDirection`

T0a first (orchestrator, creates the branch and the ledger); T0b and T0c then run in parallel
worktrees (disjoint write-sets).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-b0-ledger.md) | branch, b0 (all engines), ledger, stock-error classification, guide correction | orchestrator | `measurements/b0*`, `fixtures.md`, journal | — | [ ] |
| [T0b](T0b-wbs-harness.md) | wbs harness: render helper, golden + diff-baseline ratchets, goldens tree, pin + re-pin tools | typescript-pro (sonnet) | `tests/oracle/svg-conformance/{render-fixture-wbs.ts,wbs.*.ratchet.test.ts,parity-wbs.json}`, `oracle/goldens/svg-wbs/**`, `measurements/{pin-wbs,repin-wbs-baseline,repin-wbs-routing}.mts` (+ tests, `vitest.config.mts`) | T0a | [ ] |
| [T0c](T0c-wbs-direction.md) | `Direction.getWBSDirection` in its upstream home (D6) | typescript-pro (sonnet) | `src/core/abel/Direction.ts`, `tests/unit/core/abel/Direction.test.ts` (or the existing Direction test file), `docs/catalog.md` | T0a | [ ] |

Close batch 0 with the four gates plus a journal row; no survey re-pin (b0 is the baseline).
