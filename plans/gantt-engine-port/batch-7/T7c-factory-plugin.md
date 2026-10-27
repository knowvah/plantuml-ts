# T7c — GanttDiagramFactory, the plugin, registration and {{gantt}}

Agent: `typescript-pro` (sonnet), worktree `gep-T7` (serial chain, shared). Commit:
`feat(gantt): port ganttdiagramfactory, the plugin, registration and {{gantt}} (T7c)`.
Read [../task-contract.md](../task-contract.md) and decisions D1, D4, D6.
Serial chain: ONE worktree `gep-T7` (branch `gep/T7`), T7a→T7c, one commit each, a fresh agent per task, each reading the previous commits (journal row 43). T7a/T7b may not typecheck until their Subject/Complement partners land; T7c ends typecheck-clean. (130 Java lines)

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramFactory.java` (130 lines) → `src/diagrams/gantt/GanttDiagramFactory.ts`

## Write-set
`src/diagrams/gantt/GanttDiagramFactory.ts`;
`tests/unit/gantt/GanttDiagramFactory.test.ts`.

**Orchestrator note (journal row 48):** `GanttDiagramFactory` registers
`CommandNoteBottom` (a `CommandMultilines2`); the factory must dispatch its
block the way `src/diagrams/wbs/WBSDiagramFactory.ts` dispatches
`collectWbsMultilineBlock`. `CommonCommands`/`PSystemCommandFactory`/`PathSystem`
follow the wbs/mindmap/salt factories (`WBSDiagramFactory.ts`,
`MindMapDiagramFactory.ts`, `PSystemSaltFactory.ts`).

**Orchestrator note (journal row 51):** after the parse loop, call
`GanttDiagram.checkFinalError()` and refuse with kind `'final'` through
`src/core/parse-refusal.ts` when it returns a message (upstream
`PSystemCommandFactory.java:150-153` → `PSystemAbstractFactory.java:67-72`) —
"Gantt diagrams cannot last more than 20 years" and `ImpossibleSolvingException`
messages (`GanttDiagram.java:171-181`) become error pages there.

**Orchestrator notes (journal row 68, batch-7 member audit + plugin seam):**
- No `PSystemCommandFactory` base in TS: `GanttDiagramFactory.ts` exports `parseGantt(source: UmlSource, preprocessing: PreprocessingArtifact)` with inline dispatch in `GanttDiagramFactory.java:84-120`'s command order — precedent `src/diagrams/wbs/WBSDiagramFactory.ts:125` (`dispatchWbsLine`), `:230` (`executeCommands`), `:266` (`parseWbs`); `createEmptyDiagram`'s `PathSystem`/`Previous` are unused in the Java body (`:125-127`) and dropped. Commands: the batch-6 `{ regex, apply }` consts; `CommandNoteBottom` `{ start, end, collect, apply }` dispatched like `collectWbsMultilineBlock`; `CommandHideShowColumns`/`CommandPrintBetween` are `UBrexSingleLineCommand2` subclasses (`new …()`); `NaturalGanttCommand` takes a `StringLocated` (T7a). A command that throws (e.g. `CommandFootboxGantt` on a bare `footbox`, row 63) propagates — the crash path.
- `CommonCommands.addTitleCommands` (`CommonCommands.java:112-128`) = `src/core/annotations/commands.ts:382` `ORDERED_MATCHERS`/`:402 matchAnnotationCommand` (11 of 12); `CommandNamespaceSeparator` (`:126`) is missing there — copy the salt one (`src/diagrams/salt/PSystemSaltFactory.ts:31`) with its citation. `addCommonCommands2` (`:62-96`): NOPE/ROTATE/MINWIDTH/PAGE at `PSystemSaltFactory.ts:17-23`, `assume-transparent.ts:22`, `skin-command.ts`, `sprite-commands.ts:322`; skinparam/style/pragma are preprocessor-collected (`WBSDiagramFactory.ts:136-141`) — copy with citations (a shared extraction is a separate cleanup, not this task). `addCommonScaleCommands` (`:97-105`) = `src/core/scale-command.ts:156`.
- `checkFinalError()` → `refuse('final', …)` (`src/core/parse-refusal.ts:40,66`); the winning refusal becomes `DiagramRefusal` at `src/index.ts:220-225`.
- Clock (row 61): add `readonly clock?: Clock` to `ParseOptions` (`src/core/dispatcher-types.ts:40-43`, `import type` from `./clock.js`); `src/index.ts:311` passes `{ assetStore: options?.assetStore, clock: renderClock(options) }` (`renderClock` is `src/core/clock.ts:45-47`, not yet imported there); the gantt plugin's `parse(source, options)` hands `options?.clock ?? DEFAULT_CLOCK` to `new GanttDiagram(source, preprocessing, skinParam, clock)`. Both `renderSync` and `render` go through `prepareBlock`, so one edit covers both. The d.ts diff must stay empty.
- Plugin: `src/diagrams/gantt/index.ts` exports `ganttPlugin: SyncPlugin<GanttDiagram, …>` shaped like `src/diagrams/wbs/index.ts:309-323` (`type: 'gantt'`, `parse`, `layoutSync`, `render` via the titled exporter route `drawFragment`/`exportTextBlock` with `diagramType: 'GANTT'`). `src/core/assemble-svg.ts:323-353` `finalizeShellFragment` has no GANTT arm — add `case DIAGRAM_TYPE_GANTT` beside WBS (`:341`) into `finalizeTitledDiagramFragment`, because `GanttDiagram extends TitledDiagram` upstream (say so in the hand-back). Register in `src/registered-plugins.ts` next to wbs (`:81`) at the position `PSystemBuilder.java:183` gives gantt — read that line and cite it. Skin param: build from `source.styleSource.skinparam` as `WBSDiagramFactory.ts:178-182` does.

## Acceptance
- Given each ported file, then every public member of the Java class exists
  with the same name and behaviour, and its tests cite `file:line`.
- Plus (orchestrator addition, journal rows 9/15): `src/core/dispatcher-types.ts` gains a `clock` field on the plugin ctx, set in `prepareBlock` (`src/index.ts`) from `renderClock(options)`; the gantt plugin hands `ctx.clock` to `GanttDiagram`.
  Stop-6 evidence (journal row 61): `dist/plantuml-ts.d.ts` exports no plugin
  type (`DiagramPlugin`/`ParseOptions` are internal), so an optional
  `clock?: Clock` on `ParseOptions` (`dispatcher-types.ts:40-43`) is not a
  public API change. Prove it: after `npm run build`, `diff
  plans/gantt-engine-port/measurements/b6-plantuml-ts.d.ts dist/plantuml-ts.d.ts`
  is empty (the orchestrator saves the b6 copy at the batch-6 close); a
  non-empty diff is stop 6 — report it, do not commit.
- Plus (write-set additions): `src/diagrams/gantt/index.ts` (the plugin: parse via the factory, draw per D4 with `diagramType: 'GANTT'` and both `lengthAdjust` carriers, the clock from `src/core/clock.ts`), `src/registered-plugins.ts` (`PSystemBuilder.java:183` order), the `{{gantt}}` nested renderer wiring (`src/core/EmbeddedDiagram.ts:292` path), `src/core/assemble-svg.ts` (a `GANTT` finalize arm ONLY if the titled arm does not fit — say which in the hand-back), `docs/catalog.md`.
- Given `@startgantt\n[A] lasts 5 days\n@endgantt`, then the output is not the error box and the root carries `data-diagram-type="GANTT"`.
- Given every `tests/fixtures/gantt/*.puml`, then no render throws; report per fixture `compareSvg` verdict + firstDiff (do NOT pin anything — the orchestrator re-pins).
- Given the 28-engine survey on your branch, then only gantt moves; list its counts (conformant/structural/diverged/errored).

Observability: N/A — no new observable operations. Rollback: Reversible.
