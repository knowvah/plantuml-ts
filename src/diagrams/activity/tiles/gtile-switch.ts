import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { GtileDiamond } from './gtile-diamond.js';
import type { Theme } from '../../../core/theme.js';
import { NODE_MARGIN_X, NODE_MARGIN_Y } from '../activity-layout-constants.js';

/** Left-to-right x offsets for each case tile, `NODE_MARGIN_X` apart, plus
 *  their combined width (no trailing margin). Extracted from the
 *  constructor purely to keep it under the complexity hook's NLOC cap once
 *  {@link GtileSwitch.caseLabels} (mission ubrr-T10 M2) was added. */
function layoutCaseOffsets(caseTiles: readonly Tile[]): { xOffsets: number[]; totalWidth: number } {
  const xOffsets: number[] = [];
  let x = 0;
  for (const c of caseTiles) {
    xOffsets.push(x);
    x += c.width + NODE_MARGIN_X;
  }
  const totalWidth = x - (caseTiles.length > 0 ? NODE_MARGIN_X : 0);
  return { xOffsets, totalWidth };
}

/** A tile's `FtileGeometry#getLeft()`/`getRight()` (`FtileGeometry.java:
 *  162-168`): `getLeft()` is the tile's own `NORTH_HOOK` x-offset (its
 *  `left`/`inY` pivot); `getRight()` is `width - left`. Every production
 *  leaf tile's `NORTH_HOOK` sits at its horizontal center, matching the
 *  Java's own symmetric leaves. */
function leftOf(tile: Tile): number {
  return tile.getCoord(NORTH_HOOK).x;
}

/**
 * `Mode.BIG_DIAMOND` vs `Mode.SMALL_DIAMOND` (`FtileSwitchWithDiamonds`'s
 * constructor, `vcompact/cond/FtileSwitchWithDiamonds.java:73-90`): `w13`
 * is `diamond1`'s width minus the first case's `getRight()` minus the
 * last case's `getLeft()`; `w9` sums the width of every case STRICTLY
 * between the first and last (`:84-90` -- that loop's body is
 * unreachable for <= 2 cases, so `w9` is 0 there and `mode` reduces to
 * `w13 > 0`). `mode == BIG_DIAMOND` is what makes `drawU`'s per-case loop
 * (`:136-138`) call `tile.drawU(...)` directly instead of the gated
 * `ug.draw(tile)` `FtileSwitchNude#drawU` uses -- see `walk-switch.ts`'s
 * own doc for why that only has a visible effect for a `TileLeaf` case.
 */
function computeIsBigDiamond(diamond: Tile, caseTiles: readonly Tile[]): boolean {
  if (caseTiles.length === 0) return false;
  const first = caseTiles[0]!;
  const last = caseTiles[caseTiles.length - 1]!;
  const w13 = diamond.width - (first.width - leftOf(first)) - leftOf(last);
  let w9 = 0;
  for (let i = 1; i < caseTiles.length - 1; i++) w9 += caseTiles[i]!.width;
  return w13 > w9;
}

export class GtileSwitch extends TileComposite {
  readonly kind = 'gtile-switch' as const;
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];
  readonly caseOffsets: readonly number[];
  readonly diamondOffsetY = 0;
  readonly caseOffsetY: number;
  readonly mergeOffsetY: number | null;
  /** `case (LABEL)`'s own label, one per case, aligned with
   *  {@link caseOffsets} -- consulted by `layout/tile-coordinates.ts`'s
   *  `'gtile-switch'` walker to label the diamond-to-case edge (mission
   *  ubrr-T10 M2; the jar draws this as edge text, e.g. doveka-76-
   *  fiza931's golden `<text ...>condition A</text>` beside the vertical
   *  connector). */
  readonly caseLabels: readonly (string | undefined)[];
  /** `Mode.BIG_DIAMOND` (vs. `SMALL_DIAMOND`), computed once in the
   *  constructor exactly as upstream does -- see {@link computeIsBigDiamond}
   *  for the citation. Consulted by `layout/walk-switch.ts` to decide
   *  whether a leaf case tile's content redraws once per swimlane. */
  readonly isBigDiamond: boolean;

  constructor(
    diamond: GtileDiamond,
    cases: Array<{ tile: Tile; label?: string }>,
    mergeDiamond: GtileDiamond | null,
    _bounder: StringBounder,
    _theme: Theme,
  ) {
    super();
    const caseTiles = cases.map((c) => c.tile);
    this.caseLabels = cases.map((c) => c.label);
    this.isBigDiamond = computeIsBigDiamond(diamond, caseTiles);
    const { xOffsets, totalWidth: caseTotalWidth } = layoutCaseOffsets(caseTiles);
    this.caseOffsets = xOffsets;
    this.width = Math.max(diamond.width, caseTotalWidth);
    const maxCaseH = Math.max(0, ...caseTiles.map((c) => c.height));
    this.caseOffsetY = diamond.height + NODE_MARGIN_Y;
    const baseH = this.caseOffsetY + maxCaseH;
    if (mergeDiamond !== null) {
      this.mergeOffsetY = baseH + NODE_MARGIN_Y;
      this.height = this.mergeOffsetY + mergeDiamond.height;
    } else {
      this.mergeOffsetY = null;
      this.height = baseH;
    }
    this.children = mergeDiamond !== null ? [diamond, ...caseTiles, mergeDiamond] : [diamond, ...caseTiles];
  }

  getCoord(hook: HookName): GPoint {
    const cx = this.width / 2;
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
   * `true` iff any case has an out point.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileSwitch.java:177-187
   *   -- `calculateDimensionFtile` iterates every case tile and returns
   *   WITH an out point as soon as one `hasPointOut()`; otherwise without.
   */
  hasPointOut(): boolean {
    const cases = this.children.slice(1, 1 + this.caseOffsets.length);
    return cases.some((c) => c.hasPointOut());
  }
}
