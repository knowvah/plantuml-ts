import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import { BAR_HEIGHT, NODE_MARGIN_X, NODE_MARGIN_Y } from '../activity-layout-constants.js';

const BAR_OVERHANG = 10;

export class GtileFork extends TileComposite {
  // Widened to `string` so subclasses (e.g. GtileSplit) can override with
  // a different literal while still being assignable to the parent type.
  readonly kind: string = 'gtile-fork';
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];
  readonly branchOffsets: readonly number[];
  readonly branchTopY: number;
  readonly barWidth: number;

  constructor(branches: Tile[], _bounder: StringBounder) {
    super();
    this.children = branches;
    const branchTotalWidth =
      branches.reduce((s, b) => s + b.width, 0) + Math.max(0, branches.length - 1) * NODE_MARGIN_X;
    this.width = branchTotalWidth + 2 * BAR_OVERHANG;
    this.barWidth = this.width;
    const maxBranchH = Math.max(0, ...branches.map((b) => b.height));
    this.branchTopY = BAR_HEIGHT + NODE_MARGIN_Y;
    this.height = BAR_HEIGHT + NODE_MARGIN_Y + maxBranchH + NODE_MARGIN_Y + BAR_HEIGHT;

    const offsets: number[] = [];
    let x = BAR_OVERHANG;
    for (const b of branches) {
      offsets.push(x);
      x += b.width + NODE_MARGIN_X;
    }
    this.branchOffsets = offsets;
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
