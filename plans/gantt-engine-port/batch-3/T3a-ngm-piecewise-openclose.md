# T3a — ngm/math piecewise family, OpenClose, NGMAllocation

Agent: `typescript-pro` (sonnet), worktree `gep-T3a`. Commit:
`feat(gantt): port ngm piecewise openclose (T3a)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L02–L05 (1486 Java lines); everything these files reference
is in batches 1–2 or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstant.java` (84 lines) → `src/diagrams/gantt/ngm/math/PiecewiseConstant.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/AbstractPiecewiseConstant.java` (122 lines) → `src/diagrams/gantt/ngm/math/AbstractPiecewiseConstant.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/LoadIntegrator.java` (128 lines) → `src/diagrams/gantt/ngm/math/LoadIntegrator.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantUtils.java` (62 lines) → `src/diagrams/gantt/ngm/math/PiecewiseConstantUtils.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Combiner.java` (103 lines) → `src/diagrams/gantt/ngm/math/Combiner.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantHours.java` (151 lines) → `src/diagrams/gantt/ngm/math/PiecewiseConstantHours.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantSpecificDays.java` (165 lines) → `src/diagrams/gantt/ngm/math/PiecewiseConstantSpecificDays.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantTimeWindow.java` (156 lines) → `src/diagrams/gantt/ngm/math/PiecewiseConstantTimeWindow.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantWeekday.java` (137 lines) → `src/diagrams/gantt/ngm/math/PiecewiseConstantWeekday.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMAllocation.java` (155 lines) → `src/diagrams/gantt/ngm/NGMAllocation.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java` (223 lines) → `src/diagrams/gantt/OpenClose.ts`

## Write-set
`src/diagrams/gantt/ngm/math/PiecewiseConstant.ts`, `src/diagrams/gantt/ngm/math/AbstractPiecewiseConstant.ts`, `src/diagrams/gantt/ngm/math/LoadIntegrator.ts`, `src/diagrams/gantt/ngm/math/PiecewiseConstantUtils.ts`, `src/diagrams/gantt/ngm/math/Combiner.ts`, `src/diagrams/gantt/ngm/math/PiecewiseConstantHours.ts`, `src/diagrams/gantt/ngm/math/PiecewiseConstantSpecificDays.ts`, `src/diagrams/gantt/ngm/math/PiecewiseConstantTimeWindow.ts`, `src/diagrams/gantt/ngm/math/PiecewiseConstantWeekday.ts`, `src/diagrams/gantt/ngm/NGMAllocation.ts`, `src/diagrams/gantt/OpenClose.ts`;
`tests/unit/gantt/ngm/math/PiecewiseConstant.test.ts`, `tests/unit/gantt/ngm/math/AbstractPiecewiseConstant.test.ts`, `tests/unit/gantt/ngm/math/LoadIntegrator.test.ts`, `tests/unit/gantt/ngm/math/PiecewiseConstantUtils.test.ts`, `tests/unit/gantt/ngm/math/Combiner.test.ts`, `tests/unit/gantt/ngm/math/PiecewiseConstantHours.test.ts`, `tests/unit/gantt/ngm/math/PiecewiseConstantSpecificDays.test.ts`, `tests/unit/gantt/ngm/math/PiecewiseConstantTimeWindow.test.ts`, `tests/unit/gantt/ngm/math/PiecewiseConstantWeekday.test.ts`, `tests/unit/gantt/ngm/NGMAllocation.test.ts`, `tests/unit/gantt/OpenClose.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given a weekday-only `PiecewiseConstantWeekday` integrated over a two-week window, then the load equals the Java (10 working days); given `OpenClose` with weekends closed plus one open Saturday, then `isClosed` per day equals the Java.
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.
