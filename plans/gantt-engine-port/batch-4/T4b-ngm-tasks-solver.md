# T4b — NGMTask family and the Solver

Agent: `typescript-pro` (sonnet), worktree `gep-T4b`. Commit:
`feat(gantt): port ngm tasks solver (T4b)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L06–L09 (660 Java lines); everything these files reference
is in batches 1–3 or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java` (373 lines) → `src/diagrams/gantt/ngm/NGMTask.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedDuration.java` (107 lines) → `src/diagrams/gantt/ngm/NGMTaskFixedDuration.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedTotalEffort.java` (59 lines) → `src/diagrams/gantt/ngm/NGMTaskFixedTotalEffort.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/solver/Solver.java` (121 lines) → `src/diagrams/gantt/solver/Solver.ts`

## Write-set
`src/diagrams/gantt/ngm/NGMTask.ts`, `src/diagrams/gantt/ngm/NGMTaskFixedDuration.ts`, `src/diagrams/gantt/ngm/NGMTaskFixedTotalEffort.ts`, `src/diagrams/gantt/solver/Solver.ts`;
`tests/unit/gantt/ngm/NGMTask.test.ts`, `tests/unit/gantt/ngm/NGMTaskFixedDuration.test.ts`, `tests/unit/gantt/ngm/NGMTaskFixedTotalEffort.test.ts`, `tests/unit/gantt/solver/Solver.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given `[B] starts at [A]'s end` style constraints set on a `Solver`, then the solved start/end equal the Java; given a dependency cycle, then `ImpossibleSolvingException`; given a fixed-total-effort task with a 1/2 allocation, then its duration doubles (Java NGM semantics).
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.
