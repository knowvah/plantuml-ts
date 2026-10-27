# T5a — the TimeHeader family

Agent: `typescript-pro` (sonnet), worktree `gep-T5` (serial chain, shared). Commit:
`feat(gantt): port the timeheader family (T5a)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D4, D6.
Part of the batch-5 serial chain: ONE worktree `gep-T5` (branch `gep/T5`), tasks in order T5a→T5e, one commit each. The 25 files form one dependency cycle, so a commit before T5e may not typecheck alone (D6); never stub a missing class — leave the import pointing at the path the later task creates. (2011 Java lines)

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java` (299 lines) → `src/diagrams/gantt/draw/header/TimeHeader.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderCalendar.java` (99 lines) → `src/diagrams/gantt/draw/header/TimeHeaderCalendar.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java` (220 lines) → `src/diagrams/gantt/draw/header/TimeHeaderDaily.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderFactory.java` (151 lines) → `src/diagrams/gantt/draw/header/TimeHeaderFactory.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderMonthly.java` (186 lines) → `src/diagrams/gantt/draw/header/TimeHeaderMonthly.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderQuarterly.java` (171 lines) → `src/diagrams/gantt/draw/header/TimeHeaderQuarterly.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderSimple.java` (239 lines) → `src/diagrams/gantt/draw/header/TimeHeaderSimple.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderVariant.java` (334 lines) → `src/diagrams/gantt/draw/header/TimeHeaderVariant.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderWeekly.java` (188 lines) → `src/diagrams/gantt/draw/header/TimeHeaderWeekly.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderYearly.java` (124 lines) → `src/diagrams/gantt/draw/header/TimeHeaderYearly.ts`

## Write-set
**Orchestrator addition (journal row 15):** `src/core/klimt/font/UFont.ts` (+ its test) — add `withFontFace` and the `UFontFace` it needs (`klimt/font/UFont.java`, `UFontFace.java`; `draw/header/TimeHeader.java:154` calls `font.withFontFace(UFontFace.bold())`), additive only; any existing UFont member untouched.
`src/diagrams/gantt/draw/header/TimeHeader.ts`, `src/diagrams/gantt/draw/header/TimeHeaderCalendar.ts`, `src/diagrams/gantt/draw/header/TimeHeaderDaily.ts`, `src/diagrams/gantt/draw/header/TimeHeaderFactory.ts`, `src/diagrams/gantt/draw/header/TimeHeaderMonthly.ts`, `src/diagrams/gantt/draw/header/TimeHeaderQuarterly.ts`, `src/diagrams/gantt/draw/header/TimeHeaderSimple.ts`, `src/diagrams/gantt/draw/header/TimeHeaderVariant.ts`, `src/diagrams/gantt/draw/header/TimeHeaderWeekly.ts`, `src/diagrams/gantt/draw/header/TimeHeaderYearly.ts`;
`tests/unit/gantt/draw/header/TimeHeader.test.ts`, `tests/unit/gantt/draw/header/TimeHeaderCalendar.test.ts`, `tests/unit/gantt/draw/header/TimeHeaderDaily.test.ts`, `tests/unit/gantt/draw/header/TimeHeaderFactory.test.ts`, `tests/unit/gantt/draw/header/TimeHeaderMonthly.test.ts`, `tests/unit/gantt/draw/header/TimeHeaderQuarterly.test.ts`, `tests/unit/gantt/draw/header/TimeHeaderSimple.test.ts`, `tests/unit/gantt/draw/header/TimeHeaderVariant.test.ts`, `tests/unit/gantt/draw/header/TimeHeaderWeekly.test.ts`, `tests/unit/gantt/draw/header/TimeHeaderYearly.test.ts`.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its tests cite `file:line`.
- Given each header kind drawn on a recording `UGraphic` for a fixed 3-week range (once T5e lands — write the test now, mark it `it.todo` until the chain end, then enable), then text and line positions equal the jar oracle of `tests/fixtures/gantt/printscale-*`.

Observability: N/A — no new observable operations. Rollback: Reversible.
