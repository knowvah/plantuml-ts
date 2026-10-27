# T7c — GanttDiagramFactory, the plugin, registration and {{gantt}}

Agent: `typescript-pro` (sonnet), worktree `gep-T7` (serial chain, shared). Commit:
`feat(gantt): port ganttdiagramfactory, the plugin, registration and {{gantt}} (T7c)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D4, D6.
Serial chain: ONE worktree `gep-T7` (branch `gep/T7`), T7a→T7c, one commit each, same agent resumed via SendMessage. T7a/T7b may not typecheck until their Subject/Complement partners land; T7c ends typecheck-clean. (130 Java lines)

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramFactory.java` (130 lines) → `src/diagrams/gantt/GanttDiagramFactory.ts`

## Write-set
`src/diagrams/gantt/GanttDiagramFactory.ts`;
`tests/unit/gantt/GanttDiagramFactory.test.ts`.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its tests cite `file:line`.
- Plus (orchestrator addition, journal rows 9/15): `src/core/dispatcher-types.ts` gains a `clock` field on the plugin ctx, set in `prepareBlock` (`src/index.ts`) from `renderClock(options)`; the gantt plugin hands `ctx.clock` to `GanttDiagram`.
- Plus (write-set additions): `src/diagrams/gantt/index.ts` (the plugin: parse via the factory, draw per D4 with `diagramType: 'GANTT'` and both `lengthAdjust` carriers, the clock from `src/core/clock.ts`), `src/registered-plugins.ts` (`PSystemBuilder.java:183` order), the `{{gantt}}` nested renderer wiring (`src/core/EmbeddedDiagram.ts:292` path), `src/core/assemble-svg.ts` (a `GANTT` finalize arm ONLY if the titled arm does not fit — say which in the hand-back), `docs/catalog.md`.
- Given `@startgantt\n[A] lasts 5 days\n@endgantt`, then the output is not the error box and the root carries `data-diagram-type="GANTT"`.
- Given every `tests/fixtures/gantt/*.puml`, then no render throws; report per fixture `compareSvg` verdict + firstDiff (do NOT pin anything — the orchestrator re-pins).
- Given the 28-engine survey on your branch, then only gantt moves; list its counts (conformant/structural/diverged/errored).

Observability: N/A — no new observable operations. Rollback: Reversible.
