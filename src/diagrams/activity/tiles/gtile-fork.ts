import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import { BAR_HEIGHT, PARALLEL_X_MARGIN, SPACE_AROUND_BLACK_BAR } from '../activity-layout-constants.js';

/**
 * Tallest in/out-link label height across every branch (`ymargin1`/
 * `ymargin2`, computed ONCE over all branches, not per branch).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/AbstractParallelFtilesBuilder.java:100-125
 *   -- `getSuppSpace1`/`getSuppSpace2`.
 * Our fork/split AST (`../ast.ts:97-106`) carries no per-branch link
 * labels yet, so the one call site below passes an empty array and this
 * always returns 0 until a link-label port fills the seam.
 */
function tallestLabelHeight(labelHeights: readonly number[]): number {
  return Math.max(0, ...labelHeights);
}

/**
 * Extra right margin for a branch whose in/out link label overflows the
 * branch's own decorated width, else 0.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/AbstractParallelFtilesBuilder.java:138-156
 *   -- `getSuppForIncomingArrow`/`getXSuppForDisplay`:
 *   `pos2 = ftileDim.getLeft() + textWidth; return pos2 > ftileDim.getWidth() ? pos2 - ftileDim.getWidth() : 0;`.
 * Our fork/split AST tracks no label width yet, so the one call site
 * below passes 0 and this always returns 0 until a link-label port fills
 * the seam.
 */
function suppForIncomingArrow(labelWidth: number, branchLeft: number, branchWidth: number): number {
  const pos2 = branchLeft + labelWidth;
  return pos2 > branchWidth ? pos2 - branchWidth : 0;
}

export class GtileFork extends TileComposite {
  // Widened to `string` so subclasses (e.g. GtileSplit) can override with
  // a different literal while still being assignable to the parent type.
  readonly kind: string = 'gtile-fork';
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];
  readonly branchOffsets: readonly number[];
  /**
   * Each branch's own top y within the band, centring it on the tallest
   * branch (`FtileHeightFixedCentered`, `dy((fixedHeight - h) / 2)`) then
   * shifting by `ymargin1` (`FtileHeightFixedMarged`, `dy(ymargin1)`) --
   * both measured from the band's own top, i.e. `barHeight` below `y`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileHeightFixedCentered.java:88-98
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileHeightFixedMarged.java:89-96
   */
  readonly branchTopYs: readonly number[];
  readonly barWidth: number;
  /**
   * The top/bottom bar band's height -- `6` for fork
   * (`AbstractParallelFtilesBuilder.java:64`), `THIN_SPLIT_HEIGHT` (1.5,
   * `FtileThinSplit.java:61`) for `GtileSplit`, which passes it through
   * this constructor's third parameter. Exposed so the coordinate pass
   * (`layout/tile-coordinates.ts`, `layout/walk-fork-branches.ts`) can
   * size the bar/line nodes and the branch connectors' bar-adjacent
   * endpoint without re-deriving which kind of tile it is walking.
   */
  readonly barHeight: number;

  constructor(branches: Tile[], _bounder: StringBounder, barHeight: number = BAR_HEIGHT) {
    super();
    this.children = branches;
    this.barHeight = barHeight;

    // getSuppSpace1/getSuppSpace2 -- no per-branch link labels tracked yet.
    const ymargin1 = tallestLabelHeight([]);
    const ymargin2 = tallestLabelHeight([]);

    // computeNewFtile: each branch is independently margined by
    // PARALLEL_X_MARGIN on both sides (plus the label-overflow supplement
    // on the right), then packed with NO other gap (FtileForkInner).
    const slots = branches.map((b) => {
      const supp = suppForIncomingArrow(0, 0, b.width);
      return PARALLEL_X_MARGIN + b.width + PARALLEL_X_MARGIN + supp;
    });
    this.width = slots.reduce((s, slot) => s + slot, 0);
    this.barWidth = this.width;

    const offsets: number[] = [];
    let x = 0;
    for (const slot of slots) {
      offsets.push(x + PARALLEL_X_MARGIN);
      x += slot;
    }
    this.branchOffsets = offsets;

    const maxBranchH = Math.max(0, ...branches.map((b) => b.height));
    const fixedHeight = maxBranchH + 2 * SPACE_AROUND_BLACK_BAR;
    this.branchTopYs = branches.map((b) => barHeight + ymargin1 + (fixedHeight - b.height) / 2);
    this.height = barHeight + ymargin1 + fixedHeight + ymargin2 + barHeight;
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.width / 2, y: 0 };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: this.width / 2, y: this.height };
      case EAST_HOOK:
        return { x: this.width, y: this.height / 2 };
      case WEST_HOOK:
        return { x: 0, y: this.height / 2 };
      /* c8 ignore next 3 */
      default: {
        const _exhaustive: never = hook;
        throw new Error(`Unknown hook: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * Unconditionally `true` -- NOT "any branch has one". A fork's join bar
   * is an unconditional `FtileBlackBlock`, and `ParallelBuilderFork` never
   * wraps its result in `FtileKilled` the way `ParallelBuilderSplit` does;
   * each branch's own `hasPointOut()` only gates whether THAT branch draws
   * a `ConnectionOut` into the bar, not whether the fork itself continues.
   *
   * DISCOVERED DIVERGENCE from `decisions.md` D5's "a fork/split's is 'any
   * branch has one' (hasOut())": that generalisation holds for split (see
   * `GtileSplit`'s override) but not fork. Filed for `decisions.md` review;
   * not amended here (outside this task's write-set).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileForkInner.java:102-113
   *   -- the branches' union geometry, unconditional 5-arg `FtileGeometry`
   *   with `outY = dimTotal.getHeight()`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBlackBlock.java:94
   *   -- the join bar, unconditional 5-arg `FtileGeometry` with
   *   `outY = height`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileAssemblySimple.java:120-130
   *   -- `appendBottom` takes the LOWER tile's (the bar's) hasPointOut.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderFork.java
   *   -- `doStep1`/`doStep2` (`:87-131`) never wrap the result in
   *   `FtileKilled`, unlike `ParallelBuilderSplit.java:150-151`.
   */
  hasPointOut(): boolean {
    return true;
  }
}
