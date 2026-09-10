# T4 — Pre-compression parallel geometry

**Agent:** `typescript-pro` · **Depends on:** T3

## Context

Read [`../decisions.md#d3`](../decisions.md) (locked).
`AbstractParallelFtilesBuilder#computeNewFtile` (`:128-136`) decorates
every branch: `FtileUtils.addHorizontalMargin(ftile, xMargin, xMargin +
getSuppForIncomingArrow(ftile))` with `xMargin = 14` (`FtileMarged.java
:93-97` adds `margin1` to `left`), then `FtileHeightFixedCentered(tmp,
maxHeight + 2 * spaceArroundBlackBar)` with `spaceArroundBlackBar = 20`
(`FtileHeightFixedCentered.java:88-98`: translate `dy((fixed − h)/2)`),
then `FtileHeightFixedMarged(ymargin1, tmp, ymargin2)` where the margins
are the tallest in/out link label heights (`:101-126`). `FtileForkInner`
packs the decorated branches `xpos += dim.getWidth()` with no other gap
and reports width = Σ, height = max. Our `GtileFork` (`tiles/gtile-fork.ts
:19-38`) uses `NODE_MARGIN_X 40` between branches, `BAR_OVERHANG 10`
outside them and `NODE_MARGIN_Y 20` above/below — none sourced. Our fork
AST (`ast.ts:97-106`) carries no per-branch link labels, so `ymargin1`,
`ymargin2` and the incoming-arrow supplement are 0 today.

## Read-set

- `src/diagrams/activity/tiles/gtile-fork.ts` (whole), `gtile-split.ts`,
  `activity-layout-constants.ts`, `ast.ts:97-106`
- `src/diagrams/activity/layout/tile-coordinates.ts:324-352` (consumes
  `branchOffsets`, `branchTopY`, `barWidth` — READ ONLY here)
- Java: `AbstractParallelFtilesBuilder.java:89-165`, `FtileMarged.java
  :93-97`, `FtileHeightFixedCentered.java:88-98`, `FtileHeightFixedMarged
  .java:89-92`, `vcompact/FtileForkInner.java`, `ParallelBuilderFork.java
  :82-102` (`x += dim.getWidth()`), `ParallelBuilderSplit.java:77-113`
- `tests/diagrams/activity/tiles/gtile-fork.test.ts` (`:7-10` pin the old
  constants), `gtile-split.test.ts`

## Write-set

See the batch table. `docs/catalog.md` only on drift.

## Task

Tests first.

1. Constants: `PARALLEL_X_MARGIN = 14`, `SPACE_AROUND_BLACK_BAR = 20`,
   cited to `:130` and `:129`; delete `BAR_OVERHANG`.
2. `GtileFork`: each branch's slot is `14 + width + 14 + supp(0)`;
   `branchOffsets[i]` = Σ previous slots + 14; `barWidth = width = Σ slots`;
   `branchTopY = BAR_HEIGHT + ymargin1(0) + 20 + (maxH − branchH)/2` per
   branch (centred — `branchTopY` becomes per-branch or the composite
   centres each child; mirror `FtileHeightFixedCentered`); total height
   `BAR_HEIGHT + ymargin1 + maxH + 40 + ymargin2 + BAR_HEIGHT` (the split
   style uses `THIN_SPLIT_HEIGHT` where the fork uses `BAR_HEIGHT`).
   Port `ymargin1/2` and the incoming-arrow supplement as functions of a
   label height that receives 0, documented — never dropped.
3. Run the probe; journal the packing delta (28 vs 10) per fixture class
   BEFORE the commit; any rise with another mechanism gets its own row.

## Acceptance criteria

- Given two 80-wide branches, then offsets are `14` and `14+80+14+14 =
  122`, width `216`, and the join bar starts `40 + maxH` below the top
  bar's bottom
- Given branches of different heights, then each is centred in the
  tallest (`dy = (maxH − h)/2`)
- Given the constants file, then `BAR_OVERHANG` is gone and
  `gtile-fork.ts` no longer imports `NODE_MARGIN_X`
- Given the probe, then every riser is journaled: the packing delta by
  name, anything else by its own mechanism

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

All four gates green except the expected activity oracle gates (counts);
report the subset before → after and the width/x families separately from
the line/polygon families so the delta is visible.

## Commit

`fix(apc-T4): margin and centre parallel branches as computeNewFtile does`
