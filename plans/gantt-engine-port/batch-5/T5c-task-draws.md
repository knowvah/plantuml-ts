# T5c — the task draws

Agent: `typescript-pro` (sonnet), worktree `gep-T5` (serial chain, shared). Commit:
`feat(gantt): port the task draws (T5c)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D4, D6.
Part of the batch-5 serial chain: ONE worktree `gep-T5` (branch `gep/T5`), tasks in order T5a→T5e, one commit each. The 25 files form one dependency cycle, so a commit before T5e may not typecheck alone (D6); never stub a missing class — leave the import pointing at the path the later task creates. (1259 Java lines)

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java` (240 lines) → `src/diagrams/gantt/draw/AbstractTaskDraw.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java` (308 lines) → `src/diagrams/gantt/draw/TaskDrawRegular.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java` (282 lines) → `src/diagrams/gantt/draw/TaskDrawDiamond.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java` (279 lines) → `src/diagrams/gantt/draw/TaskDrawGroup.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDrawNumbers.java` (150 lines) → `src/diagrams/gantt/draw/ResourceDrawNumbers.ts`

## Write-set
`src/diagrams/gantt/draw/AbstractTaskDraw.ts`, `src/diagrams/gantt/draw/TaskDrawRegular.ts`, `src/diagrams/gantt/draw/TaskDrawDiamond.ts`, `src/diagrams/gantt/draw/TaskDrawGroup.ts`, `src/diagrams/gantt/draw/ResourceDrawNumbers.ts`;
`tests/unit/gantt/draw/AbstractTaskDraw.test.ts`, `tests/unit/gantt/draw/TaskDrawRegular.test.ts`, `tests/unit/gantt/draw/TaskDrawDiamond.test.ts`, `tests/unit/gantt/draw/TaskDrawGroup.test.ts`, `tests/unit/gantt/draw/ResourceDrawNumbers.test.ts`.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its tests cite `file:line`.
- Given a regular task, a milestone and a group drawn on a recording `UGraphic`, then the shapes (rect with completion fill, diamond, group bracket) and notes (`Opale`) match the Java geometry.

Observability: N/A — no new observable operations. Rollback: Reversible.
