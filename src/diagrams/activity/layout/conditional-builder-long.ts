/**
 * The `elseif`-chain if-builders, split out of `conditional-builder.ts`
 * (hook-enforced 500-line cap; add2 T3i needed the room for ELSEIFIN) --
 * `FtileIfLongHorizontal.create`'s per-branch hexagon row and
 * `FtileIfLongVertical.create`'s downward column, both built from the
 * same `thens` branch list (`FtileFactoryDelegatorIf#createIf`'s own
 * `thens`, D1).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:150-201
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:131-204
 */

import type { ActivityIf, ActivityElseIf, ActivityNode } from '../ast.js';
import type { Theme } from '../../../core/theme.js';
import type { StringBounder, Tile } from '../tiles/tile.js';
import { GtileDiamondInside2 } from '../tiles/gtile-diamond-inside2.js';
import { GtileIfLongHorizontal } from '../tiles/gtile-if-long-horizontal.js';
import { GtileIfLongVertical } from '../tiles/gtile-if-long-vertical.js';
import { GtileTopDown } from '../tiles/gtile-top-down.js';
import { tileNodes } from './tile-layout.js';
import type { IfLayoutCtx } from './conditional-builder.js';

interface LongHorizontalBranch {
  readonly condition: string;
  readonly label: string | undefined;
  /**
   * ELSEIFIN (add2 T3i): `Branch#getInlabel()` -- only an `elseif`'s own
   * leading `(incoming)` decoration captures one
   * (`ActivityElseIf.incomingLabel`, `ast.ts`); the first `then` branch
   * has no grammatical analogue (`CommandElseIf2.java:70-76` fires only
   * on `elseif`), so it is always `undefined`.
   */
  readonly incomingLabel: string | undefined;
  readonly body: readonly ActivityNode[];
}

/** `thens` = `then` plus every `elseif`, in source order (`FtileFactory
 *  DelegatorIf#createIf`'s own `thens` list). */
function longHorizontalBranches(node: ActivityIf): LongHorizontalBranch[] {
  const first: LongHorizontalBranch = {
    condition: node.condition,
    label: node.thenLabel,
    incomingLabel: undefined,
    body: node.thenBranch,
  };
  const rest = node.elseIfBranches.map((e: ActivityElseIf): LongHorizontalBranch => ({
    condition: e.condition,
    label: e.label,
    incomingLabel: e.incomingLabel,
    body: e.body,
  }));
  return [first, ...rest];
}

/**
 * Each branch's own hexagon (`.withNorth(tb1)`, the branch's own positive
 * label) plus, on the LAST branch only, the `else` clause's own positive
 * label (`.withEast(tb2)`), plus (ELSEIFIN, add2 T3i) the branch's own
 * leading in-label on the WEST side (`.withWest(tbInlabel)`) when the
 * `elseif` carried one.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:167-197,178-186
 */
function buildLongHorizontalDiamonds(
  branches: readonly LongHorizontalBranch[],
  elseLabel: string | undefined,
  bounder: StringBounder,
  theme: Theme,
): GtileDiamondInside2[] {
  return branches.map((b, i) => {
    const labels: { north?: string; east?: string; west?: string } = {};
    if (b.label !== undefined) labels.north = b.label;
    if (i === branches.length - 1 && elseLabel !== undefined) labels.east = elseLabel;
    if (b.incomingLabel !== undefined) labels.west = b.incomingLabel;
    return new GtileDiamondInside2(b.condition, labels, bounder, theme);
  });
}

/**
 * `FtileIfLongHorizontal.create` (`elseif` chains, D1): a hexagon per
 * branch (`then` + every `elseif`), each coupled with its own branch
 * content, plus the `else` branch placed to the right of the row.
 * ELSEIFIN (add2 T3i): `inlabelSizes` is now each diamond's own measured
 * west-label width, read back via `labelAt('west')` (`0` when the branch
 * carried no in-label) -- matching `tbInlabel.calculateDimension(...)
 * .getWidth()` / the Java's own `inlabelSizes.add(0.0)` default
 * (`FtileIfLongHorizontal.java:182-187`); this is the horizontal margin
 * `coupleGeometry`'s own `addHorizontalMargin` fold reserves so the west
 * label does not overlap the preceding branch's column.
 */
export function buildIfLongHorizontal(node: ActivityIf, bounder: StringBounder, theme: Theme, ctx: IfLayoutCtx): Tile {
  const branches = longHorizontalBranches(node);
  const tiles = branches.map(
    (b): Tile => new GtileTopDown(tileNodes([...b.body], bounder, theme, ctx.laneOrder, ctx.pragma), bounder, theme),
  );
  const tile2 = new GtileTopDown(
    tileNodes([...node.elseBranch], bounder, theme, ctx.laneOrder, ctx.pragma),
    bounder,
    theme,
  );
  const diamonds = buildLongHorizontalDiamonds(branches, node.elseLabel, bounder, theme);
  const inlabelSizes = diamonds.map((d) => d.labelAt('west')?.width ?? 0);
  return new GtileIfLongHorizontal(diamonds, tiles, tile2, inlabelSizes);
}

/**
 * Each branch's own `east` label (`diamond.withEast(tb1)`, the branch's own
 * positive label -- `thenLabel` for branch 0, each `elseif`'s own `label`
 * after) -- DIFFERENT slot from `buildLongHorizontalDiamonds`'s `north`
 * (`FtileDiamondInside2`'s `north`/`east` are independent label slots, this
 * builder's diamonds never set `north`). `inlabel` here is NOT drawn on
 * the diamond at all: `FtileIfLongVertical.java:154-157,185-189` passes it
 * to `ConnectionVertical`, the connecting ARROW between consecutive
 * diamonds -- a different mechanism from the horizontal builder's
 * `.withWest`, out of ELSEIFIN's cited scope
 * (`FtileIfLongHorizontal.java:178-186` only); left as the same
 * documented gap it always was.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:142-160
 */
function buildLongVerticalDiamonds(
  branches: readonly LongHorizontalBranch[],
  bounder: StringBounder,
  theme: Theme,
): GtileDiamondInside2[] {
  return branches.map((b) => {
    const labels: { east?: string } = {};
    if (b.label !== undefined) labels.east = b.label;
    return new GtileDiamondInside2(b.condition, labels, bounder, theme);
  });
}

/**
 * `FtileIfLongVertical.create` (`!pragma useVerticalIf true` + `elseif`
 * chains, D12/T1p-b): a downward column of condition hexagons, each coupled
 * with its own branch body to the right, converging on a label-less merge
 * diamond fed by the `else` clause (`tile2`, below the column).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:131-204
 */
export function buildIfLongVertical(node: ActivityIf, bounder: StringBounder, theme: Theme, ctx: IfLayoutCtx): Tile {
  const branches = longHorizontalBranches(node);
  const tiles = branches.map(
    (b): Tile => new GtileTopDown(tileNodes([...b.body], bounder, theme, ctx.laneOrder, ctx.pragma), bounder, theme),
  );
  const tile2 = new GtileTopDown(
    tileNodes([...node.elseBranch], bounder, theme, ctx.laneOrder, ctx.pragma),
    bounder,
    theme,
  );
  const diamonds = buildLongVerticalDiamonds(branches, bounder, theme);
  return new GtileIfLongVertical(diamonds, tiles, tile2, node.elseLabel);
}
