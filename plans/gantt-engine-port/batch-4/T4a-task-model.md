# T4a — task model: GanttI18n, GanttTaskTableColumn, AbstractTask, Resource, Task, TaskGroup, TaskInstant, TaskSeparator, TaskDraw, TaskDrawSeparator

Agent: `typescript-pro` (sonnet), worktree `gep-T4a`. Commit:
`feat(gantt): port task model (T4a)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L06–L09 (1545 Java lines); everything these files reference
is in batches 1–3 or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttI18n.java` (265 lines) → `src/diagrams/gantt/GanttI18n.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java` (219 lines) → `src/diagrams/gantt/GanttTaskTableColumn.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/AbstractTask.java` (96 lines) → `src/diagrams/gantt/core/AbstractTask.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java` (116 lines) → `src/diagrams/gantt/core/Resource.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Task.java` (95 lines) → `src/diagrams/gantt/core/Task.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java` (164 lines) → `src/diagrams/gantt/core/TaskGroup.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskInstant.java` (132 lines) → `src/diagrams/gantt/core/TaskInstant.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java` (140 lines) → `src/diagrams/gantt/core/TaskSeparator.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java` (82 lines) → `src/diagrams/gantt/draw/TaskDraw.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java` (236 lines) → `src/diagrams/gantt/draw/TaskDrawSeparator.ts`

## Write-set
`src/diagrams/gantt/GanttI18n.ts`, `src/diagrams/gantt/GanttTaskTableColumn.ts`, `src/diagrams/gantt/core/AbstractTask.ts`, `src/diagrams/gantt/core/Resource.ts`, `src/diagrams/gantt/core/Task.ts`, `src/diagrams/gantt/core/TaskGroup.ts`, `src/diagrams/gantt/core/TaskInstant.ts`, `src/diagrams/gantt/core/TaskSeparator.ts`, `src/diagrams/gantt/draw/TaskDraw.ts`, `src/diagrams/gantt/draw/TaskDrawSeparator.ts`;
`tests/unit/gantt/GanttI18n.test.ts`, `tests/unit/gantt/GanttTaskTableColumn.test.ts`, `tests/unit/gantt/core/AbstractTask.test.ts`, `tests/unit/gantt/core/Resource.test.ts`, `tests/unit/gantt/core/Task.test.ts`, `tests/unit/gantt/core/TaskGroup.test.ts`, `tests/unit/gantt/core/TaskInstant.test.ts`, `tests/unit/gantt/core/TaskSeparator.test.ts`, `tests/unit/gantt/draw/TaskDraw.test.ts`, `tests/unit/gantt/draw/TaskDrawSeparator.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given `GanttI18n.durationHumanReadable` for durations from the Java tests/javadoc in en/de/fr, then the same strings; given a `TaskGroup` over two child tasks, then its start/end equal the min/max as the Java computes.
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.
