# T5e — GanttDiagram

Agent: `typescript-pro` (sonnet), worktree `gep-T5` (serial chain, shared). Commit:
`feat(gantt): port ganttdiagram (T5e)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D4, D6.
Part of the batch-5 serial chain: ONE worktree `gep-T5` (branch `gep/T5`), tasks in order T5a→T5e, one commit each. The 25 files form one dependency cycle, so a commit before T5e may not typecheck alone (D6); never stub a missing class — leave the import pointing at the path the later task creates. (690 Java lines)

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagram.java` (690 lines) → `src/diagrams/gantt/GanttDiagram.ts`

## Write-set
**Orchestrator notes (journal row 15):** (1) `GanttDiagram.java:593-630` `exportTxt` (ATXT via `asciiverse.ATable`/`InfinitePlan`) is not ported: the port is an SVG-only library with no text-output path (no engine ports `exportTxt`); keep a comment block citing the Java lines. (2) The clock: `GanttDiagram` receives a `Clock` (constructor or setter, from the plugin in T7c) and passes it to `TimePoint.todayAtMidnight(clock)` at `GanttDiagram.java:455-466`. (3) Framework types (journal row 43): `GanttDiagram extends TitledDiagram` (`src/core/TitledDiagram.ts`); follow `src/diagrams/wbs/WBSDiagram.ts` — `getDescription(): string` (`DiagramDescription` → its text, `WBSDiagram.ts:119-122`), `getTextBlock()` without `FileFormatOption` (the string bounder is the only part reaching it, `UgDiagram.ts:27`), no `ImageData`/`ImageDataSimple`/`FileFormat` (`UgDiagram.ts:18-21`).
`src/diagrams/gantt/GanttDiagram.ts`;
`tests/unit/gantt/GanttDiagram.test.ts`.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its tests cite `file:line`.
- Given a `GanttDiagram` built programmatically (no parser yet: add tasks, constraints, closed days through its API), then `getTextBlock().drawU` on `UGraphicSvg` completes and produces task rectangles at the Java coordinates for a 2-task fixture.
- Given the whole chain, then `npm run typecheck` is clean and every `it.todo` from T5a–T5d is enabled and green.

Observability: N/A — no new observable operations. Rollback: Reversible.
