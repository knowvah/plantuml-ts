# T5d — constraints, arrows, layout, task table, main block

Agent: `typescript-pro` (sonnet), worktree `gep-T5` (serial chain, shared). Commit:
`feat(gantt): port constraints, arrows, layout, task table, main block (T5d)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D4, D6.
Part of the batch-5 serial chain: ONE worktree `gep-T5` (branch `gep/T5`), tasks in order T5a→T5e, one commit each. The 25 files form one dependency cycle, so a commit before T5e may not typecheck alone (D6); never stub a missing class — leave the import pointing at the path the later task creates. (849 Java lines)

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraint.java` (132 lines) → `src/diagrams/gantt/GanttConstraint.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttArrow.java` (175 lines) → `src/diagrams/gantt/GanttArrow.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttLayout.java` (129 lines) → `src/diagrams/gantt/GanttLayout.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java` (206 lines) → `src/diagrams/gantt/GanttTaskTable.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramMainBlock.java` (207 lines) → `src/diagrams/gantt/GanttDiagramMainBlock.ts`

## Write-set
`src/diagrams/gantt/GanttConstraint.ts`, `src/diagrams/gantt/GanttArrow.ts`, `src/diagrams/gantt/GanttLayout.ts`, `src/diagrams/gantt/GanttTaskTable.ts`, `src/diagrams/gantt/GanttDiagramMainBlock.ts`;
`tests/unit/gantt/GanttConstraint.test.ts`, `tests/unit/gantt/GanttArrow.test.ts`, `tests/unit/gantt/GanttLayout.test.ts`, `tests/unit/gantt/GanttTaskTable.test.ts`, `tests/unit/gantt/GanttDiagramMainBlock.test.ts`.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its tests cite `file:line`.
- Given two tasks linked `->`, then `GanttArrow` path points equal the Java; given the task table columns, then widths equal the Java.

Observability: N/A — no new observable operations. Rollback: Reversible.
