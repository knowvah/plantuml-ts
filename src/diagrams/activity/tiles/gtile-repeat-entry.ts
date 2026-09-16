import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import { TileLeaf } from './tile.js';
import { HEXAGON_HALF_SIZE } from '../layout/hexagon-reservations.js';

/**
 * The repeat's default entry point when `repeat :label;` has no inline
 * label (`ActivityRepeat.entry === undefined`, D2) -- a label-less
 * `FtileDiamond`, drawn as the existing `repeat-start` node kind
 * (`renderDiamond`, `activity-renderer-shapes.ts:440-441`; its polygon is
 * `Hexagon.asPolygon(shadowing)`'s four-point rhombus, `Hexagon.java:48-63`,
 * the same shape `renderDiamond` already draws for `if-split`/`while-header`
 * without a label).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:135-136
 *   -- `diamond1 = new FtileDiamond(skinParam, diamondColor1, borderColor,
 *   swimlane)`: every label slot (`north`/`south`/`east`/`west`) stays the
 *   single-argument constructor's `TextBlockUtils.empty(0, 0)` default.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamond.java:108-112
 *   -- `calculateDimensionFtile`: with `suppY1 = north.height = 0`,
 *   `dim = (2*hexagonHalfSize, 2*hexagonHalfSize) = (24, 24)`,
 *   `left = dim.width / 2 = 12`, `inY = suppY1 = 0`, `outY = dim.height = 24`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46
 *   -- `hexagonHalfSize = 12`.
 */
export class GtileRepeatEntry extends TileLeaf {
  readonly kind = 'gtile-repeat-entry' as const;
  readonly width = HEXAGON_HALF_SIZE * 2;
  readonly height = HEXAGON_HALF_SIZE * 2;

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: HEXAGON_HALF_SIZE, y: 0 };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: HEXAGON_HALF_SIZE, y: this.height };
      case EAST_HOOK:
        return { x: this.width, y: HEXAGON_HALF_SIZE };
      case WEST_HOOK:
        return { x: 0, y: HEXAGON_HALF_SIZE };
      /* c8 ignore next 3 */
      default: {
        const _exhaustive: never = hook;
        throw new Error(`Unknown hook: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * Has an out point -- `calculateDimensionFtile` (class doc) always sets a
   * real `outY = 24`, never the `Double.MIN_NORMAL` no-out-point sentinel.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamond.java:108-112
   */
  hasPointOut(): boolean {
    return true;
  }
}
