# T2 — Fork/split connectors and the point dedupe

**Agent:** `typescript-pro` · **Depends on:** T1

## Context

Read [`../README.md`](../README.md), [`../decisions.md#d1`](../decisions.md)
and `#d2` (locked). Upstream's split connectors are straight vertical
drops at each branch's own x: `ConnectionIn#drawU`
(`vcompact/ParallelBuilderSplit.java:194-203`): `addPoint(left, 0)`,
`addPoint(left, inY)` under `dx(x)`; `ConnectionOut#drawU` (`:246-261`):
`(left, outY) → (left, height)`, emitted only `if (geo.hasPointOut())`
(`:249`); `ParallelBuilderFork.java:151-163` and `:202-216` are the same
shape. Our fork/split case (`layout/tile-coordinates.ts:324-352`) routes
every branch from `barCenterX` with `GConnectionSideThenVerticalThenSide`,
whose `from.x === to.x` (`routing/gconnection-side-then-vertical-then-side
.ts:6`) exists only to collapse that invented elbow; at text-fitted branch
widths the two centres differ by one ulp and a zero-length `<line>` plus a
horizontal arrowhead appear (`simuti-16-lece058`; the mechanism is in
`plans/activity-min-box-width/decision-journal.md`, row "T2 (pre)").
`Worm#addPoint` (`ftile/Worm.java:253-270`) drops a point equal to the
last one with `==` on doubles — and the jar still emits seven near-zero
segments on three fixtures, so no tolerance is faithful.

## Read-set

- `src/diagrams/activity/layout/tile-coordinates.ts:60-70` (`pushEdge`),
  `:324-352` (fork/split), `:190-215` and `:370-395` (the if/switch uses
  of the helper — NOT yours)
- `src/diagrams/activity/routing/gconnection-side-then-vertical-then-side.ts`
- `src/diagrams/activity/tiles/gtile-fork.ts` (`branchOffsets`,
  `getCoord`), `tiles/tile.ts` (`hasPointOut`, T1)
- `src/diagrams/activity/renderer.ts:150-175` (`arrowTip` from the last
  segment; a two-point vertical edge yields `asToDown`)
- `.agent-notes/apc-T0.md` (jar vs ours line lists for `simuti`, `bixefi`)
- Java: `ParallelBuilderSplit.java:181-287`, `ParallelBuilderFork.java
  :138-241`, `Worm.java:253-270`
- `tests/diagrams/activity/layout/tile-coordinates.test.ts`,
  `tests/diagrams/activity/routing/gconnection.test.ts`

## Write-set

See the batch table. `docs/catalog.md` only on drift. A sibling module
under `layout/` is permitted if `tile-coordinates.ts` (492 lines) would
cross 500.

## Task

Tests first.

1. `pushEdge`: drop a point that equals the previous one exactly (both
   coordinates `===`), cite `Worm.java:253-270`; keep points one ulp apart.
2. Fork/split: for each branch, in-edge `[(bX + north.x, y + BAR_HEIGHT),
   (bX + north.x, bY + north.y)]`; out-edge `[(bX + south.x, bY + south.y),
   (bX + south.x, joinBarY)]` only when `branch.hasPointOut()`. The bar
   node geometry is untouched here (T3).
3. Remove the `from.x === to.x` branch from the helper (the dedupe makes it
   redundant); its if/switch callers keep their shape.
4. Run the subset probe; name every riser's mechanism in the journal
   before committing.

## Interface contract

Edges keep `ActivityEdgeGeo { points }`; `EdgeMeta` unchanged (T5 extends).

## Acceptance criteria

- Given a split branch, when coordinates are assigned, then its in-edge is
  exactly two points at the branch's north x and the arrowhead points down
- Given a branch with `hasPointOut() === false`, then no out-edge exists
  for it; given one with `true`, then a two-point out-edge to the join bar
- Given `pushEdge([p, p, q])`, then the stored edge is `[p, q]`; given two
  points differing by `Number.EPSILON`, then both are kept
- Given `simuti-16-lece058`, then zero zero-length segments and a score
  below 219; given the probe, every riser is journaled with a mechanism

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

All four gates green EXCEPT the expected red in the activity oracle
equality/ratchet gates (list each with counts); no other file red. Report
the subset before → after and the `line[]` / `polygon[]/@points` /
`childCount` families.

## Commit

`fix(apc-T2): connect fork and split branches with vertical drops at their own x`
