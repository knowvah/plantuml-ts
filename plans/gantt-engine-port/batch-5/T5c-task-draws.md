# T5c — the task draws

Agent: `typescript-pro` (sonnet), worktree `gep-T5` (serial chain, shared). Commit:
`feat(gantt): port the task draws (T5c)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D4, D6.
Part of the batch-5 serial chain: ONE worktree `gep-T5` (branch `gep/T5`), tasks in order T5a→T5e, one commit each. The 25 files form one dependency cycle, so a commit before T5e may not typecheck alone (D6); never stub a missing class — leave the import pointing at the path the later task creates. (1259 Java lines)

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java` (240 lines) → `src/diagrams/gantt/draw/AbstractTaskDraw.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java` (308 lines) → `src/diagrams/gantt/draw/TaskDrawRegular.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java` (282 lines) → `src/diagrams/gantt/draw/TaskDrawDiamond.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java` (279 lines) → `src/diagrams/gantt/draw/TaskDrawGroup.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDrawNumbers.java` (150 lines) → `src/diagrams/gantt/draw/ResourceDrawNumbers.ts`

## Write-set
`src/diagrams/gantt/draw/AbstractTaskDraw.ts`, `src/diagrams/gantt/draw/TaskDrawRegular.ts`, `src/diagrams/gantt/draw/TaskDrawDiamond.ts`, `src/diagrams/gantt/draw/TaskDrawGroup.ts`, `src/diagrams/gantt/draw/ResourceDrawNumbers.ts`;
`tests/unit/gantt/draw/AbstractTaskDraw.test.ts`, `tests/unit/gantt/draw/TaskDrawRegular.test.ts`, `tests/unit/gantt/draw/TaskDrawDiamond.test.ts`, `tests/unit/gantt/draw/TaskDrawGroup.test.ts`, `tests/unit/gantt/draw/ResourceDrawNumbers.test.ts`.
**Orchestrator additions (journal row 46):**
- `src/diagrams/gantt/draw/TaskDraw.ts` and `src/diagrams/gantt/draw/TaskDrawSeparator.ts` —
  signature only: `setColorsAndCompletion(colors: CenterBorderColor | undefined, …)`.
  Java passes `null` when a task has no colours (`core/TaskImpl.java:329-331`)
  and `AbstractTaskDraw.java:73,96` stores it; `AbstractTaskDraw.colors` is
  `CenterBorderColor | undefined` and every read keeps the Java null check.
- `src/diagrams/gantt/data/TaskDrawRegistryData.ts` — drop the
  `task.getColors() as CenterBorderColor` cast only (T5b, journal row 46).
- `tests/unit/gantt/data/TaskDrawRegistryData.test.ts` — turn T5b's 7
  `it.todo` into real tests once your draws load (expected values traced from
  `data/TaskDrawRegistryData.java`, `file:line`).
- **`Opale` class (journal row 47, stop-1 fix):** `src/core/svek/image/Opale.ts`
  holds only Opale's constants and polygon-STRING helpers (class/state/
  description engines read them) — there is no `Opale` class. Port
  `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java`
  (271 lines) whole as `export class Opale extends TextBlockMemoized`
  (`src/core/klimt/shape/TextBlockMemoized.ts`) INTO `Opale.ts`, additive:
  every existing export and its behaviour unchanged (class/state are
  conformant — the close chain must show 0 movers). If the 500-line hook
  blocks, move the class's private `getPolygonLeft/Right/Up/Down`
  (`Opale.java:175-266`) into `src/core/svek/image/OpalePolygons.ts` (journal
  it in the hand-back). Test: extend `tests/unit/core/svek/image/Opale.test.ts`
  (existing tests untouched). Do not rewire any engine onto the class.
- `skinParam.sheet(fc, align, CreoleMode.FULL).createSheet(note)`
  (`AbstractTaskDraw.java:174-189`): the port has `sheet(...)` on
  `src/core/skin/SkinParamDelegator.ts:129-147` — find the route from the
  gantt `ISkinParam`, do not re-implement it.
- Constructor argument orders are fixed by T5b's calls
  (`TaskDrawRegistryData.java:125-204`); `ResourceDrawNumbers` takes `double y`.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its tests cite `file:line`.
- Given a regular task, a milestone and a group drawn on a recording `UGraphic`, then the shapes (rect with completion fill, diamond, group bracket) and notes (`Opale`) match the Java geometry.

Observability: N/A — no new observable operations. Rollback: Reversible.
