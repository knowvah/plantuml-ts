# T2b — time Month/DayOfWeek utils, WeekNumberStrategy, TimeResolution, WeekConfigData, WeeklyHeaderStrategy

Agent: `typescript-pro` (sonnet), worktree `gep-T2b`. Commit:
`feat(gantt): port time utils weeks (T2b)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L00–L01 (460 Java lines); everything these files reference
is in batch 1 (`src/core/time`, `src/core/clock.ts`, `I18nTimeData`) and `src/core/gantt/Failable.ts` or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/MonthUtils.java` (89 lines) → `src/diagrams/gantt/time/MonthUtils.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/DayOfWeekUtils.java` (88 lines) → `src/diagrams/gantt/time/DayOfWeekUtils.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/WeekNumberStrategy.java` (64 lines) → `src/diagrams/gantt/time/WeekNumberStrategy.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/TimeResolution.java` (87 lines) → `src/diagrams/gantt/lang/TimeResolution.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WeekConfigData.java` (90 lines) → `src/diagrams/gantt/data/WeekConfigData.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/WeeklyHeaderStrategy.java` (42 lines) → `src/diagrams/gantt/draw/WeeklyHeaderStrategy.ts`

## Write-set
`src/diagrams/gantt/time/MonthUtils.ts`, `src/diagrams/gantt/time/DayOfWeekUtils.ts`, `src/diagrams/gantt/time/WeekNumberStrategy.ts`, `src/diagrams/gantt/lang/TimeResolution.ts`, `src/diagrams/gantt/data/WeekConfigData.ts`, `src/diagrams/gantt/draw/WeeklyHeaderStrategy.ts`;
`tests/unit/gantt/time/MonthUtils.test.ts`, `tests/unit/gantt/time/DayOfWeekUtils.test.ts`, `tests/unit/gantt/time/WeekNumberStrategy.test.ts`, `tests/unit/gantt/lang/TimeResolution.test.ts`, `tests/unit/gantt/data/WeekConfigData.test.ts`, `tests/unit/gantt/draw/WeeklyHeaderStrategy.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given each `DayOfWeekUtils.fromString` input upstream accepts (full and abbreviated, any case), then the same `DayOfWeek`; given each `WeekNumberStrategy` and the 2020/2021 year boundary, then the week numbers equal the Java.
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.
