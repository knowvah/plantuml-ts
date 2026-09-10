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
}
