# T7b — grammar top part 2 (L14–L15)

Agent: `typescript-pro` (sonnet), worktree `gep-T7` (serial chain, shared). Commit:
`feat(gantt): port grammar top part 2 (l14–l15) (T7b)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D4, D6.
Serial chain: ONE worktree `gep-T7` (branch `gep/T7`), T7a→T7c, one commit each, same agent resumed via SendMessage. T7a/T7b may not typecheck until their Subject/Complement partners land; T7c ends typecheck-clean. (963 Java lines)

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementClose.java` (70 lines) → `src/diagrams/gantt/lang/ComplementClose.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementOpen.java` (70 lines) → `src/diagrams/gantt/lang/ComplementOpen.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementTask.java` (62 lines) → `src/diagrams/gantt/lang/ComplementTask.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectSeparator.java` (113 lines) → `src/diagrams/gantt/lang/SubjectSeparator.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayAsDate.java` (144 lines) → `src/diagrams/gantt/lang/SubjectDayAsDate.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayOfWeek.java` (108 lines) → `src/diagrams/gantt/lang/SubjectDayOfWeek.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDaysAsDates.java` (202 lines) → `src/diagrams/gantt/lang/SubjectDaysAsDates.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectResource.java` (194 lines) → `src/diagrams/gantt/lang/SubjectResource.ts`

## Write-set
`src/diagrams/gantt/lang/ComplementClose.ts`, `src/diagrams/gantt/lang/ComplementOpen.ts`, `src/diagrams/gantt/lang/ComplementTask.ts`, `src/diagrams/gantt/lang/SubjectSeparator.ts`, `src/diagrams/gantt/lang/SubjectDayAsDate.ts`, `src/diagrams/gantt/lang/SubjectDayOfWeek.ts`, `src/diagrams/gantt/lang/SubjectDaysAsDates.ts`, `src/diagrams/gantt/lang/SubjectResource.ts`;
`tests/unit/gantt/lang/ComplementClose.test.ts`, `tests/unit/gantt/lang/ComplementOpen.test.ts`, `tests/unit/gantt/lang/ComplementTask.test.ts`, `tests/unit/gantt/lang/SubjectSeparator.test.ts`, `tests/unit/gantt/lang/SubjectDayAsDate.test.ts`, `tests/unit/gantt/lang/SubjectDayOfWeek.test.ts`, `tests/unit/gantt/lang/SubjectDaysAsDates.test.ts`, `tests/unit/gantt/lang/SubjectResource.test.ts`.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its tests cite `file:line`.
- Given `saturday are closed`, `2020-07-14 is open`, `-- Phase 2 --`, `{Alice} is off on 2020-07-10`, then the diagram state equals the Java.

Observability: N/A — no new observable operations. Rollback: Reversible.
