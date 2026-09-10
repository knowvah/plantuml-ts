# T5 — Cross-lane fork/split elbows

**Agent:** `typescript-pro` · **Depends on:** T2, T4

## Context

Read [`../decisions.md#d6`](../decisions.md) (locked). When a branch sits
in another lane than its bar, upstream draws the connector through
`drawTranslate`: `ConnectionIn` — `mp1a → (mp1a.x, middle) → (mp2b.x,
middle) → mp2b` with `middle = mp1a.getY() + 4` (`ParallelBuilderFork.java
:166-184`, `ParallelBuilderSplit.java:207-225`); `ConnectionOut` — the
same with `middle = mp2b.getY() − 14` (`:220-241`, `:264-285`). Our
`swimlane-placement.ts#routeEdge` (`:293-335`) applies one shape to every
cross-lane edge, the `(p1.y + p2.y)/2` jog of `ConnectionVerticalDown
.java:87-100`, and its module doc (`:1-40`) names the fork/split case as a
bounded simplification justified by our then-unsourced bar geometry. After
T3/T4 the bar and branch geometry are upstream's, so the two literals sit
on the same numbers they do upstream.

## Read-set

- `src/diagrams/activity/layout/swimlane-placement.ts:1-70, 285-340,
  380-407` (`EdgeMeta`, `routeEdge`, `placeSwimlanes`)
- `src/diagrams/activity/layout/tile-coordinates.ts:60-70` (`pushEdge`),
  the fork/split case (T2's shape)
- `.agent-notes/apc-T0.md` (`bixefi-77-moki051`: jar `118.35,46.5 →
  118.35,50.5 → 184.05,50.5` is the `+4` shape)
- Java: `ParallelBuilderFork.java:166-184, 220-241`;
  `ParallelBuilderSplit.java:207-225, 264-285`;
  `vcompact/ConnectionVerticalDown.java:87-100` (the shape you leave)
- `tests/diagrams/activity/layout/swimlane-placement.test.ts`,
  `tile-coordinates.test.ts`

## Write-set

See the batch table. `docs/catalog.md` only on drift.

## Task

Tests first.

1. `EdgeMeta` gains `shape: 'parallel-in' | 'parallel-out' | 'default'`;
   `pushEdge` takes it (default `'default'`); the fork/split case passes
   `'parallel-in'` for bar → branch and `'parallel-out'` for branch → join.
2. `routeEdge`: for `'parallel-in'`, the horizontal is at `from.y + 4`;
   for `'parallel-out'`, at `to.y − 14`; everything else keeps the
   average-Y shape byte for byte. Update the module doc: the simplification
   it names is gone, with the citations.
3. Same-lane parallel edges are unchanged (two points).

## Interface contract

`EdgeMeta { lane1, lane2, shape }` — internal to `layout/`.

## Acceptance criteria

- Given a fork in-edge from lane A's bar to a branch in lane B, then its
  points are `from, (from.x, from.y + 4), (to.x, from.y + 4), to`
- Given a fork out-edge from lane B to lane A's join bar, then the
  horizontal is at `to.y − 14`
- Given a plain cross-lane action-to-action edge, then its points are
  identical to before this task
- Given the 17 laned fork/split fixtures, then the swimlane census's lane
  extents are unchanged (only edges move)

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

All four gates green except the expected activity oracle gates (counts);
the swimlane census's `lanes` field must not move on any fixture (state
it). Subset before → after.

## Commit

`fix(apc-T5): jog cross-lane fork and split connectors at +4 and -14`
