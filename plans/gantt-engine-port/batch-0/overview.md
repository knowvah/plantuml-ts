# Batch 0 — branch, b0, fixtures + oracles, gantt harness, capture clock

T0a first (orchestrator). Then T0b and T0c in parallel worktrees off the T0a
tip (disjoint write-sets; T0c's ratchets are dormant and read T0b's fixtures
only after the close). Standard close as `b0` (no movers expected anywhere).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-brief-b0.md) | branch off `1be33f054`, commit the brief, b0 chain + gates | orchestrator | `plans/gantt-engine-port/**`, `.claude/settings.autonomous.json` | — | [x] |
| [T0b](T0b-fixtures-oracles.md) | `vega/xgantt` + authored fixtures with jar oracles | typescript-pro (sonnet) | `tests/fixtures/gantt/**` | T0a | [x] |
| [T0c](T0c-harness-capture-clock.md) | render-fixture-gantt, dormant ratchets, capture-clock sidecar + gate + capture scripts | typescript-pro (sonnet) | see spec | T0a | [x] |
| close | merge, add T0b's `today-implicit` capture to `oracle/capture-clock.json` (the D3c test fails until it is there), gates, b0 ledger + authored-fixture table | orchestrator | per close-procedure | T0b, T0c | [x] |
