# Batch 1p — missing builders before the merge port (D3 amendment, D12)

Inserted after the stop-12 halt (journal row 5, user option 2). Two waves;
write-sets disjoint within a wave. Close per [close-procedure.md](../close-procedure.md)
as `b1p` (prev = `b0`). Then T1b starts (batch 1).

| ID | Description | Agent | Writes | Wave | Done |
|---|---|---|---|---|---|
| [T1p-a](T1p-a-hline.md) | ConditionEndStyle HLINE (if-down, if-with-links) | typescript-pro | `layout/{conditional-builder,walk-if-down,walk-if-with-links}.ts`, `tiles/{gtile-if-down,gtile-if-with-links}.ts`, `activity-style-defaults*.ts`, core skinparam handler + theme field, new files, `tests/fixtures/activity/T1p-a/**` | 1 | [x] |
| [T1p-c](T1p-c-end-merge.md) | `fork … end merge` (ParallelBuilderMerge) | typescript-pro | `parser.ts`, `parallel-dispatch.ts`, `ast.ts`, `layout/{tile-layout,walk-fork-branches}.ts`, `tiles/{gtile-fork,tile}.ts`, renderer files if needed, new files, `tests/fixtures/activity/T1p-c/**` | 1 | [x] |
| [T1p-d](T1p-d-repeat.md) | repeat break welding + cross-swimlane repeat out | typescript-pro | `layout/{walk-repeat,walk-repeat-backward,swimlane-loop-translate-repeat}.ts`, `tiles/{gtile-repeat,gtile-break}.ts`, new files, `tests/fixtures/activity/T1p-d/**` | 1 | [x] |
| [T1p-e](T1p-e-switch.md) | switch cross-swimlane connections | typescript-pro | `layout/tile-coordinates.ts`, `tiles/gtile-switch.ts`, `switch-dispatch.ts`, new files, `tests/fixtures/activity/T1p-e/**` (+ `layout/swimlane-loop-translate.ts`, row 7) | 1 | [x] |
| [T1p-f](T1p-f-switch-big-diamond.md) | switch BIG_DIAMOND per-lane case draw | typescript-pro | `layout/{swimlane-placement,walk-switch}.ts`, `tiles/gtile-switch.ts`, new files, `tests/fixtures/activity/T1p-f/**` | 2 | [x] |
| [T1p-g](T1p-g-hline-swimlane-minmax.md) | swimlane-aware getMinmax for HLINE connectors | typescript-pro | `layout/{walk-if-with-links,walk-if-long-horizontal}.ts`, T1p-f's per-lane seam, new files | 3 (after T1p-f) | [ ] |
| [T1p-b](T1p-b-vertical-if.md) | FtileIfLongVertical (`!pragma useVerticalIf`) | typescript-pro | `if-dispatch.ts`, `layout/{conditional-builder,tile-layout,tile-coordinates}.ts`, `tiles/tile.ts`, new tile + walker, `tests/fixtures/activity/T1p-b/**` | 2 | [x] |

All paths under `src/diagrams/activity/` unless stated; every task also owns
its own new test files. A file a task needs that is not in its row: stop and
report (stop 1). Tests for files a task owns may be updated only with a Java
quote.
