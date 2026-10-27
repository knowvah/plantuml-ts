# Batch 5 — the 25-file cycle (L10, 5,670 Java lines), one serial chain

`GanttDiagram`, `TaskImpl`, the data registries, the task draws and the
`TimeHeader` family reference each other in one strongly connected component
(`diagnosis/upstream-scc-layers.txt` L10), so they cannot be split across
parallel worktrees (D6). One worktree `gep-T5` off the batch-4 close; ONE
agent per task runs T5a→T5e in order, committing per task — a FRESH agent
each time that reads the previous commits (journal row 43: a resumed agent's
second hand-back does not arrive — memory `subagent-handback-single-shot`;
batch 1b ran its chain the same way). Intermediate commits may not typecheck; the
chain merges once (`merge-one.sh T5`) after T5e, when typecheck, lint and the
new tests are green (stop 14 otherwise). Still no plugin: the close expects 0
movers in all 28 engines.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T5a](T5a-time-headers.md) | the TimeHeader family (2011 lines) | typescript-pro (sonnet), fresh agent, same worktree | `src/diagrams/gantt/…` ×10 + tests | B4 | [x] |
| [T5b](T5b-taskimpl-data.md) | TaskImpl and the data registries (861 lines) | typescript-pro (sonnet), fresh agent, same worktree | `src/diagrams/gantt/…` ×4 + tests | T5a | [x] |
| [T5c](T5c-task-draws.md) | the task draws (1259 lines) | typescript-pro (sonnet), fresh agent, same worktree | `src/diagrams/gantt/…` ×5 + tests | T5b | [x] |
| [T5d](T5d-constraint-layout-table.md) | constraints, arrows, layout, task table, main block (849 lines) | typescript-pro (sonnet), fresh agent, same worktree | `src/diagrams/gantt/…` ×5 + tests | T5c | [x] |
| [T5e](T5e-gantt-diagram.md) | GanttDiagram (690 lines) | typescript-pro (sonnet), fresh agent, same worktree | `src/diagrams/gantt/…` ×1 + tests | T5d | [x] |
| [T5f](T5f-coverage.md) | tests-only coverage fix (journal row 54) | typescript-pro (sonnet), worktree gep-T5f | `tests/unit/gantt/**` | T5e | [x] |
| close | merge the chain once, gates, chain vs b4 (0 movers) | orchestrator | per close-procedure | T5e | [x] |
