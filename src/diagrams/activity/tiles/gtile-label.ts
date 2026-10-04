import type { GPoint, HookName } from './points.js';
import { NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, EAST_HOOK, WEST_HOOK } from './points.js';
import { TileLeaf } from './tile.js';
import type { ActivityLabel } from '../ast.js';

/**
 * `label NAME` -- declares the target of a later `goto NAME` jump.
 * `FtileLabel` extends `FtileEmpty` with NO override of `drawU` (empty)
 * or `calculateDimensionFtile` (inherited `calculateDimensionEmpty()`):
 * zero width, zero height, a normal (`true`) out point. A prior half-port
 * here measured and drew a visible bordered box with the label's own
 * text -- verified WRONG against the jar's own SVG, which contains no
 * trace of the label text at all and is BYTE-IDENTICAL to the same
 * diagram with the `label NAME;` line deleted (`ast.ts`'s own doc,
 * `.agent-notes/T2g-spot-label-goto.md`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileLabel.java:40-49
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileEmpty.java:47,83,87-92
 */
export class GtileLabel extends TileLeaf {
  readonly kind = 'gtile-label' as const;
  readonly name: string;
  readonly width = 0;
  readonly height = 0;

  constructor(node: ActivityLabel) {
    super();
    this.name = node.name;
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: 0, y: 0 };
      case EAST_HOOK:
      case WEST_HOOK:
        return { x: 0, y: 0 };
      /* c8 ignore next 3 */
      default: {
        const _exhaustive: never = hook;
        throw new Error(`Unknown hook: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * `FtileEmpty#calculateDimensionEmpty` always has an out point (`outY =
   * height`, never the `Double.MIN_NORMAL` sentinel) -- the default this
   * class inherits from `TileLeaf` is already correct; stated explicitly
   * (not just relying on the default) because {@link GtileGoto} sits
   * right next to this file and overrides it to `false`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileEmpty.java:87-92
   */
  hasPointOut(): boolean {
    return true;
  }
}
