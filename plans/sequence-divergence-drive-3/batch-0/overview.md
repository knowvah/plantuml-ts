# Batch 0 — branch, tools, b0, pure-move splits

T0a first (branch, tools, pre-split hashes, b0), then T0b in a worktree off
the T0a tip. T0b is a pure move (D1 "Splits"): callers keep importing the old
module, which re-exports what moved. The close replaces classify/pin with a
hash check: every fixture in every engine renders identical to
`$M/b0-hashes-all.json` (stop 7).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-tools-b0.md) | branch, commit brief, copy + adapt tools, b0 measurements, seed ledger | orchestrator | `plans/sequence-divergence-drive-3/**` | — | [x] |
| [T0b](T0b-split-svg-drivers.md) | split `src/core/svg-shapes.ts` (501) and `src/core/klimt/drawing/svg/svg-graphics-core.ts` (500) | refactoring-specialist | those two + their new siblings | T0a | [x] |
| close | merge, gates, all-engine hash check vs b0 | orchestrator | per close-procedure (batch 0 variant) | T0b | [x] |
