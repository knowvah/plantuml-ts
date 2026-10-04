import type { StringBounder, Tile } from './tile.js';
import { GtileFork } from './gtile-fork.js';
import { HEXAGON_HALF_SIZE } from '../layout/hexagon-reservations.js';

/** `Hexagon.hexagonHalfSize * 2` -- the merge join's fixed, label-less
 *  diamond (D12/T1p-c), the SAME constant `tiles/gtile-repeat-entry.ts`
 *  already reuses for the repeat-entry rhombus.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46
 */
export const MERGE_DIAMOND_SIZE = HEXAGON_HALF_SIZE * 2;

/**
 * `fork ... end merge` (`ForkStyle.MERGE`, D12/T1p-c) -- the branches
 * converge into an un-synchronized, label-less diamond instead of the
 * default fork/split join bar/line. Extends `GtileFork` rather than
 * duplicating its branch layout: `ParallelBuilderMerge.doStep1` is
 * byte-for-byte `ParallelBuilderFork.doStep1` (same `FtileBlackBlock` top
 * bar, same per-branch `ConnectionIn`) -- only `doStep2`'s JOIN shape
 * differs (`bottomBandHeight`'s override, `gtile-fork.ts`'s own doc).
 *
 * `kind` is DELIBERATELY left at the inherited `'gtile-fork'` (not
 * `'gtile-merge'`): `layout/tile-coordinates.ts`'s `walkTile` switch
 * dispatches on this string, and that file is out of this task's
 * write-set this wave (owned by `T1p-e`, `batch-1p/common.md`) -- keeping
 * the existing `'gtile-fork'`/`'gtile-split'` arm routes every merge tile
 * through `walkForkOrSplit` unchanged, which then dispatches to
 * `walkMerge` via an `instanceof GtileMerge` check
 * (`layout/walk-fork-branches.ts`), never touching that switch. This is a
 * dispatch-routing device only -- the final `ActivityNodeGeo.kind` values
 * a merge actually emits (`'fork-bar'`, `'if-merge'`) are unaffected and
 * carry their own, separate kind strings.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderMerge.java:71-119
 *   -- `doStep1`/`doStep2`.
 */
export class GtileMerge extends GtileFork {
  constructor(branches: Tile[], bounder: StringBounder) {
    super(branches, bounder);
  }

  protected override bottomBandHeight(): number {
    return MERGE_DIAMOND_SIZE;
  }
}
