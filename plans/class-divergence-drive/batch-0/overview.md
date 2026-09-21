# Batch 0 — B11 pre-flight + ELK ledger

Establishes the baseline every later batch diffs against and builds the
three tools every later batch's close task runs. T0 and T0b write disjoint
files (T0: oracle ledger + docs + `measurements/base.json`; T0b:
`tools/*.mts`) but T0's `base.json` is produced BY T0b's `render-all.mts` —
so T0b's tool must exist before T0's step that calls it. Run T0b first in a
worktree, merge, then T0 in the main tree (or T0 seeds `base.json` from
`diagnosis/scratch-render-one.ts` adapted inline and re-generates it once
T0b lands — either order is fine per the push-forward list, D-push-1).
No layout change; nothing here moves the survey score.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0b | Build `render-diff.mts`, `render-all.mts`, `pin-diff.mts` | typescript-pro | `tools/render-diff.mts`, `tools/render-all.mts`, `tools/pin-diff.mts`, `tools/README.md` | — | [ ] |
| T0 | ELK ledger, baseline census/ratchet/DOT counts, `measurements/base.json` | debugger | `oracle/accepted-divergences.json`, `DIVERGENCES.md`, `docs/parity-report.md`, `measurements/base.json`, `decision-journal.md` | T0b | [ ] |

Specs: [`T0b-tooling.md`](T0b-tooling.md), [`T0-baseline-elk-ledger.md`](T0-baseline-elk-ledger.md).
Batch close: [`close.md`](close.md).
