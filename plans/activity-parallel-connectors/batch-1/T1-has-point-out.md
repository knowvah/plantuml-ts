# T1 — `Tile.hasPointOut()`

**Agent:** `typescript-pro` · **Depends on:** —

## Context

Faithful TypeScript port of PlantUML; `~/git/plantuml` is the spec — read
the method body, not a filename. Read [`../README.md`](../README.md) and
[`../decisions.md#d5`](../decisions.md) (locked). Upstream marks "no out
point" with the sentinel `outY == Double.MIN_NORMAL`
(`ftile/FtileGeometry.java:57-78`, `:141-143` `hasPointOut()`); a leaf
built with the four-argument constructor (`:88-90`) has none; `appendBottom`
(`:190-`) makes a vertical stack's out point its LAST member's;
`FtileKilled` (`FtileKilled.java:71-74`) strips it; the parallel builders
gate on it (`ParallelBuilderSplit.java:127-133`, `:150-176`;
`ParallelBuilderFork.java:123-126`). Our `Tile` (`tiles/tile.ts:13-27`)
has no such notion; `tile-coordinates.ts` draws a join connector for every
branch, detached or not.

## Read-set

- `src/diagrams/activity/tiles/tile.ts` (whole), `gtile-stop.ts`,
  `gtile-end.ts`, `gtile-kill.ts`, `gtile-break.ts`, `gtile-top-down.ts`,
  `gtile-fork.ts`, and the constructor of each other `gtile-*.ts`
- `src/diagrams/activity/layout/tile-layout.ts:62-95` (`detach` builds a
  `GtileStop`, `:73`)
- Java: `FtileGeometry.java:50-100, 141-143, 185-200`; for each composite
  the Ftile that produces its geometry — `FtileAssemblySimple.java:120-130`
  (`appendBottom`), `FtileKilled.java`, `vcompact/FtileIfWithLinks.java` /
  `FtileIfDown.java` (`calculateDimensionFtile`), `FtileWhile.java`,
  `FtileRepeat.java`, `FtileSwitch*.java`, `FtileGroup.java`; grep under
  `src/main/java/net/` for the class, never guess
- `tests/diagrams/activity/tiles/gtile-simple-leaf.test.ts`,
  `gtile-top-down.test.ts`, `gtile-fork.test.ts`

## Write-set

See the batch table. `docs/catalog.md` only on drift.

## Task

Tests first. Add `hasPointOut(): boolean` to `Tile`, `TileLeaf`,
`TileComposite`:

- `GtileStop` (also `detach`), `GtileEnd`, `GtileKill`: `false`
  (`FtileGeometry.java:88-90` four-arg constructor; cite the Ftile each
  maps to — `FtileCircleStop`, `FtileCircleEnd`, the kill/detach path)
- `GtileAction`, `GtileNote`, `GtileStart`, `GtileDiamond`, labels,
  spots: `true`
- `GtileTopDown`: the last child's, or `true` when empty (`appendBottom`)
- `GtileFork` / `GtileSplit`: any branch has one (`hasOut()`)
- if / while / repeat / switch / group / partition / break: read the Java
  and cite; default `true` and FILE the case (push-forward) where the Java
  withholds it in some configuration

Consume NOTHING. No layout or renderer file changes.

## Interface contract (consumed by T2, T3)

```ts
interface Tile { hasPointOut(): boolean }
```

## Acceptance criteria

- Given a `GtileStop`, `GtileEnd`, `GtileKill`, then `false`; given an
  action, then `true`
- Given a top-down whose last child is a stop, then `false`; whose last
  child is an action, then `true`
- Given a fork with one continuing and one detached branch, then `true`;
  with every branch detached, then `false`
- Given the probe, then the aggregate is **EXACTLY 43977** (stop 6)

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

All four gates green; full `npm test`; the four activity oracle gates
unchanged (1260/1260).

## Commit

`feat(apc-T1): thread FtileGeometry's hasPointOut through the tiles`
