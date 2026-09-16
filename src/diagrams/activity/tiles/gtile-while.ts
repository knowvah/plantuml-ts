import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { GtileDiamondInside } from './gtile-diamond-inside.js';
import type { Theme } from '../../../core/theme.js';
import { HEXAGON_HALF_SIZE } from '../layout/hexagon-reservations.js';

export class GtileWhile extends TileComposite {
  readonly kind = 'gtile-while' as const;
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];
  readonly headerOffsetY = 0;
  readonly bodyOffsetY: number;
  /**
   * The merged `left` of header and body, shifted by the loop-back gutter --
   * the x of both hooks. `FtileWhile.java:593`: `geo.getLeft() + dx` where
   * `dx = 2 * Hexagon.hexagonHalfSize` (`:586`).
   */
  readonly left: number;
  /**
   * `back1`'s height, added to `height` (`FtileWhile.java:585,597-601`).
   * `back1` is the `-> text;` line immediately before `endwhile`
   * (`ActivityDiagram3.java:403-407`, `InstructionWhile.java:208-213`).
   * Our tile engine tiles every `arrow-label` node to `null`
   * (`tile-layout.ts`'s `'arrow-label'` case) and no baseline `while`
   * fixture has one before `endwhile`, so this is always 0 today -- the
   * capture itself is a separate, filed gap, not this task's write-set.
   */
  readonly labelHeight = 0;
  /** `left - header.left`: the header's x inside the tile. */
  readonly headerOffsetX: number;
  /** `left - body.left`: the body's x inside the tile. */
  readonly bodyOffsetX: number;
  /**
   * `= width` (`FtileWhile.java:591-593`: the tile's own right edge, since
   * the unported `backward` tile's width is always 0, D2
   * `plans/activity-while-repeat-left-alignment/decisions.md`). Retired by
   * T4 once the back-edge routing it feeds is replaced (D8).
   */
  readonly backEdgeRightX: number;

  /**
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:575-596
   *   -- `calculateDimensionFtile`: `geo = geoDiamond1.appendBottom(geoWhile)`;
   *   `height = geo.getHeight() + 4 * hexagonHalfSize + suppHeightForLabel`
   *   (`:585`); the returned `FtileGeometry`'s `width = geo.getWidth() + dx +
   *   hexagonHalfSize` and `left = geo.getLeft() + dx`, `dx = 2 *
   *   hexagonHalfSize` (`:586,591-593`) -- with `backward == null` (D2) and
   *   `specialOut == null` (D3 `plans/activity-loop-tile-port/decisions.md`),
   *   both of which are otherwise added into `width`/`left`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometryMerger.java:42-56
   *   -- `appendBottom`: `left = max(left1, left2)`, `width = max(w1 +
   *   (left - left1), w2 + (left - left2))`, `height = h1 + h2`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:621-641
   *   -- `getTranslateForWhile`: `y = d1.h + (total.h - d1.h - body.h -
   *   suppHeightForLabel) / 2`, `x = total.left - body.left`;
   *   `getTranslateDiamond1`: `y = 0`, `x = total.left - d1.left` -- each
   *   child is shifted so its OWN `left` lands under the merged `left`,
   *   never centred on the composite's width.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometry.java:48-82,190-192
   *   -- a tile's `left` IS its in/out x, i.e. `getCoord(NORTH_HOOK).x` here;
   *   `appendBottom`'s `inY` is `geo1.getInY()`, and `FtileDiamondInside`'s
   *   own `calculateDimensionAlone` (`vertical/FtileDiamondInside.java:106-
   *   116`) always returns `inY = 0`, so the tile's `NORTH_HOOK.y` is 0.
   */
  constructor(header: GtileDiamondInside, body: Tile, _bounder: StringBounder, _theme: Theme) {
    super();
    const headerLeft = header.getCoord(NORTH_HOOK).x;
    const bodyLeft = body.getCoord(NORTH_HOOK).x;
    const geoLeft = Math.max(headerLeft, bodyLeft);
    const headerDx = geoLeft - headerLeft;
    const bodyDx = geoLeft - bodyLeft;
    const geoWidth = Math.max(headerDx + header.width, bodyDx + body.width);
    const geoHeight = header.height + body.height;

    this.left = geoLeft + 2 * HEXAGON_HALF_SIZE;
    this.width = geoWidth + 2 * HEXAGON_HALF_SIZE + HEXAGON_HALF_SIZE;
    this.height = geoHeight + 4 * HEXAGON_HALF_SIZE + this.labelHeight;

    this.headerOffsetX = this.left - headerLeft;
    this.bodyOffsetX = this.left - bodyLeft;
    this.bodyOffsetY = header.height + (this.height - header.height - body.height - this.labelHeight) / 2;

    this.backEdgeRightX = this.width;
    this.children = [header, body];
  }

  getCoord(hook: HookName): GPoint {
    const cx = this.left;
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
