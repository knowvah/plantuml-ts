import type { StringBounder, Tile } from './tile.js';
import { GtileFork } from './gtile-fork.js';
import { THIN_SPLIT_HEIGHT } from '../activity-layout-constants.js';

export class GtileSplit extends GtileFork {
  override readonly kind = 'gtile-split';

  /**
   * Same branch geometry as `GtileFork`, but the top/bottom band is the
   * thin split LINE's height, not the fork's black BAR height.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileThinSplit.java:61
   */
  constructor(branches: Tile[], bounder: StringBounder) {
    super(branches, bounder, THIN_SPLIT_HEIGHT);
  }

  /**
   * `true` iff any branch has an out point -- unlike `GtileFork` (which is
   * unconditionally `true`), a split becomes `FtileKilled` (no out point)
   * when every branch is detached.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderSplit.java:127-133
   *   -- `hasOut()`: true iff any branch tile's `hasPointOut()` is true.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderSplit.java:150-151
   *   -- `doStep2`: `if (hasOut() == false) return new FtileKilled(result);`.
   */
  override hasPointOut(): boolean {
    return this.children.some((c) => c.hasPointOut());
  }

  /**
   * `0` when every branch ends (`FtileKilled` wraps the result with NO
   * bottom `FtileThinSplit` at all, not merely a zero-height one) --
   * `GtileFork`'s own unconditional `this.barHeight` band is only correct
   * when a bottom `FtileThinSplit`/`FtileBlackBlock` actually gets built
   * (S family, `sopape-11-laxo488`: our height included this 1.5 band
   * even for an all-detach split, running the lane dividers 1.5 too long).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderSplit.java:139-140
   *   -- `doStep2`: `if (hasOut() == false) return new FtileKilled(result);`
   *   -- `result` here is `doStep1`'s output (top line + branches), never
   *   assembled with a second `FtileThinSplit`.
   */
  protected override bottomBandHeight(): number {
    return this.hasPointOut() ? this.barHeight : 0;
  }
}
