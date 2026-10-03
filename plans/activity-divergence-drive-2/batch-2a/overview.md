# Batch 2a — families (D5–D9)

After the b1 close. Batches 2a and 2b run in parallel (six worktrees); source write-sets are disjoint (paths under `src/diagrams/activity/` unless shown).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-condition-style.md) | COLLAPSED into T2c at the b1 close (journal row 26): ConditionEndStyle hline done by T1p-a, fivama pinned; ConditionStyle needs T2c's core files | — | — | — | — |
| [T2b](T2b-opale-compress.md) | Opale spike, compression reservations, backward note, partition title, cross-lane elbow | typescript-pro | `layout/{tile-coordinates,tile-layout-backward}.ts`, `layout/compress/**`, `tiles/{gtile-note,gtile-group,gtile-partition}.ts` | T1b | [ ] |
| [T2c](T2c-style-core.md) | style core fields + ConditionStyle InsideDiamond (ex-T2a) | typescript-pro | `src/core/skinparam-*.ts`, `src/core/theme*.ts`, `src/core/svek/image/creole-text-lines.ts`, `activity-{style-defaults,style-defaults-swimlane,text-style,renderer-text}.ts`, `layout/{conditional-builder,walk-if-down}.ts`, `tiles/gtile-diamond*.ts` (+ new square tile), `activity-renderer-if-shapes.ts` | T1b | [ ] |

Close: the shared T2-close in [batch-2b/overview.md](../batch-2b/overview.md).
