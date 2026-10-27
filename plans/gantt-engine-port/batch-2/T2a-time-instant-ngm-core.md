# T2a — PValue, time/Instant, ngm/Load, ngm/math Fraction/Segment/TimeDirection (+ D5 bound test)

Agent: `typescript-pro` (sonnet), worktree `gep-T2a`. Commit:
`feat(gantt): port time instant ngm core (T2a)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L00–L01 (1021 Java lines); everything these files reference
is in batch 1 (`src/core/time`, `src/core/clock.ts`, `I18nTimeData`) and `src/core/gantt/Failable.ts` or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/PValue.java` (40 lines) → `src/diagrams/gantt/PValue.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/Instant.java` (85 lines) → `src/diagrams/gantt/time/Instant.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/Load.java` (120 lines) → `src/diagrams/gantt/ngm/Load.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java` (282 lines) → `src/diagrams/gantt/ngm/math/Fraction.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java` (424 lines) → `src/diagrams/gantt/ngm/math/Segment.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/TimeDirection.java` (53 lines) → `src/diagrams/gantt/ngm/math/TimeDirection.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/package-info.java` (17 lines) → `src/diagrams/gantt/ngm/package-info.ts`

## Write-set
`src/diagrams/gantt/PValue.ts`, `src/diagrams/gantt/time/Instant.ts`, `src/diagrams/gantt/ngm/Load.ts`, `src/diagrams/gantt/ngm/math/Fraction.ts`, `src/diagrams/gantt/ngm/math/Segment.ts`, `src/diagrams/gantt/ngm/math/TimeDirection.ts`, `src/diagrams/gantt/ngm/package-info.ts`;
`tests/unit/gantt/PValue.test.ts`, `tests/unit/gantt/time/Instant.test.ts`, `tests/unit/gantt/ngm/Load.test.ts`, `tests/unit/gantt/ngm/math/Fraction.test.ts`, `tests/unit/gantt/ngm/math/Segment.test.ts`, `tests/unit/gantt/ngm/math/TimeDirection.test.ts`, `tests/unit/gantt/ngm/package-info.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given `Fraction` arithmetic on the Java test values in its javadoc (and reduce/compare), then results equal the Java; given the largest realistic product (a 10-year span in seconds × a 1/7 allocation), then it stays below `Number.MAX_SAFE_INTEGER` (D5).
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.
