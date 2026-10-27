# T6a — commands A–H

Agent: `typescript-pro` (sonnet), worktree `gep-T6a`. Commit:
`feat(gantt): port commands 1 (T6a)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L11 (681 Java lines); everything these files reference
is in batches 1–5 (incl. `GanttDiagram` from batch 5) or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandColorTask.java` (86 lines) → `src/diagrams/gantt/command/CommandColorTask.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandFootboxGantt.java` (60 lines) → `src/diagrams/gantt/command/CommandFootboxGantt.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGanttArrow.java` (92 lines) → `src/diagrams/gantt/command/CommandGanttArrow.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGanttArrow2.java` (91 lines) → `src/diagrams/gantt/command/CommandGanttArrow2.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGroupEnd.java` (70 lines) → `src/diagrams/gantt/command/CommandGroupEnd.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandGroupStart.java` (73 lines) → `src/diagrams/gantt/command/CommandGroupStart.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideClosed.java` (69 lines) → `src/diagrams/gantt/command/CommandHideClosed.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideResourceFootbox.java` (70 lines) → `src/diagrams/gantt/command/CommandHideResourceFootbox.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideResourceName.java` (70 lines) → `src/diagrams/gantt/command/CommandHideResourceName.ts`

## Write-set
`src/diagrams/gantt/command/CommandColorTask.ts`, `src/diagrams/gantt/command/CommandFootboxGantt.ts`, `src/diagrams/gantt/command/CommandGanttArrow.ts`, `src/diagrams/gantt/command/CommandGanttArrow2.ts`, `src/diagrams/gantt/command/CommandGroupEnd.ts`, `src/diagrams/gantt/command/CommandGroupStart.ts`, `src/diagrams/gantt/command/CommandHideClosed.ts`, `src/diagrams/gantt/command/CommandHideResourceFootbox.ts`, `src/diagrams/gantt/command/CommandHideResourceName.ts`;
`tests/unit/gantt/command/CommandColorTask.test.ts`, `tests/unit/gantt/command/CommandFootboxGantt.test.ts`, `tests/unit/gantt/command/CommandGanttArrow.test.ts`, `tests/unit/gantt/command/CommandGanttArrow2.test.ts`, `tests/unit/gantt/command/CommandGroupEnd.test.ts`, `tests/unit/gantt/command/CommandGroupStart.test.ts`, `tests/unit/gantt/command/CommandHideClosed.test.ts`, `tests/unit/gantt/command/CommandHideResourceFootbox.test.ts`, `tests/unit/gantt/command/CommandHideResourceName.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given each command regex, then it matches every corpus line of its shape (grep the corpus) and rejects near-misses; given `execute` on a fresh `GanttDiagram`, then the diagram state change equals the Java.
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.
