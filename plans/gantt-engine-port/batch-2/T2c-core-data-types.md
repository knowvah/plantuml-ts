# T2c — small core/data types and styles

Agent: `typescript-pro` (sonnet), worktree `gep-T2c`. Commit:
`feat(gantt): port core data types (T2c)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L00–L01 (956 Java lines); everything these files reference
is in batch 1 (`src/core/time`, `src/core/clock.ts`, `I18nTimeData`) and `src/core/gantt/Failable.ts` or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GArrows.java` (156 lines) → `src/diagrams/gantt/GArrows.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/GSide.java` (57 lines) → `src/diagrams/gantt/core/GSide.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRange.java` (92 lines) → `src/diagrams/gantt/core/TimeRange.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRanges.java` (85 lines) → `src/diagrams/gantt/core/TimeRanges.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/PrintScale.java` (67 lines) → `src/diagrams/gantt/core/PrintScale.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskCode.java` (81 lines) → `src/diagrams/gantt/core/TaskCode.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskAttribute.java` (45 lines) → `src/diagrams/gantt/core/TaskAttribute.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/GArrowType.java` (40 lines) → `src/diagrams/gantt/core/GArrowType.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeScaleConfigData.java` (79 lines) → `src/diagrams/gantt/data/TimeScaleConfigData.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DisplayConfigData.java` (82 lines) → `src/diagrams/gantt/data/DisplayConfigData.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttStyle.java` (47 lines) → `src/diagrams/gantt/GanttStyle.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java` (125 lines) → `src/diagrams/gantt/data/TimelineStyleData.ts`

## Write-set
`src/diagrams/gantt/GArrows.ts`, `src/diagrams/gantt/core/GSide.ts`, `src/diagrams/gantt/core/TimeRange.ts`, `src/diagrams/gantt/core/TimeRanges.ts`, `src/diagrams/gantt/core/PrintScale.ts`, `src/diagrams/gantt/core/TaskCode.ts`, `src/diagrams/gantt/core/TaskAttribute.ts`, `src/diagrams/gantt/core/GArrowType.ts`, `src/diagrams/gantt/data/TimeScaleConfigData.ts`, `src/diagrams/gantt/data/DisplayConfigData.ts`, `src/diagrams/gantt/GanttStyle.ts`, `src/diagrams/gantt/data/TimelineStyleData.ts`;
`tests/unit/gantt/GArrows.test.ts`, `tests/unit/gantt/core/GSide.test.ts`, `tests/unit/gantt/core/TimeRange.test.ts`, `tests/unit/gantt/core/TimeRanges.test.ts`, `tests/unit/gantt/core/PrintScale.test.ts`, `tests/unit/gantt/core/TaskCode.test.ts`, `tests/unit/gantt/core/TaskAttribute.test.ts`, `tests/unit/gantt/core/GArrowType.test.ts`, `tests/unit/gantt/data/TimeScaleConfigData.test.ts`, `tests/unit/gantt/data/DisplayConfigData.test.ts`, `tests/unit/gantt/GanttStyle.test.ts`, `tests/unit/gantt/data/TimelineStyleData.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given `PrintScale.fromString` for every name upstream accepts, then the same constant; given `TimeRanges` merge/contains cases from the Java logic, then the same results; given `TimelineStyleData` built from the default `ganttDiagram` style, then its colours equal the skin values.
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.
