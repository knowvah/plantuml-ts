# T3 — Thread the lane onto the tiles

**Agent:** `typescript-pro` · **Depends on:** —

## Context

Read [`../README.md`](../README.md) — in particular that **no live tile
reads `swimlane` today**. `ast.ts` carries `swimlane?: string` on every node
kind; the two matches under `tiles/` (`gtile-label.ts:11`,
`gtile-spot.ts:12`) are local interface re-declarations, not consumers.
`walkTile` places everything in one column.

This task makes the lane AVAILABLE. It must not yet change where anything
is drawn.

## Read-set

- `src/diagrams/activity/tiles/tile.ts` — the `Tile`/`TileLeaf` base
- `src/diagrams/activity/layout/tile-layout.ts:40-150` — `tileNode` /
  `tileNodes`, where AST nodes become tiles
- `src/diagrams/activity/ast.ts:15-60` — the `swimlane?: string` field
- `src/diagrams/activity/layout/swimlane-context.ts` — read-only, T4 owns it

## Task

Add an optional `swimlane` to the tile base and populate it from the AST
node when constructing each tile. Prefer the narrowest change that makes
the lane reachable from `walkTile` — a field on the base is likely enough;
do NOT widen every `Gtile` constructor signature unless the base cannot
carry it.

**Change no coordinates.** No `x`, `y`, `width` or `height` may differ.

## Interface contract (consumed by T4, T5)

```ts
// tiles/tile.ts
abstract class Tile { readonly swimlane?: string; /* … */ }
```

## Boundaries

**Always:** keep the change minimal and mechanical.
**Never:** touch `layout.old.ts` or any `activity-layout-*.ts` — superseded
engine, stop condition 5.
**Ask first (halt and journal):** if a container tile (if/while/fork/split)
cannot carry a lane without restructuring — that is stop condition 7.

## Acceptance criteria

- Given a `|A| :a; |B| :b;` diagram, then the tile for `:a;` carries
  `swimlane === 'A'` and the tile for `:b;` carries `'B'`
- Given a diagram with no swimlanes, then every tile's `swimlane` is
  `undefined`
- Given the corpus, then the aggregate `weightedScore` is **EXACTLY 52563**,
  unchanged — this task moves nothing (stop condition 6)
- Given `canvas-bounds.test.ts` and the swimlane census from T0, then both
  are unchanged

## Observability

N/A.

## Rollback

**Reversible.**

## Quality bar

All four gates green; full `npm test`.

## Commit

`refactor(asr-T3): thread the swimlane onto the activity tiles`
