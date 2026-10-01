# Batch 2 — drive round 1 (D6)

After the b1b close, whose step 9 names every cohort row's next mechanism and
assigns it to one family below. Families with no cohort row are dropped;
unowned mechanisms become `T2x` (push-forward). Every family task runs in its
own worktree; write-sets are disjoint by construction (layout walkers /
tile-layout+dispatch / renderer / tiles). A row needing two families is
re-slotted to the later one. Close per [close-procedure.md](../close-
procedure.md) (`b2`) — pin round 1.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-draw-order.md) | draw order: text()/font-size swaps — repeat connectors, branch labels | typescript-pro | `src/diagrams/activity/layout/{tile-coordinates,walk-repeat,edge-draw-order}.ts`, `tests/diagrams/activity/layout/**` | T1c | [ ] |
| [T2b](T2b-walker-childcount.md) | walker childCount: `detach`/`kill` as mutation, note tiles unlinked | typescript-pro | `src/diagrams/activity/layout/tile-layout.ts`, `src/diagrams/activity/tiles/gtile-top-down.ts`, `src/diagrams/activity/node-dispatch.ts`, `tests/unit/activity/**`, `tests/diagrams/activity/tiles/**` | T1c | [ ] |
| [T2c](T2c-renderer-order.md) | renderer order/count: emphasize tip order, one `<text>` per wrapped line, line stroke 2.5 | typescript-pro | `src/diagrams/activity/{renderer,activity-renderer-text,activity-renderer-bars,activity-renderer-swimlanes}.ts`, `tests/unit/activity/renderer*.test.ts` | T1c | [ ] |
| [T2d](T2d-tile-geometry.md) | tile geometry: `GtileBreak` 0×0, repeat break welding, if-with-links +6 px | typescript-pro | `src/diagrams/activity/tiles/gtile-*.ts` (named rows), `src/diagrams/activity/layout/{walk-while-branch,walk-if-with-links}.ts`, `tests/diagrams/activity/tiles/**` | T1c | [ ] |
| T2-close | b2, all-engine diff, re-pins, pin round 1, re-cut cohort, write batch-3 | orchestrator | per close-procedure | T2a–T2d | [ ] |

Rows per task: filled at the b1b close from `fixtures.md`'s `task` column.
