# Batch 4 — L06–L09 (2606 Java lines)

Upstream layers L06–L09. Three parallel worktrees off the batch-3 close; independent groups (B4). No gantt plugin yet: nothing renders differently, so the close expects
0 movers in all 28 engines. Standard close as `b4`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T4a](T4a-task-model.md) | task model: GanttI18n, GanttTaskTableColumn, AbstractTask, Resource, Task, TaskGroup, TaskInstant, TaskSeparator, TaskDraw, TaskDrawSeparator (1545 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×10 + tests | B3 | [x] |
| [T4b](T4b-ngm-tasks-solver.md) | NGMTask family and the Solver (660 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×4 + tests | B3 | [x] |
| [T4c](T4c-calendar-timescale-variants.md) | DayCalendarData and the timescale variants (401 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×4 + tests | B3 | [x] |
| close | merge ×3, gates, chain vs b3 (0 movers) | orchestrator | per close-procedure | T4a, T4b, T4c | [x] |
