# T5b — TaskImpl and the data registries

Agent: `typescript-pro` (sonnet), worktree `gep-T5` (serial chain, shared). Commit:
`feat(gantt): port taskimpl and the data registries (T5b)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D4, D6.
Part of the batch-5 serial chain: ONE worktree `gep-T5` (branch `gep/T5`), tasks in order T5a→T5e, one commit each. The 25 files form one dependency cycle, so a commit before T5e may not typecheck alone (D6); never stub a missing class — leave the import pointing at the path the later task creates. (861 Java lines)

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskImpl.java` (379 lines) → `src/diagrams/gantt/core/TaskImpl.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/GanttModelData.java` (118 lines) → `src/diagrams/gantt/data/GanttModelData.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TaskDrawRegistryData.java` (206 lines) → `src/diagrams/gantt/data/TaskDrawRegistryData.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeBoundsData.java` (158 lines) → `src/diagrams/gantt/data/TimeBoundsData.ts`

## Write-set
`src/diagrams/gantt/core/TaskImpl.ts`, `src/diagrams/gantt/data/GanttModelData.ts`, `src/diagrams/gantt/data/TaskDrawRegistryData.ts`, `src/diagrams/gantt/data/TimeBoundsData.ts`;
`tests/unit/gantt/core/TaskImpl.test.ts`, `tests/unit/gantt/data/GanttModelData.test.ts`, `tests/unit/gantt/data/TaskDrawRegistryData.test.ts`, `tests/unit/gantt/data/TimeBoundsData.test.ts`.
**Orchestrator addition (journal row 45):** `tests/unit/gantt/draw/header/helpers/header-fixture.ts` — only to replace its structural `TimeBoundsData` stand-in (`boundsOf()`, `:47`) once the real class exists, if needed for typecheck/lint. T5a's headers call `getMinDay()`, `getMaxDay()`, `getPrintStart()` (`LocalDate | undefined`).

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its tests cite `file:line`.
- Given a `TaskImpl` with duration, completion and resources, then start/end/load equal the Java (`core/TaskImpl.java`).

Observability: N/A — no new observable operations. Rollback: Reversible.
