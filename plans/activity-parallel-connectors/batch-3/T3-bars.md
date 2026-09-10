# T3 — Bars

**Agent:** `typescript-pro` · **Depends on:** T1, T2

## Context

Read [`../decisions.md#d4`](../decisions.md) (locked). Fork:
`FtileBlackBlock#setBlackBlockDimension(width, height)` is called with the
inner (all branches, margined) width and `barHeight` for both bars
(`vcompact/ParallelBuilderFork.java:98`, `:112`); `barHeight = 6`
(`AbstractParallelFtilesBuilder.java:64`); the block is built in swimlane
`in` for the top bar and `out` for the join (`:87`, `:110`); its rect is
`URectangle.build(width, height).rounded(5)` filled and stroked in the bar
colour (`vertical/FtileBlackBlock.java:101-110`; the stroke is a filed
defect, do not add it). Split: `FtileThinSplit` (`vertical/FtileThinSplit
.java:61,76-96`) is `ULine.hline(last − first)` at `dx(first)`, height
1.5, drawn with `UStroke.withThickness(1.5)`, in `HColors.none()` when its
colour is null; step 1 spans `first..last` over ALL branches' `getLeft()`
(`ParallelBuilderSplit.java:77-113`), step 2 only over branches with an out
point (`:136-180`), both clamped to the inner geometry's `getLeft()`; when
no branch has an out point the whole split becomes `FtileKilled`
(`:127-133`, `:139-141`) — no join line, no out point. Ours draws both
styles as an 8-high rect spanning the full tile width plus overhang
(`activity-layout-constants.ts:29`, `gtile-fork.ts`, `renderBar` at
`activity-renderer-shapes.ts:277-281`).

## Read-set

- `src/diagrams/activity/activity-layout-constants.ts` (`BAR_HEIGHT`),
  `tiles/gtile-fork.ts` (whole), `layout/tile-coordinates.ts:324-352`,
  `activity-renderer-shapes.ts:270-285` and the `renderNode` dispatch
  (`:525-540`)
- `src/diagrams/activity/activity-layout-fork.ts:80-90, 190-200` — READ
  ONLY (superseded engine; shows the kinds the old code used)
- `.agent-notes/apc-T0.md` (jar bar geometry for `simuti`, `bixefi`)
- Java: `ParallelBuilderFork.java:82-133`, `ParallelBuilderSplit.java
  :77-180`, `FtileThinSplit.java`, `FtileBlackBlock.java:79-110`,
  `FtileKilled.java:71-78`, `AbstractParallelFtilesBuilder.java:64`
- `tests/unit/activity/renderer-shapes.test.ts` (bar pins),
  `tests/diagrams/activity/tiles/gtile-fork.test.ts`

## Write-set

See the batch table. `docs/catalog.md` only on drift. The 500-line hook is
directional on `activity-renderer-shapes.ts` (562 lines): it may not grow.

## Task

Tests first.

1. Constants: `BAR_HEIGHT = 6` (`AbstractParallelFtilesBuilder.java:64`),
   `THIN_SPLIT_HEIGHT = 1.5` (`FtileThinSplit.java:61`); the fork's
   geometry uses `BAR_HEIGHT` for the fork style and `THIN_SPLIT_HEIGHT`
   for split (`GtileSplit` overrides `kind`; give it the bar height too).
2. Node kinds: fork `fork-bar` / `join-bar` (rect, inner width, height 6);
   split `split-bar` / `split-join-bar` (line node: `x = first`,
   `width = last − first`, `height = 1.5`), `first..last` computed from
   the branch north x (top) and the south x of branches with an out point
   (join), clamped to the inner centre as upstream clamps to `getLeft()`.
3. `FtileKilled`: when no branch has an out point, emit no join node and
   no out-edges; `GtileFork.hasPointOut()` (T1) already says `false`.
4. `renderBar`: rect for the fork kinds (no stroke, as today); a `<line>`
   at `stroke-width 1.5` for the split kinds. The renderer's swimlane order
   (`activity-renderer-swimlanes.ts`) is untouched.

## Interface contract (consumed by T4, T5, the renderer)

Node kinds as above; `ActivityNodeGeo.kind` is an open `string`.

## Acceptance criteria

- Given a fork, then both bars are 6 high at the inner width; given the
  default theme, then `<rect>` with no stroke attribute
- Given a split with three continuing branches, then the top and join
  lines span the first to last branch x; given one where only the last
  continues, then the join line spans only from that branch's x
- Given a split whose branches all detach, then no join node and no
  out-edge
- Given the probe, then the subset falls; every riser has a mechanism

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

All four gates green except the expected activity oracle gates (listed
with counts). Report the subset and the `rect[]` / `line[]` families.

## Commit

`fix(apc-T3): draw the fork block and the split thin line as upstream sizes them`
