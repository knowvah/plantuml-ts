import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { GtileDiamondInside } from './gtile-diamond-inside.js';
import type { Theme } from '../../../core/theme.js';
import { HEXAGON_HALF_SIZE } from '../layout/hexagon-reservations.js';

/**
 * `bounder`/`theme` are bundled into one trailing object solely to keep
 * the constructor's own parameter count at the hook's 5-parameter limit
 * once {@link specialOut} joined {@link backward} as a real parameter
 * (mission `add2-T3b`, family WSPEC) -- neither field is read (kept from
 * before this bundling, when they were named `_bounder`/`_theme`).
 * `tile-layout.ts#tileWhile` is this class's only call site.
 */
export interface GtileWhileContext {
  readonly bounder: StringBounder;
  readonly theme: Theme;
  readonly backward?: Tile | undefined;
  /**
   * `FtileWhile`'s own `specialOut` field (`FtileWhile.java:84,120,143-
   * 144,163-166`): a bare `stop`/`end` immediately after this while's
   * `endwhile`, when the body has no `break` (`ActivityDiagram3
   * #manageSpecialStopEndAfterEndWhile`, `:177-192`). `node-dispatch.ts
   * #parseNodes` is the seam that redirects that AST node into `Activity
   * While.specialOut` instead of an ordinary sibling; `tile-layout.ts
   * #tileWhile` builds its tile the same way `tileBackwardActivity`
   * builds `backward`'s (both are plain leaves, `tileSimpleLeaf`).
   */
  readonly specialOut?: Tile | undefined;
}

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
   * `dx = 2 * Hexagon.hexagonHalfSize` (`:586`), plus {@link
   * xDeltaBecauseSpecial} (`:592-593`, D-new).
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
   * `FtileWhile`'s own `backward` field (`FtileWhile.java:85,110-121`): the
   * `backward:LABEL;` activity drawn on the loop's own return edge, when
   * the while body has one (`InstructionWhile.java:83,121-122` --
   * `factory.activity(...)`, the same call every ordinary action tile
   * uses). `tile-layout.ts#tileWhile` is the seam that extracts the
   * `backward` AST node from `node.body` and builds this tile. Excluded
   * from {@link children}, mirroring `FtileWhile.getMyChildren()`
   * (`:88-94`) itself never listing it even though `drawU` draws it
   * (`:561-562`).
   */
  readonly backward: Tile | undefined;
  /** `getTranslateBackward`'s `x`/`y` (`FtileWhile.java:566-573`): `x =
   *  dimTotal.width - backward.width`, `y = (dimTotal.height -
   *  backward.height) / 2` -- flush to the tile's own right edge,
   *  vertically centred. `0` when {@link backward} is unset. */
  readonly backwardOffsetX: number;
  readonly backwardOffsetY: number;
  /** {@link GtileWhileContext.specialOut}, carried onto the instance. */
  readonly specialOut: Tile | undefined;
  /** `getTranslateForSpecial`'s `x`/`y` (`FtileWhile.java:644-656`), `0`
   *  when {@link specialOut} is unset. */
  readonly specialOffsetX: number;
  readonly specialOffsetY: number;

  /**
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:575-596
   *   -- `calculateDimensionFtile`: `geo = geoDiamond1.appendBottom(geoWhile)`;
   *   `height = geo.getHeight() + 4 * hexagonHalfSize + suppHeightForLabel`
   *   (`:585`); the returned `FtileGeometry`'s `width = geo.getWidth() + dx +
   *   hexagonHalfSize` and `left = geo.getLeft() + dx`, `dx = 2 *
   *   hexagonHalfSize` (`:586,591-593`) -- with `backward`'s own `+=
   *   backward.w` term (`:587-589`) and {@link xDeltaBecauseSpecial}'s own
   *   term (`:592-593`, D-new, WSPEC) both ported below.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometryMerger.java:42-56
   *   -- `appendBottom`: `left = max(left1, left2)`, `width = max(w1 +
   *   (left - left1), w2 + (left - left2))`, `height = h1 + h2`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:621-641
   *   -- `getTranslateForWhile`: `y = d1.h + (total.h - d1.h - body.h -
   *   suppHeightForLabel) / 2`, `x = total.left - body.left`;
   *   `getTranslateDiamond1`: `y = 0`, `x = total.left - d1.left` -- each
   *   child is shifted so its OWN `left` lands under the merged `left`,
   *   never centred on the composite's width. BOTH shift right by the SAME
   *   {@link xDeltaBecauseSpecial} term once `left` carries it, which is
   *   exactly what {@link getTranslateForSpecial}'s own `- xDeltaBecause
   *   Special` term below cancels back out.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometry.java:48-82,190-192
   *   -- a tile's `left` IS its in/out x, i.e. `getCoord(NORTH_HOOK).x` here;
   *   `appendBottom`'s `inY` is `geo1.getInY()`, and `FtileDiamondInside`'s
   *   own `calculateDimensionAlone` (`vertical/FtileDiamondInside.java:106-
   *   116`) always returns `inY = 0`, so the tile's `NORTH_HOOK.y` is 0.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:644-656
   *   -- `getTranslateForSpecial`: `half = (d1.outY - d1.inY) / 2`; `y1 =
   *   max(3*half, 4*hexagonHalfSize)`; `xWhile = translateForWhile.dx -
   *   hexagonHalfSize`; `xDiamond = translateDiamond1.dx`; `x1 =
   *   min(xWhile, xDiamond) - xDeltaBecauseSpecial`.
   */
  constructor(header: GtileDiamondInside, body: Tile, ctx: GtileWhileContext) {
    super();
    this.backward = ctx.backward;
    this.specialOut = ctx.specialOut;
    const headerLeft = header.getCoord(NORTH_HOOK).x;
    const bodyLeft = body.getCoord(NORTH_HOOK).x;
    const geoLeft = Math.max(headerLeft, bodyLeft);
    const headerDx = geoLeft - headerLeft;
    const bodyDx = geoLeft - bodyLeft;
    const geoWidth = Math.max(headerDx + header.width, bodyDx + body.width);
    const geoHeight = header.height + body.height;
    const xDeltaBecauseSpecial = ctx.specialOut?.width ?? 0;

    this.left = geoLeft + 2 * HEXAGON_HALF_SIZE + xDeltaBecauseSpecial;
    this.width =
      geoWidth + 2 * HEXAGON_HALF_SIZE + HEXAGON_HALF_SIZE + (ctx.backward?.width ?? 0) + xDeltaBecauseSpecial;
    this.height = geoHeight + 4 * HEXAGON_HALF_SIZE + this.labelHeight;

    this.headerOffsetX = this.left - headerLeft;
    this.bodyOffsetX = this.left - bodyLeft;
    this.bodyOffsetY = header.height + (this.height - header.height - body.height - this.labelHeight) / 2;

    this.backwardOffsetX = ctx.backward !== undefined ? this.width - ctx.backward.width : 0;
    this.backwardOffsetY = ctx.backward !== undefined ? (this.height - ctx.backward.height) / 2 : 0;

    const half = header.getCoord(SOUTH_HOOK).y / 2;
    this.specialOffsetY = ctx.specialOut !== undefined ? Math.max(3 * half, 4 * HEXAGON_HALF_SIZE) : 0;
    const xWhile = this.bodyOffsetX - HEXAGON_HALF_SIZE;
    const xDiamond = this.headerOffsetX;
    this.specialOffsetX = ctx.specialOut !== undefined ? Math.min(xWhile, xDiamond) - xDeltaBecauseSpecial : 0;

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
   * `true` unless {@link specialOut} is set, in which case the jar wraps
   * the whole while in `FtileKilled` (`InstructionWhile.java:128-129`),
   * whose `calculateDimensionFtile` uses the TWO-argument `FtileGeometry`
   * constructor -- no `outY` at all, `hasPointOut() === false`
   * (`FtileGeometry.java:88-90,141-143`). Independent of the body's own
   * out point either way, same as before this field existed.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:576-591
   *   -- `calculateDimensionFtile` unconditionally builds the five-argument
   *   `FtileGeometry` with `outY = height` when `specialOut == null`.
   */
  hasPointOut(): boolean {
    return this.specialOut === undefined;
  }
}
