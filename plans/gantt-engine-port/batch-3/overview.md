# Batch 3 — L02–L05 (2779 Java lines)

Upstream layers L02–L05. Three parallel worktrees off the batch-2 close; independent groups (B3). No gantt plugin yet: nothing renders differently, so the close expects
0 movers in all 28 engines. Standard close as `b3`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-ngm-piecewise-openclose.md) | ngm/math piecewise family, OpenClose, NGMAllocation (1486 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×11 + tests | B2 | [ ] |
| [T3b](T3b-timepoint-timescale.md) | TimePoint/TimePointFormat, Moment, base timescales (761 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×9 + tests | B2 | [ ] |
| [T3c](T3c-rect-workinghours-patterns.md) | RectangleTask, WorkingHours, DayPattern, PairOfSomething (532 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×4 + tests | B2 | [ ] |
| close | merge ×3, gates, chain vs b2 (0 movers) | orchestrator | per close-procedure | T3a, T3b, T3c | [ ] |
