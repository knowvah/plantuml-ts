import { GtileFork } from './gtile-fork.js';

export class GtileSplit extends GtileFork {
  override readonly kind = 'gtile-split';

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
