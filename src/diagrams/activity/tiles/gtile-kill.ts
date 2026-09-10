import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import { TileLeaf } from './tile.js';

import { STOP_OUTER_RADIUS as OUTER_RADIUS } from '../activity-layout-constants.js';

export class GtileKill extends TileLeaf {
  readonly kind = 'gtile-kill' as const;
  readonly width = OUTER_RADIUS * 2;
  readonly height = OUTER_RADIUS * 2;

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
   * No out point. `kill` (`tile-layout.ts:71`) builds a `GtileKill`,
   * mirroring how upstream wraps a killed branch's tile.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileKilled.java:71-74
   *   -- `calculateDimensionFtile` rebuilds the geometry with the
   *   three-argument `FtileGeometry(XDimension2D, left, inY)` constructor,
   *   which carries no `outY` and so strips the out point.
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionSimple.java:123-126
   *   -- `kill()` sets the `killed` flag that later triggers the
   *   `FtileKilled` wrap (`:112-113`).
   */
  hasPointOut(): boolean {
    return false;
  }
}
