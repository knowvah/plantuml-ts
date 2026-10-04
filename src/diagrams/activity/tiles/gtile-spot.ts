import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import { TileLeaf } from './tile.js';
import type { ActivitySpot } from '../ast.js';

/**
 * `(X)` / `#color:(X)` -- a single-character "circled spot" connector.
 * `SIZE` is a FIXED 20x20 circle, independent of the character's own
 * measured width: the regex that builds {@link ActivitySpot} captures
 * exactly one non-space character, and the Java constructor never calls
 * its `StringBounder` for sizing at all -- only `calculateDimensionFtile`
 * returns the five-argument `FtileGeometry(SIZE, SIZE, SIZE/2, 0, SIZE)`
 * unconditionally. A prior half-port here widened the circle by the
 * measured label width (`CONNECTOR_SPOT_RADIUS = 8`, an unsourced guess,
 * `activity-layout-constants.ts:51`) -- that constant is now orphaned
 * (flagged in this task's final report, not deleted: that file is outside
 * this task's write-set).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileCircleSpot.java:60,116-117
 */
const SIZE = 20;

export class GtileSpot extends TileLeaf {
  readonly kind = 'gtile-spot' as const;
  readonly name: string;
  readonly color: string | undefined;
  readonly width: number = SIZE;
  readonly height: number = SIZE;

  constructor(node: ActivitySpot) {
    super();
    this.name = node.name;
    this.color = node.color;
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
   * Has an out point.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileCircleSpot.java:117
   *   -- `calculateDimensionFtile` uses the five-argument `FtileGeometry`
   *   constructor with `outY = SIZE`.
   */
  hasPointOut(): boolean {
    return true;
  }
}
