# T7b — grammar top part 2 (L14–L15)

Agent: `typescript-pro` (sonnet), worktree `gep-T7` (serial chain, shared). Commit:
`feat(gantt): port grammar top part 2 (l14–l15) (T7b)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D4, D6.
Serial chain: ONE worktree `gep-T7` (branch `gep/T7`), T7a→T7c, one commit each, a fresh agent per task, each reading the previous commits (journal row 43). T7a/T7b may not typecheck until their Subject/Complement partners land; T7c ends typecheck-clean. (963 Java lines)

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

**Orchestrator notes (journal row 68, batch-7 member audit):**
- `NaturalGanttCommand implements Command<GanttDiagram>` (`execute`/`isValid`/`isEligibleFor` on `BlocLines`): there is no TS `Command` of that shape (`core/command/Command.ts` is a regex entry) and no `BlocLines`; port it taking one `StringLocated` (precedent `src/core/command/UBrexSingleLineCommand2.ts:7-18`, `lines.getFirst()` is the only use) and catch `NoSuchColorException` → `CommandExecutionResult.badColor()` explicitly (`NaturalGanttCommand.java:75`; the UBrex base does it only for its own subclasses).
- klimt `HColor` in `SubjectTask`/`SubjectDayAsDate`/`SubjectDayOfWeek`/`SubjectDaysAsDates`: the TS klimt type is `HColorOrPaint | HColorAutomagic` — export the existing `GanttColor` alias from `src/diagrams/gantt/lang/CenterBorderColor.ts:11` (type-only; that file joins T7a's write-set for this one line) and use it.
- `StereotypePattern.uoptional` (`SubjectTask.java:424`): inline citing `StereotypePattern.java:70-72` (`umandatory`, which it calls) and `:74-77`; precedent `src/diagrams/activity/dispatch-support.ts:226`.
- `new StringTokenizer(resource, "{}")` (`SubjectTask.java:468-469`): split on `{`/`}`, drop empty tokens, trim — cite it; inline precedent `src/core/decoration/WithLinkType.ts:138`.
- `TeaVM.a()` guards (`SubjectGantt.java:74`, `SubjectSeparator.java:79,90,102`): assertion-only, dropped (precedent `src/core/abel/Entity.ts:47`, rows 28/40).
- `gantt.getCurrentStyleBuilder()`: inline `getSkinParam().getCurrentStyleBuilder()` (row 51; `GanttDiagram.ts:169`).
- `RegexResult.getUMatcher()` returns `UMatcher | undefined` (`src/core/regex/RegexResult.ts:49`): narrow at `CommandPrintBetween.java:91-92`.
- `Subject<D extends Diagram>`: unconstrained generic (no TS `Diagram`; precedent the UBrexSingleLineCommand2.ts header).
- Batch-6 members you call exist on the branch: `VerbPhraseAction.skipSpaces`, `ComplementDate.any()`, the `Complement*`, `DaysAsDates`; the batch-6 commands are `{ regex, apply }` consts (`CommandNoteBottom` is `{ start, end, collect, apply }`, `CommandHideShowColumns` a class).

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its tests cite `file:line`.
- Given `saturday are closed`, `2020-07-14 is open`, `-- Phase 2 --`, `{Alice} is off on 2020-07-10`, then the diagram state equals the Java.

Observability: N/A — no new observable operations. Rollback: Reversible.
