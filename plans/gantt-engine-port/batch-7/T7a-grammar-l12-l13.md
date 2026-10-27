# T7a — grammar top part 1 (L12–L13)

Agent: `typescript-pro` (sonnet), worktree `gep-T7` (serial chain, shared). Commit:
`feat(gantt): port grammar top part 1 (l12–l13) (T7a)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D4, D6.
Serial chain: ONE worktree `gep-T7` (branch `gep/T7`), T7a→T7c, one commit each, same agent resumed via SendMessage. T7a/T7b may not typecheck until their Subject/Complement partners land; T7c ends typecheck-clean. (1447 Java lines)

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintBetween.java` (99 lines) → `src/diagrams/gantt/command/CommandPrintBetween.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementIntervals.java` (106 lines) → `src/diagrams/gantt/lang/ComplementIntervals.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Subject.java` (55 lines) → `src/diagrams/gantt/lang/Subject.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/NaturalGanttCommand.java` (151 lines) → `src/diagrams/gantt/command/NaturalGanttCommand.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementBeforeOrAfterOrAtTaskStartOrEnd.java` (95 lines) → `src/diagrams/gantt/lang/ComplementBeforeOrAfterOrAtTaskStartOrEnd.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementFromTo.java` (66 lines) → `src/diagrams/gantt/lang/ComplementFromTo.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementIntervalsSmart.java` (112 lines) → `src/diagrams/gantt/lang/ComplementIntervalsSmart.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectTask.java` (483 lines) → `src/diagrams/gantt/lang/SubjectTask.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectGantt.java` (88 lines) → `src/diagrams/gantt/lang/SubjectGantt.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectToday.java` (96 lines) → `src/diagrams/gantt/lang/SubjectToday.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectWorkingHours.java` (96 lines) → `src/diagrams/gantt/lang/SubjectWorkingHours.ts`


**Orchestrator note (journal row 27):** `src/` has no `StereotypePattern` module — engines inline its patterns with a citation (`src/diagrams/activity/dispatch-support.ts:226`). Inline `StereotypePattern.optional` (regex, `stereo/StereotypePattern.java:53-59`) / `uoptional` (ubrex, `:74-77`) the same way, in your own file, citing the Java lines.

## Write-set
`src/diagrams/gantt/command/CommandPrintBetween.ts`, `src/diagrams/gantt/lang/ComplementIntervals.ts`, `src/diagrams/gantt/lang/Subject.ts`, `src/diagrams/gantt/command/NaturalGanttCommand.ts`, `src/diagrams/gantt/lang/ComplementBeforeOrAfterOrAtTaskStartOrEnd.ts`, `src/diagrams/gantt/lang/ComplementFromTo.ts`, `src/diagrams/gantt/lang/ComplementIntervalsSmart.ts`, `src/diagrams/gantt/lang/SubjectTask.ts`, `src/diagrams/gantt/lang/SubjectGantt.ts`, `src/diagrams/gantt/lang/SubjectToday.ts`, `src/diagrams/gantt/lang/SubjectWorkingHours.ts`;
`tests/unit/gantt/command/CommandPrintBetween.test.ts`, `tests/unit/gantt/lang/ComplementIntervals.test.ts`, `tests/unit/gantt/lang/Subject.test.ts`, `tests/unit/gantt/command/NaturalGanttCommand.test.ts`, `tests/unit/gantt/lang/ComplementBeforeOrAfterOrAtTaskStartOrEnd.test.ts`, `tests/unit/gantt/lang/ComplementFromTo.test.ts`, `tests/unit/gantt/lang/ComplementIntervalsSmart.test.ts`, `tests/unit/gantt/lang/SubjectTask.test.ts`, `tests/unit/gantt/lang/SubjectGantt.test.ts`, `tests/unit/gantt/lang/SubjectToday.test.ts`, `tests/unit/gantt/lang/SubjectWorkingHours.test.ts`.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its tests cite `file:line`.
- Given `NaturalGanttCommand` on 10 corpus sentences (`[A] lasts 5 days`, `[B] starts at [A]'s end`, `today is 30 days after start and is colored in #AAF`, …), then the diagram state after `execute` equals the Java's.

Observability: N/A — no new observable operations. Rollback: Reversible.
