# T3c — RectangleTask, WorkingHours, DayPattern, PairOfSomething

Agent: `typescript-pro` (sonnet), worktree `gep-T3c`. Commit:
`feat(gantt): port rect workinghours patterns (T3c)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L02–L05 (532 Java lines); everything these files reference
is in batches 1–2 or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/RectangleTask.java` (232 lines) → `src/diagrams/gantt/draw/RectangleTask.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WorkingHours.java` (114 lines) → `src/diagrams/gantt/data/WorkingHours.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/DayPattern.java` (110 lines) → `src/diagrams/gantt/lang/DayPattern.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/PairOfSomething.java` (76 lines) → `src/diagrams/gantt/lang/PairOfSomething.ts`

## Write-set
`src/diagrams/gantt/draw/RectangleTask.ts`, `src/diagrams/gantt/data/WorkingHours.ts`, `src/diagrams/gantt/lang/DayPattern.ts`, `src/diagrams/gantt/lang/PairOfSomething.ts`;
`tests/unit/gantt/draw/RectangleTask.test.ts`, `tests/unit/gantt/data/WorkingHours.test.ts`, `tests/unit/gantt/lang/DayPattern.test.ts`, `tests/unit/gantt/lang/PairOfSomething.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given `WorkingHours` parsed from the upstream syntax samples, then the same intervals; given `RectangleTask` drawn on a recording `UGraphic`, then the same shapes and coordinates as the Java computes.
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.
