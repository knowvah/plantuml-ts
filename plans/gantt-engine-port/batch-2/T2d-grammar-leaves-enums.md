# T2d — grammar leaves (Words, Verbs, ulang matcher) and the remaining L00 enums/helpers

Agent: `typescript-pro` (sonnet), worktree `gep-T2d`. Commit:
`feat(gantt): port grammar leaves enums (T2d)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L00–L01 (1126 Java lines); everything these files reference
is in batch 1 (`src/core/time`, `src/core/clock.ts`, `I18nTimeData`) and `src/core/gantt/Failable.ts` or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Words.java` (111 lines) → `src/diagrams/gantt/lang/Words.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java` (74 lines) → `src/diagrams/gantt/lang/Verbs.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/TwoNames.java` (56 lines) → `src/diagrams/gantt/lang/TwoNames.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Something.java` (50 lines) → `src/diagrams/gantt/lang/Something.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/CenterBorderColor.java` (89 lines) → `src/diagrams/gantt/lang/CenterBorderColor.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/ParsedSentence.java` (75 lines) → `src/diagrams/gantt/ulang/ParsedSentence.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseMatcher.java` (63 lines) → `src/diagrams/gantt/ulang/VerbPhraseMatcher.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/Completion.java` (50 lines) → `src/diagrams/gantt/Completion.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/Today.java` (40 lines) → `src/diagrams/gantt/Today.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/DayStatus.java` (41 lines) → `src/diagrams/gantt/DayStatus.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraintMode.java` (41 lines) → `src/diagrams/gantt/GanttConstraintMode.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/LabelPosition.java` (42 lines) → `src/diagrams/gantt/LabelPosition.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/LabelStrategy.java` (66 lines) → `src/diagrams/gantt/LabelStrategy.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/PathUtils.java` (81 lines) → `src/diagrams/gantt/draw/PathUtils.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/FingerPrint.java` (69 lines) → `src/diagrams/gantt/draw/FingerPrint.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDraw.java` (47 lines) → `src/diagrams/gantt/draw/ResourceDraw.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/HeaderPiece.java` (45 lines) → `src/diagrams/gantt/draw/header/HeaderPiece.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/solver/ImpossibleSolvingException.java` (44 lines) → `src/diagrams/gantt/solver/ImpossibleSolvingException.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PiecewiseTimeType.java` (42 lines) → `src/diagrams/gantt/timescale/PiecewiseTimeType.ts`

## Write-set
`src/diagrams/gantt/lang/Words.ts`, `src/diagrams/gantt/lang/Verbs.ts`, `src/diagrams/gantt/lang/TwoNames.ts`, `src/diagrams/gantt/lang/Something.ts`, `src/diagrams/gantt/lang/CenterBorderColor.ts`, `src/diagrams/gantt/ulang/ParsedSentence.ts`, `src/diagrams/gantt/ulang/VerbPhraseMatcher.ts`, `src/diagrams/gantt/Completion.ts`, `src/diagrams/gantt/Today.ts`, `src/diagrams/gantt/DayStatus.ts`, `src/diagrams/gantt/GanttConstraintMode.ts`, `src/diagrams/gantt/LabelPosition.ts`, `src/diagrams/gantt/LabelStrategy.ts`, `src/diagrams/gantt/draw/PathUtils.ts`, `src/diagrams/gantt/draw/FingerPrint.ts`, `src/diagrams/gantt/draw/ResourceDraw.ts`, `src/diagrams/gantt/draw/header/HeaderPiece.ts`, `src/diagrams/gantt/solver/ImpossibleSolvingException.ts`, `src/diagrams/gantt/timescale/PiecewiseTimeType.ts`;
`tests/unit/gantt/lang/Words.test.ts`, `tests/unit/gantt/lang/Verbs.test.ts`, `tests/unit/gantt/lang/TwoNames.test.ts`, `tests/unit/gantt/lang/Something.test.ts`, `tests/unit/gantt/lang/CenterBorderColor.test.ts`, `tests/unit/gantt/ulang/ParsedSentence.test.ts`, `tests/unit/gantt/ulang/VerbPhraseMatcher.test.ts`, `tests/unit/gantt/Completion.test.ts`, `tests/unit/gantt/Today.test.ts`, `tests/unit/gantt/DayStatus.test.ts`, `tests/unit/gantt/GanttConstraintMode.test.ts`, `tests/unit/gantt/LabelPosition.test.ts`, `tests/unit/gantt/LabelStrategy.test.ts`, `tests/unit/gantt/draw/PathUtils.test.ts`, `tests/unit/gantt/draw/FingerPrint.test.ts`, `tests/unit/gantt/draw/ResourceDraw.test.ts`, `tests/unit/gantt/draw/header/HeaderPiece.test.ts`, `tests/unit/gantt/solver/ImpossibleSolvingException.test.ts`, `tests/unit/gantt/timescale/PiecewiseTimeType.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given `Words`/`Verbs` regex fragments, then each matches exactly the strings the Java pattern matches (table of accepted/rejected samples taken from the corpus); given `VerbPhraseMatcher` on 5 corpus sentences, then the same `ParsedSentence` parts.
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.
