# Batch 2 — L00–L01 (3563 Java lines)

Upstream layers L00–L01. Four parallel worktrees off the batch-1 close; the four groups share no references (`diagnosis/upstream-batch-groups.txt` B2). No gantt plugin yet: nothing renders differently, so the close expects
0 movers in all 28 engines. Standard close as `b2`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-time-instant-ngm-core.md) | PValue, time/Instant, ngm/Load, ngm/math Fraction/Segment/TimeDirection (+ D5 bound test) (1021 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×7 + tests | B1 | [x] |
| [T2b](T2b-time-utils-weeks.md) | time Month/DayOfWeek utils, WeekNumberStrategy, TimeResolution, WeekConfigData, WeeklyHeaderStrategy (460 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×6 + tests | B1 | [x] |
| [T2c](T2c-core-data-types.md) | small core/data types and styles (956 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×12 + tests | B1 | [x] |
| [T2d](T2d-grammar-leaves-enums.md) | grammar leaves (Words, Verbs, ulang matcher) and the remaining L00 enums/helpers (1126 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×19 + tests | B1 | [x] |
| close | merge ×4, gates, chain vs b1 (0 movers) | orchestrator | per close-procedure | T2a, T2b, T2c, T2d | [x] |
