# T6d — lang complements I–W

Agent: `typescript-pro` (sonnet), worktree `gep-T6d`. Commit:
`feat(gantt): port complements 2 (T6d)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L11 (595 Java lines); everything these files reference
is in batches 1–5 (incl. `GanttDiagram` from batch 5) or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementInColors.java` (71 lines) → `src/diagrams/gantt/lang/ComplementInColors.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementInColors2.java` (72 lines) → `src/diagrams/gantt/lang/ComplementInColors2.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementInColorsFromTo.java` (85 lines) → `src/diagrams/gantt/lang/ComplementInColorsFromTo.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementNamed.java` (63 lines) → `src/diagrams/gantt/lang/ComplementNamed.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementTimePoint.java` (102 lines) → `src/diagrams/gantt/lang/ComplementTimePoint.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementUrl.java` (64 lines) → `src/diagrams/gantt/lang/ComplementUrl.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementWithColorLink.java` (77 lines) → `src/diagrams/gantt/lang/ComplementWithColorLink.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementWorkingHours.java` (61 lines) → `src/diagrams/gantt/lang/ComplementWorkingHours.ts`

## Write-set
`src/diagrams/gantt/lang/ComplementInColors.ts`, `src/diagrams/gantt/lang/ComplementInColors2.ts`, `src/diagrams/gantt/lang/ComplementInColorsFromTo.ts`, `src/diagrams/gantt/lang/ComplementNamed.ts`, `src/diagrams/gantt/lang/ComplementTimePoint.ts`, `src/diagrams/gantt/lang/ComplementUrl.ts`, `src/diagrams/gantt/lang/ComplementWithColorLink.ts`, `src/diagrams/gantt/lang/ComplementWorkingHours.ts`;
`tests/unit/gantt/lang/ComplementInColors.test.ts`, `tests/unit/gantt/lang/ComplementInColors2.test.ts`, `tests/unit/gantt/lang/ComplementInColorsFromTo.test.ts`, `tests/unit/gantt/lang/ComplementNamed.test.ts`, `tests/unit/gantt/lang/ComplementTimePoint.test.ts`, `tests/unit/gantt/lang/ComplementUrl.test.ts`, `tests/unit/gantt/lang/ComplementWithColorLink.test.ts`, `tests/unit/gantt/lang/ComplementWorkingHours.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given each complement on its corpus phrases, then the same parsed value as the Java; given colours with and without `/` border colours, then the same `CenterBorderColor`.
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.
