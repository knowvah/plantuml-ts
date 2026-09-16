import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { GtileDiamond } from './gtile-diamond.js';
import type { Theme } from '../../../core/theme.js';
import { NODE_MARGIN_Y, BACK_EDGE_MARGIN } from '../activity-layout-constants.js';

export class GtileWhile extends TileComposite {
  readonly kind = 'gtile-while' as const;
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];
  readonly headerOffsetY = 0;
  readonly bodyOffsetY: number;
  /** The merged `left` of header and body -- the x of both hooks. */
  readonly contentLeft: number;
  /** `contentLeft - header.left`: the header's x inside the tile. */
  readonly headerOffsetX: number;
  /** `contentLeft - body.left`: the body's x inside the tile. */
  readonly bodyOffsetX: number;
  readonly backEdgeRightX: number;

  /**
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:576-593
   *   -- `calculateDimensionFtile`: `geo = geoDiamond1.appendBottom(geoWhile)`;
   *   the tile's `left` is `geo.getLeft() + dx` and its width `geo.getWidth()
   *   + dx + hexagonHalfSize + backwardWidth` -- the jar's gutters (`dx = 2 *
   *   hexagonHalfSize`) are NOT ported here: `BACK_EDGE_MARGIN` stays (D2,
   *   `plans/activity-while-repeat-left-alignment/decisions.md`).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometryMerger.java:44-56
   *   -- `appendBottom`: `left = max(left1, left2)`,
   *   `width = max(w1 + (left - left1), w2 + (left - left2))`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:621-641
   *   -- `getTranslateForWhile`: `x = dimTotal.getLeft() - dimWhile.getLeft()`;
   *   `getTranslateDiamond1`: `x1 = dimTotal.getLeft() - dimDiamond1.getLeft()`
   *   -- each child is shifted so its OWN `left` lands under the merged
   *   `left`, never centred on the composite's width.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometry.java:48-82,190-192
   *   -- a tile's `left` IS its in/out x, i.e. `getCoord(NORTH_HOOK).x` here.
   */
  constructor(
    header: GtileDiamond,
    body: Tile,
    _exitLabel: string | undefined,
    _backLabel: string | undefined,
    _bounder: StringBounder,
    _theme: Theme,
  ) {
    super();
    this.bodyOffsetY = header.height + NODE_MARGIN_Y;
    const headerLeft = header.getCoord(NORTH_HOOK).x;
    const bodyLeft = body.getCoord(NORTH_HOOK).x;
    this.contentLeft = Math.max(headerLeft, bodyLeft);
    this.headerOffsetX = this.contentLeft - headerLeft;
    this.bodyOffsetX = this.contentLeft - bodyLeft;
    const contentWidth = Math.max(this.headerOffsetX + header.width, this.bodyOffsetX + body.width);
    this.width = contentWidth + BACK_EDGE_MARGIN;
    this.height = this.bodyOffsetY + body.height + NODE_MARGIN_Y;
    this.backEdgeRightX = this.width;
    this.children = [header, body];
  }

  getCoord(hook: HookName): GPoint {
    // The merged `left` (FtileWhile.java:593 -- `geo.getLeft() + dx`, minus
    // the unported gutter); equals `(width - BACK_EDGE_MARGIN) / 2` exactly
    // when both children are symmetric (`left == width / 2`).
    const cx = this.contentLeft;
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
   * Unconditionally `true`: the exit is the header diamond's own "false"
   * path, independent of whether the loop body itself has an out point.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:576-591
   *   -- `calculateDimensionFtile` unconditionally builds the five-argument
   *   `FtileGeometry` with `outY = height`.
   */
  hasPointOut(): boolean {
    return true;
  }
}
