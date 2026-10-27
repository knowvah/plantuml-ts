# T6z — gantt colour surface: `getIHtmlColorSet()` returns the klimt `HColorSet`

Agent: `typescript-pro` (sonnet), worktree `gep-T6z` (branch `gep/T6z`, off
the batch-5 close). Serial, BEFORE T6a–T6d (they all build on it). Commit:
`fix(gantt): return the klimt hcolorset and accept every hcolor (T6z)`.
Read [../task-contract.md](../task-contract.md). Journal row 57.

## Finding (method-level audit of batch 6)
Upstream `GanttDiagram.getIHtmlColorSet()` (`GanttDiagram.java:568-570`) returns
the real `klimt/color/HColorSet` (`HColorSet.java:58-76`: `getColorOrWhite`,
`getColorOrNull`, `getColor` throwing `NoSuchColorException`), and
`CenterBorderColor(HColor, HColor[, String])` (`CenterBorderColor.java:42-48`)
takes ANY `HColor`. The port typed `getIHtmlColorSet()` as the style-layer slice
`src/core/style/Value.ts:38` (only `getColorOrWhite(): HColor`), so batch-6
callers cannot reach `getColor` (`command/CommandColorTask.java:79-80`), and
`CenterBorderColor.ts:15-21` takes `HColorOrPaint` (`Paint | HColorSimple |
HColorGradient`, `ColorMapper.ts:109`) which excludes the `HColorAutomagic`
member of klimt's `ParsedColor` (`HColorSet.ts:324`).

## Write-set (gantt only — no file under `src/core/` changes)
- `src/diagrams/gantt/GanttDiagramConfig.ts` — `getIHtmlColorSet()` returns the
  klimt class `HColorSet` (`src/core/klimt/color/HColorSet.ts`); the field/ctor
  types it flows from likewise.
- `src/diagrams/gantt/data/TimelineStyleData.ts` — `#colorSet`, ctor param and
  `getColorSet()` typed as the klimt class (`TimelineStyleData.java` holds the
  real `HColorSet`). Every existing consumer that takes the Value.ts slice keeps
  compiling (the class is structurally assignable; T5e verified).
- `src/diagrams/gantt/gantt-skin-param.ts` — `getIHtmlColorSet()` return type
  likewise if it is the slice.
- `src/diagrams/gantt/lang/CenterBorderColor.ts` — fields and constructor accept
  `HColorOrPaint | ParsedColor | undefined` (i.e. add `HColorAutomagic`). Read
  `HColorAutomagic.java` + `src/core/klimt/color/HColorAutomagic.ts` and the
  klimt `Back`/`Fore` (`apply`, `:28-34`) and `HColors.unlinear` TS signature
  (`:82`) — if `Back`/`Fore`/`unlinear` cannot take an automagic in TS, do NOT
  widen core: STOP and report what klimt does with `HColorAutomagic` upstream
  (`AbstractCommonUGraphic`/`UParam`) so the orchestrator rules.
- `src/diagrams/gantt/GanttDiagram.ts` — `addSeparator(comment: string | undefined)`
  (`GanttDiagram.java:310-314` passes a possibly-null `COMMENT` group into
  `new TaskSeparator(builder, comment, n)`); mirror into
  `src/diagrams/gantt/core/TaskSeparator.ts` only if its ctor/field is `string`
  (check `TaskSeparator.java` for how a null comment is drawn — cite it).
- Their tests under `tests/unit/gantt/` (`npm run typecheck` + the full
  `tests/unit/gantt` run must stay green; add a test that `getIHtmlColorSet().getColor('#nope')`
  throws `NoSuchColorException` and that a `CenterBorderColor` built from
  `getColorOrWhite('#automatic')`-style input is accepted, both citing the Java).
- `docs/catalog.md` if exports changed.

## Acceptance
- Typecheck clean; eslint/prettier clean on touched files; `tests/unit/gantt`,
  `tests/unit/core/style`, `tests/architecture` green; commit through the hook.
- No `src/core/**` change. Every widened type cites the Java member it mirrors.

Observability: N/A. Rollback: Reversible.
