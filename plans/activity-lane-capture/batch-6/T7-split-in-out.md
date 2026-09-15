# T7 — give `split` its in and out swimlanes

**Agent:** `typescript-pro` · **Depends on:** T6

## Context

Faithful TypeScript port of PlantUML. Read [`../README.md`](../README.md)
(stops 4–8, red allowance), [`../decisions.md`](../decisions.md) D1, D2 and
D6, `.agent-notes/alc-T1.md` (Q1, Q2, Q3), and T6's commit (the fork pattern
to mirror).

Upstream:
- `InstructionSplit`'s constructor stores `swimlaneIn` as the lane at `split`
  (`InstructionSplit.java:69-76`, from `ActivityDiagram3.java:248-254`), and
  its first branch list defaults to that lane (`:74`).
- `splitAgain` opens each further list with the same default (`:128-134`).
- `endSplit` stores `swimlaneOut` as the lane at `end split` (`:136-141`,
  from `ActivityDiagram3.java:265-273`).
- Its getters return `parent.getSwimlaneOut()` for In (`:167`) and
  `swimlaneOut` for Out (`:172`).
- `ParallelBuilderSplit` draws the top thin line in
  `list99.get(0).getSwimlaneIn()` (`ftile/vcompact/ParallelBuilderSplit.java:83`)
  and the join line in `swimlaneOutForStep2()`
  (`AbstractParallelFtilesBuilder.java:208-210`) — the last list's out lane
  (`InstructionList.java:209-218`).
- **The global current lane is not reset at `split again`**
  (`ActivityDiagram3.java:256-263` never touches `swimlanes`). A branch with
  no lane declaration continues in whatever lane the previous branch left.
  Ours already does this. Keep it.

Ours: `trySplit` (`src/diagrams/activity/node-dispatch.ts:268-293`, or
`parallel-dispatch.ts` after T6) spreads one lane after every branch (`:291`).
The top line uses `laneIn(t.children[0]!, myLane)`
(`layout/walk-fork-branches.ts:133-138`), and the join line uses
`laneOut(lastBranch, myLane)` (`:157-170`).

**Fix:**
- `ActivitySplit.swimlaneOut?`.
- `trySplit` reads the opener lane before the loop, and `swimlaneOut` at
  `end split` (cite).
- `tileSplit` threads both lanes.
- The top line, the join line and the split's own In/Out follow T1's Q2/Q3
  answers **exactly as written in the call-site table**.
- `jevoce`'s rise must be resolved by this task, its mechanism matching T1's
  Q1, or the executor stops (stop 5).

## Read-set

- `src/diagrams/activity/node-dispatch.ts:265-293` (or `parallel-dispatch.ts`)
- `src/diagrams/activity/layout/walk-fork-branches.ts:119-171`
- `src/diagrams/activity/layout/tile-layout.ts:146-152`
- `tests/diagrams/activity/layout/compress/invariant.test.ts:220-265`
- `.agent-notes/alc-T1.md#q1`, `#q2`, `#q3` (the split rows)

## Write-set

`src/diagrams/activity/ast.ts`; `src/diagrams/activity/node-dispatch.ts`
(`trySplit`) or `src/diagrams/activity/parallel-dispatch.ts`;
`src/diagrams/activity/layout/tile-layout.ts` (`tileSplit`);
`src/diagrams/activity/layout/walk-fork-branches.ts`;
`src/diagrams/activity/layout/tile-coordinates.ts` (only if needed);
`tests/unit/activity/parser-lane-capture.test.ts`;
`tests/diagrams/activity/layout/tile-layout.test.ts`;
`tests/diagrams/activity/layout/compress/invariant.test.ts`.

## Interface contract (consumed by T8)

```ts
interface ActivitySplit { kind: 'split'; branches: ActivityNode[][]; swimlane?: string; swimlaneOut?: string }
```

## Acceptance criteria

- Given `jevoce-05-mumi686`'s source, when parsed, then the split has
  `swimlane` `'S1'` and `swimlaneOut` `'S3'`
- Given the laid-out `jevoce`, then the split top line and join line carry the
  lanes T1's Q2 names, and the edge leaving the split carries T1's Q1 lane
- Given the probe against T6's measurement, then only `split` rows move;
  `jevoce`'s movement matches T1's Q1 mechanism, and every riser has a journal row
- Given the invariant test, then `bugaja`, `racana` and `maketa` are gone from
  `ALLOWED_NEW_OVERLAPS`, or each survivor carries a Java-cited re-attribution
  (stop 8), and the list equals the exact remaining entries

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint` and `build` green. `npm test` green, except the four
activity oracle gates on journaled `fixtures.md` slugs.

## Commit

`fix(alc-T7): give activity split its in and out swimlanes`
