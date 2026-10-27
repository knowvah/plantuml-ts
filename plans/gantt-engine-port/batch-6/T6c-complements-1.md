# T6c — lang complements A–D + DaysAsDates + VerbPhraseAction

Agent: `typescript-pro` (sonnet), worktree `gep-T6c`. Commit:
`feat(gantt): port complements 1 (T6c)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L11 (843 Java lines); everything these files reference
is in batches 1–5 (incl. `GanttDiagram` from batch 5) or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/DaysAsDates.java` (96 lines) → `src/diagrams/gantt/DaysAsDates.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseAction.java` (163 lines) → `src/diagrams/gantt/ulang/VerbPhraseAction.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/AbstractComplementTaskInstant.java` (86 lines) → `src/diagrams/gantt/lang/AbstractComplementTaskInstant.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementAnything.java` (59 lines) → `src/diagrams/gantt/lang/ComplementAnything.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementCompleted.java` (64 lines) → `src/diagrams/gantt/lang/ComplementCompleted.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java` (129 lines) → `src/diagrams/gantt/lang/ComplementDate.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDayOfWeek.java` (61 lines) → `src/diagrams/gantt/lang/ComplementDayOfWeek.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDeleted.java` (57 lines) → `src/diagrams/gantt/lang/ComplementDeleted.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDuration.java` (128 lines) → `src/diagrams/gantt/lang/ComplementDuration.ts`

## Write-set
`src/diagrams/gantt/DaysAsDates.ts`, `src/diagrams/gantt/ulang/VerbPhraseAction.ts`, `src/diagrams/gantt/lang/AbstractComplementTaskInstant.ts`, `src/diagrams/gantt/lang/ComplementAnything.ts`, `src/diagrams/gantt/lang/ComplementCompleted.ts`, `src/diagrams/gantt/lang/ComplementDate.ts`, `src/diagrams/gantt/lang/ComplementDayOfWeek.ts`, `src/diagrams/gantt/lang/ComplementDeleted.ts`, `src/diagrams/gantt/lang/ComplementDuration.ts`;
`tests/unit/gantt/DaysAsDates.test.ts`, `tests/unit/gantt/ulang/VerbPhraseAction.test.ts`, `tests/unit/gantt/lang/AbstractComplementTaskInstant.test.ts`, `tests/unit/gantt/lang/ComplementAnything.test.ts`, `tests/unit/gantt/lang/ComplementCompleted.test.ts`, `tests/unit/gantt/lang/ComplementDate.test.ts`, `tests/unit/gantt/lang/ComplementDayOfWeek.test.ts`, `tests/unit/gantt/lang/ComplementDeleted.test.ts`, `tests/unit/gantt/lang/ComplementDuration.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

**Orchestrator note (journal row 56):** the `Complement*` classes implement
`lang/Something.java` (L01, ported: `src/diagrams/gantt/lang/Something.ts`) — there is no
`Complement` interface upstream. Their ubrex patterns go through the batch-1b
port (`src/core/ubrex/`, builder entry points in `src/core/ubrex/builder/`;
`UBrexPart`/`UnicodeBracketedExpression` — see `lang/TimeResolution.ts` and
`time/MonthUtils.ts` for the pattern already used). Corpus for any acceptance
grep: `test-results/dot-cache/gantt/*/in.puml` (265) and `tests/fixtures/gantt/*.puml` (94).

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given `ComplementDate` on every date form upstream accepts (YYYY-MM-DD, YYYY/MM/DD, D/M/YYYY variants in its regex), then the same `TimePoint`; given `ComplementDuration` on "3 days", "2 weeks", "1 week and 2 days", then the same durations.
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.
