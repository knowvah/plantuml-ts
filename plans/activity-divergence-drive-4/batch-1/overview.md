# Batch 1 — switch Ydelta, lane widths, NOTE-MULTI, spot letters (parallel)

Four worktrees, write-sets disjoint. Each merge: stop-17 gate, probe, D6
(`census-away.py`). Close per close-procedure (`b1`, prev `b0p`).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-switch-ydelta.md) | switch case-row +11 px via authored fixtures | typescript-pro | `tiles/gtile-switch*.ts`, `layout/walk-switch.ts`, `layout/switch-connection-points.ts`, fixtures | b0 | [x] |
| [T1b](T1b-lane-widths.md) | lane widths by oracle A/B | typescript-pro | `layout/swimlane-*.ts`, `layout/swimlane-context.ts`, `layout/tile-coordinates-group.ts`, `layout/walk-if-long-horizontal.ts`, `layout/walk-while-*.ts`, named core skinparam handler | b0 | [x] |
| [T1c](T1c-note-multi.md) | NOTE-MULTI ink + note colour | typescript-pro | `layout/canvas-origin*.ts`, note parse in `node-dispatch.ts`, `ast.ts`, `tiles/gtile-with-notes.ts`, `layout/walk-with-notes.ts`, `activity-renderer-note-shapes.ts` | b0 | [x] |
| [T1d](T1d-spot-letters.md) | spot glyph letters from new captures | typescript-pro | `activity-spot-glyph-data.ts` + test | b0 | [x] |

Spawned during batch 1 (journal rows 15, 21): T1e (compress label slot + zero-length
arrowhead) [x], T1f (switch notes + case-label `\n` + end direction) [x], T1g (band
anchor + FtileIfWithLinks hline lanes) [x].
