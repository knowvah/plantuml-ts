# T2 — move the lane helpers out and add `Tile.swimlaneOut`

**Agent:** `typescript-pro` · **Depends on:** T1

## Context

Faithful TypeScript port of PlantUML. Read [`../README.md`](../README.md),
[`../decisions.md#d1`](../decisions.md) (locked) and T1's call-site table in
`.agent-notes/alc-T1.md#q3`. `layout/swimlane-placement.ts` is 496 lines, and
a hook blocks any write that leaves a file over 500. `laneAt`, `laneIn` and
`laneOut` (`:71-102`) move **verbatim** to a new `layout/swimlane-lanes.ts`,
and `swimlane-placement.ts` re-exports them. Every importer
(`walk-fork-branches.ts:5`, `walk-while-branch.ts`, `tile-coordinates.ts`,
the tests) stays untouched: this is a move for the line cap, not a refactor.

Then D1: `Tile` (`tiles/tile.ts:27`) gains `readonly swimlaneOut?: string`,
citing `ftile/Swimable.java` and `InstructionFork.java:69`. `laneOut` returns
`tile.swimlaneOut ?? tile.swimlane` before it descends into children, and
`laneIn` never reads `swimlaneOut`. Nothing sets `swimlaneOut` in this task,
so output cannot move. Also correct the stale sentence at `tile.ts:21`
("not yet consumed by layout or rendering"), which has been false since
asr-T3. That is a 1–3 line fix in a file this task already owns.

## Read-set

- `src/diagrams/activity/layout/swimlane-placement.ts:60-102`
- `src/diagrams/activity/tiles/tile.ts:10-40`
- `src/diagrams/activity/layout/tile-layout.ts:40-51` (`withSwimlane`)
- `tests/diagrams/activity/layout/swimlane-placement.test.ts:1-108`
- `.agent-notes/alc-T1.md#q3` — if it changes `laneIn`/`laneOut` semantics,
  follow it and journal the change

## Write-set

`src/diagrams/activity/layout/swimlane-lanes.ts` (new);
`src/diagrams/activity/layout/swimlane-placement.ts`;
`src/diagrams/activity/tiles/tile.ts`;
`tests/diagrams/activity/layout/swimlane-placement.test.ts`.

## Task

Tests first: add the two `laneOut`/`laneIn` cases below to the existing
`laneAt/laneIn/laneOut` describe block. Move, then re-export, then add the field.

## Interface contract (consumed by T5–T7)

```ts
interface Tile {
  readonly swimlane?: string;
  readonly swimlaneOut?: string; // new
  // ...unchanged
}
// swimlane, else first child of an unlabeled top-down wrapper, else inherited
function laneIn(tile: Tile, inherited: string | undefined): string | undefined;
// swimlaneOut ?? swimlane, else last child of an unlabeled top-down wrapper, else inherited
function laneOut(tile: Tile, inherited: string | undefined): string | undefined;
```

## Acceptance criteria

- Given a tile with `swimlane: 'A'` and `swimlaneOut: 'B'`, then `laneIn` is
  `'A'` and `laneOut` is `'B'`
- Given a tile with only `swimlane: 'A'`, then both return `'A'` (existing
  cases unchanged)
- Given the probe, then `aggregate` is 52954 and every `delta` is 0
- Given `wc -l`, then `swimlane-placement.ts` is at most 500, and
  `git diff` shows no importer changed

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

All four gates green; no fixture moves.

## Commit

`feat(alc-T2): add Tile.swimlaneOut behind the moved lane helpers`
