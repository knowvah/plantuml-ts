import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { GtileDiamondInside } from './gtile-diamond-inside.js';
import type { Theme } from '../../../core/theme.js';
import { NODE_MARGIN_Y, BACK_EDGE_MARGIN } from '../activity-layout-constants.js';

export class GtileRepeat extends TileComposite {
  readonly kind = 'gtile-repeat' as const;
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];
  readonly bodyOffsetY = 0;
  readonly conditionOffsetY: number;
  readonly backwardOffsetY: number | null;
  /** The jar's `getLeft()`: the merged `left` of the stacked children,
   * measured from the content's left edge (before `BACK_EDGE_MARGIN / 2`). */
  readonly left: number;
  /** `BACK_EDGE_MARGIN / 2 + left - body.left`: the body's x inside the tile. */
  readonly bodyOffsetX: number;
  /** `BACK_EDGE_MARGIN / 2 + left - condition.width / 2`. */
  readonly conditionOffsetX: number;
  /** `BACK_EDGE_MARGIN / 2 + left - backward.left`, or `null` without one. */
  readonly backwardOffsetX: number | null;
  readonly backEdgeLeftX = 0;

  /**
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:767-774
   *   -- `getLeft`: `max(repeat.left, dimDiamond1.w / 2, dimDiamond2.w / 2)`.
   *   Our tile has no entry diamond (`diamond1`), so that term is absent;
   *   `condition` is the jar's `diamond2`, whose `left` is `w / 2` (D3).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:777-786
   *   -- `getRight`: `max(repeat.w - repeat.left, dimDiamond1.w / 2,
   *   dimDiamond2.w / 2)`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:701-716
   *   -- `calculateDimensionInternal`: `width = getLeft() + getRight()`
   *   (then the test-label and `2 * hexagonHalfSize` gutters, unported --
   *   `BACK_EDGE_MARGIN` stays, D2). The jar adds `backward.w` on the RIGHT
   *   and places it at `width - backward.w` (`:750-757`); ours stacks the
   *   backward body in the column under the condition, so here it joins the
   *   left/right merge like any stacked child (`FtileGeometryMerger.java:44-47`)
   *   -- the jar's side placement is the deferred
   *   `activity-repeat-connector-draw-order` work, not this tile's.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:730-765
   *   -- body at `left - repeat.left` (`:740`), diamonds at `left - d.w / 2`
   *   (`:747`, `:764`): each child so its OWN `left` lands under `getLeft()`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:696-699
   *   -- `calculateDimensionFtile`: the tile's `left` IS `getLeft()`.
   */
  // prettier-ignore
  constructor(body: Tile, condition: GtileDiamondInside, backwardBody: Tile | null, _bounder: StringBounder, _theme: Theme) {
    super();
    this.conditionOffsetY = body.height + NODE_MARGIN_Y;
    const bodyLeft = body.getCoord(NORTH_HOOK).x;
    const conditionLeft = condition.width / 2;
    const backwardLeft = backwardBody === null ? 0 : backwardBody.getCoord(NORTH_HOOK).x;
    const backwardRight = backwardBody === null ? 0 : backwardBody.width - backwardLeft;
    this.left = Math.max(bodyLeft, conditionLeft, backwardLeft);
    const right = Math.max(body.width - bodyLeft, condition.width - conditionLeft, backwardRight);
    const contentWidth = this.left + right;
    this.width = contentWidth + BACK_EDGE_MARGIN;
    const contentX = BACK_EDGE_MARGIN / 2;
    this.bodyOffsetX = contentX + this.left - bodyLeft;
    this.conditionOffsetX = contentX + this.left - conditionLeft;
    this.backwardOffsetX = backwardBody === null ? null : contentX + this.left - backwardLeft;
    let h = this.conditionOffsetY + condition.height;
    if (backwardBody !== null) {
      this.backwardOffsetY = h + NODE_MARGIN_Y;
      h = this.backwardOffsetY + backwardBody.height;
    } else {
      this.backwardOffsetY = null;
    }
    this.height = h + NODE_MARGIN_Y;
    this.children = backwardBody !== null ? [body, condition, backwardBody] : [body, condition];
  }

  getCoord(hook: HookName): GPoint {
    // The merged `left` (FtileRepeat.java:696-699) behind the back-edge
    // lane; equals `width / 2` exactly when every child is symmetric.
    const cx = BACK_EDGE_MARGIN / 2 + this.left;
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: cx, y: 0 };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: cx, y: this.height };
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
   * Unconditionally `true`: the exit is the condition diamond's own
   * "false" path, independent of the body's own out point.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:696-698
   *   -- `calculateDimensionFtile` unconditionally returns
   *   `new FtileGeometry(dimTotal, getLeft(...), 0, dimTotal.getHeight())`.
   */
  hasPointOut(): boolean {
    return true;
  }
}
