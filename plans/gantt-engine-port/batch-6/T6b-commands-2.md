# T6b — commands H–W

Agent: `typescript-pro` (sonnet), worktree `gep-T6b`. Commit:
`feat(gantt): port commands 2 (T6b)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D2, D5, D6.
Upstream layer L11 (705 Java lines); everything these files reference
is in batches 1–5 (incl. `GanttDiagram` from batch 5) or in this task (`diagnosis/upstream-batch-groups.txt`).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideShowColumns.java` (88 lines) → `src/diagrams/gantt/command/CommandHideShowColumns.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandLabelOnColumn.java` (90 lines) → `src/diagrams/gantt/command/CommandLabelOnColumn.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandLanguage.java` (68 lines) → `src/diagrams/gantt/command/CommandLanguage.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandNoteBottom.java` (118 lines) → `src/diagrams/gantt/command/CommandNoteBottom.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintScale.java` (106 lines) → `src/diagrams/gantt/command/CommandPrintScale.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandSeparator.java` (69 lines) → `src/diagrams/gantt/command/CommandSeparator.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandTaskCompleteDefault.java` (84 lines) → `src/diagrams/gantt/command/CommandTaskCompleteDefault.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandWeekNumberStrategy.java` (82 lines) → `src/diagrams/gantt/command/CommandWeekNumberStrategy.ts`


**Orchestrator note (journal row 27):** `src/` has no `StereotypePattern` module — engines inline its patterns with a citation (`src/diagrams/activity/dispatch-support.ts:226`). Inline `StereotypePattern.optional` (regex, `stereo/StereotypePattern.java:53-59`) / `uoptional` (ubrex, `:74-77`) the same way, in your own file, citing the Java lines.

## Write-set
`src/diagrams/gantt/command/CommandHideShowColumns.ts`, `src/diagrams/gantt/command/CommandLabelOnColumn.ts`, `src/diagrams/gantt/command/CommandLanguage.ts`, `src/diagrams/gantt/command/CommandNoteBottom.ts`, `src/diagrams/gantt/command/CommandPrintScale.ts`, `src/diagrams/gantt/command/CommandSeparator.ts`, `src/diagrams/gantt/command/CommandTaskCompleteDefault.ts`, `src/diagrams/gantt/command/CommandWeekNumberStrategy.ts`;
`tests/unit/gantt/command/CommandHideShowColumns.test.ts`, `tests/unit/gantt/command/CommandLabelOnColumn.test.ts`, `tests/unit/gantt/command/CommandLanguage.test.ts`, `tests/unit/gantt/command/CommandNoteBottom.test.ts`, `tests/unit/gantt/command/CommandPrintScale.test.ts`, `tests/unit/gantt/command/CommandSeparator.test.ts`, `tests/unit/gantt/command/CommandTaskCompleteDefault.test.ts`, `tests/unit/gantt/command/CommandWeekNumberStrategy.test.ts`.

## Read-set
The Java files above; for each type they import, its already-ported TS file
(`docs/catalog.md` → path). Do not read the rest of the gantt package.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its test cites `file:line` for every
  expected value.
- Given each command regex, then it matches every corpus line of its shape and rejects near-misses; given `Language toto` (corpus), then the Java fallback; given `execute`, then the diagram state equals the Java.
- Given the task, then `npm run typecheck` and eslint are clean and coverage
  of the new files is ≥ 90/90/90.

Observability: N/A — no new observable operations. Rollback: Reversible.
