import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import { TileLeaf } from './tile.js';

export class GtileBreak extends TileLeaf {
  readonly kind = 'gtile-break' as const;
  /**
   * `FtileBreak`'s own constructor (`FtileBreak.java:44-46`) calls
   * `super(skinParam, swimlane)`, which resolves to `FtileEmpty`'s
   * two-argument constructor (`FtileEmpty.java:63-65`): `this(skinParam,
   * 0, 0, swimlane)` -- `width`/`height` are `0`, not an invented size.
   * The previous `20`/`20` here was unsourced (no upstream citation) and
   * inflated every tile containing a `break` by up to 20px before
   * compression could partially absorb it (diagnosed T1p-d: the jar's
   * `FtileIfDown` height for a then-only `if` ending in `break` is
   * `total.geo.height + 36 + max(12, southLabelHeight)`, and
   * `total.geo.height` sums `thenBlock.height`, which was wrongly
   * reading this `20` instead of the jar's real `0`).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileBreak.java:44-46
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileEmpty.java:55-65
   */
  readonly width = 0;
  readonly height = 0;

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
   * No out point.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileBreak.java:63
   *   -- `calculateDimensionFtile` returns
   *   `calculateDimensionEmpty().withoutPointOut()`.
   */
  hasPointOut(): boolean {
    return false;
  }
}
