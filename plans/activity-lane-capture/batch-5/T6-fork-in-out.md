# T6 — give `fork` its in and out swimlanes

**Agent:** `typescript-pro` · **Depends on:** T5

## Context

Faithful TypeScript port of PlantUML. Read [`../README.md`](../README.md)
(stops 4–8, red allowance), [`../decisions.md`](../decisions.md) D1, D2 and
D6, and `.agent-notes/alc-T1.md` (Q1, Q3).

Upstream:
- `InstructionFork`'s constructor sets `swimlaneIn = swimlaneOut =` the lane
  at `fork` (`InstructionFork.java:84-91`, called from
  `ActivityDiagram3.java:216-223`).
- `forkAgain` sets `swimlaneOut` to the lane at each `fork again`
  (`:138-141`, from `ActivityDiagram3.java:230`), and `setStyle` sets it to
  the lane at `end fork` (`:193-197`, from `:239`).
- `createFtile` passes both to `createParallel` (`:127`).
- `ParallelBuilderFork` draws the top black bar in `in` (`:85`) and the join
  bar in `out` (`:77,110`). `ConnectionIn` runs from the top bar into each
  branch (`:93`); `ConnectionOut` runs from each branch into the join bar (`:126`).

Ours: `tryFork` (`src/diagrams/activity/node-dispatch.ts:238-263`) spreads
one lane after every branch (`:261`). `pushTopBarOrLine` puts the fork bar in
`myLane` (`layout/walk-fork-branches.ts:124-131`). `pushJoinBarOrLine` uses
`laneOut(lastBranch, myLane)` (`:147-155`). `pushBranchConnectors` gives both
connectors the bar-side lane `ctx.myLane` (`:69-97`).

**Fix:**
- `ActivityFork.swimlaneOut?`.
- `tryFork` reads the opener lane before the loop, starts `swimlaneOut` at
  it, and re-reads `ctx.currentSwimlane` on each `fork again` and on
  `end fork` (cite each).
- `tileFork` threads both lanes.
- The walker draws the top bar and the in-connectors' bar side in the fork's
  `swimlane`, and the join bar and the out-connectors' bar side in
  `laneOut(t, myLane)` — upstream's `out`, not the last branch's lane.
- If the fork/split context struct is built in `tile-coordinates.ts`, that
  file is writable here (journal it).
- If `node-dispatch.ts` would pass 500 lines, move `tryFork`/`trySplit`
  verbatim to `parallel-dispatch.ts`, following `if-dispatch.ts`, and journal
  it. T7 then writes that file.
- `end merge` (`ForkStyle.MERGE`): if our parser does not handle it, FILE it.

Split keeps its current lanes until T7. Do not change `gtile-split` paths
here unless T1's table says the two kinds share a call site.

## Read-set

- `src/diagrams/activity/node-dispatch.ts:235-293`;
  `src/diagrams/activity/ast.ts:95-107`
- `src/diagrams/activity/layout/walk-fork-branches.ts:1-188`
- `src/diagrams/activity/layout/tile-layout.ts:138-152`
- `tests/diagrams/activity/layout/compress/invariant.test.ts:220-265`
- `.agent-notes/alc-T1.md#q1`, `#q3` (the fork rows)

## Write-set

`src/diagrams/activity/ast.ts`; `src/diagrams/activity/node-dispatch.ts`
(`tryFork`) or `src/diagrams/activity/parallel-dispatch.ts` (new, if the cap
bites); `src/diagrams/activity/layout/tile-layout.ts` (`tileFork`);
`src/diagrams/activity/layout/walk-fork-branches.ts`;
`src/diagrams/activity/layout/tile-coordinates.ts` (only if needed);
`tests/unit/activity/parser-lane-capture.test.ts`;
`tests/diagrams/activity/layout/tile-layout.test.ts`;
`tests/diagrams/activity/layout/compress/invariant.test.ts`.

## Interface contract (consumed by T7)

```ts
interface ActivityFork { kind: 'fork'; branches: ActivityNode[][]; swimlane?: string; swimlaneOut?: string }
```

## Acceptance criteria

- Given `bixefi-77-moki051`'s source (`|swim1|`, `fork`, …, `|swim3|`,
  `end fork`), when parsed, then the fork has `swimlane` `'swim1'` and
  `swimlaneOut` `'swim3'`
- Given a lane switch only before `fork again`, then `swimlaneOut` is that
  lane, and `end fork` in the same lane leaves it unchanged
- Given the laid-out `bixefi`, then the `fork-bar` node's lane is `'swim1'`
  and the `join-bar` node's lane is `'swim3'`
- Given the invariant test, then `bixefi` and `tobajo` no longer appear in
  `ALLOWED_NEW_OVERLAPS`; any survivor is re-attributed per stop 8, and the
  list equals the exact remaining entries
- Given the probe, then only `fork` rows move, and every riser has a journal row

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint` and `build` green. `npm test` green, except the four
activity oracle gates on journaled `fixtures.md` slugs.

## Commit

`fix(alc-T6): give activity fork its in and out swimlanes`
