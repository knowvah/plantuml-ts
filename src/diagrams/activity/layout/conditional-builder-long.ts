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
import type { VerticalInlabel } from '../tiles/gtile-if-long-vertical.js';
import { measureSide } from '../tiles/gtile-diamond-inside.js';
import { CreoleMode } from '../../../core/klimt/creole/CreoleMode.js';
import { GtileTopDown } from '../tiles/gtile-top-down.js';
import { tileNodes } from './tile-layout.js';
import { withOutLabel } from './tile-layout-inlabel.js';
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
    return new GtileDiamondInside2(b.condition, labels, bounder, theme, true);
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
/**
 * T1d, rows 2/3: each `then`/`elseif` branch's own trailing `-> label;`
 * (right before the NEXT `elseif`/`else`/`endif`) is `Branch#special`
 * (`activitydiagram3/Branch.java:222-229`), set via `InstructionIf
 * #switchToElse2`/`#elseIf`/`#endif` (`:166-198`) at that keyword's own
 * dispatch -- the SAME pending-state machine {@link consumeArrowLabel}
 * already threads through `tileNodes`, just read at the OPPOSITE end of
 * a branch's node list. `GtileIfLongHorizontal#tiles[i]`/`tile2` are
 * ordinary `Tile`s ({@link Tile.outLabel}'s own doc), so no change to
 * that (out-of-write-set) class is needed -- {@link
 * walkIfLongHorizontal}'s own `connectionVerticalOut`/
 * `connectionLastElseOut` read it straight off the SAME object
 * reference this builder sets it on.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:218-221,458-459
 *   -- `ConnectionVerticalOut`, per-`then`/`elseif` branch.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:240-242,377-378
 *   -- `ConnectionLastElseOut`, the `else` branch.
 */
function branchBodyWithOutLabel(
  body: readonly ActivityNode[],
  bounder: StringBounder,
  theme: Theme,
  ctx: IfLayoutCtx,
): Tile {
  const { tiles, trailing } = tileNodes([...body], bounder, theme, ctx.laneOrder, ctx.pragma);
  return withOutLabel(new GtileTopDown(tiles, bounder, theme), trailing);
}

export function buildIfLongHorizontal(node: ActivityIf, bounder: StringBounder, theme: Theme, ctx: IfLayoutCtx): Tile {
  const branches = longHorizontalBranches(node);
  const tiles = branches.map((b): Tile => branchBodyWithOutLabel(b.body, bounder, theme, ctx));
  const tile2 = branchBodyWithOutLabel(node.elseBranch, bounder, theme, ctx);
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
 * `.withWest`; see {@link measureVerticalInlabel}.
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
    return new GtileDiamondInside2(b.condition, labels, bounder, theme, false);
  });
}

/**
 * `tbInlabel = branch.getInlabel().create(fcArrow, LEFT, ...)` and its
 * `calculateDimension(...).getWidth()` (`FtileIfLongVertical.java:154-157`):
 * the FULL creole block at the arrow font (add4-T3h), `undefined` for a
 * branch with no inlabel (`Display.isNull`).
 */
function measureVerticalInlabel(
  label: string | undefined,
  bounder: StringBounder,
  theme: Theme,
): VerticalInlabel | undefined {
  if (label === undefined || label === '') return undefined;
  return { label, width: measureSide(label, bounder, theme, CreoleMode.FULL).width };
}

/**
 * `FtileIfLongVertical.create` (`!pragma useVerticalIf true` + `elseif`
 * chains, D12/T1p-b): a downward column of condition hexagons, each coupled
 * with its own branch body to the right, converging on a label-less merge
 * diamond fed by the `else` clause (`tile2`, below the column).
 *
 * T1d: a branch's own trailing `-> label;` is discarded here, NOT wired
 * -- confirmed by grep (`getSpecial`/`getTextBlockSpecial` appear
 * nowhere in this file) that `FtileIfLongVertical.create` never reads
 * `Branch#special` at all. `InstructionIf#elseIf`/`#endif` still CAPTURE
 * the pending label on every `Branch` regardless of which Ftile builder
 * eventually consumes `thens` (`InstructionIf.java:166-198`), but this
 * builder's own `conns` list (`:173-203`) never calls `getSpecial()` --
 * upstream itself silently drops the label for `!pragma useVerticalIf
 * true` chains. Mirrored faithfully (dead data, not a bug to fix) per
 * this project's "preserve information-carrying output... including
 * behaviour that looks like a bug" rule.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:131-204
 */
export function buildIfLongVertical(node: ActivityIf, bounder: StringBounder, theme: Theme, ctx: IfLayoutCtx): Tile {
  const branches = longHorizontalBranches(node);
  const tiles = branches.map(
    (b): Tile =>
      new GtileTopDown(tileNodes([...b.body], bounder, theme, ctx.laneOrder, ctx.pragma).tiles, bounder, theme),
  );
  const tile2 = new GtileTopDown(
    tileNodes([...node.elseBranch], bounder, theme, ctx.laneOrder, ctx.pragma).tiles,
    bounder,
    theme,
  );
  const diamonds = buildLongVerticalDiamonds(branches, bounder, theme);
  const inlabels = branches.map((b) => measureVerticalInlabel(b.incomingLabel, bounder, theme));
  return new GtileIfLongVertical(diamonds, tiles, tile2, node.elseLabel, inlabels);
}
