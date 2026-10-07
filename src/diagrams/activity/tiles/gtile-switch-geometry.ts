import type { Tile } from './tile.js';
import { NORTH_HOOK } from './points.js';

/**
 * The `FtileGeometry` subset the switch's own math reads off each case
 * (`getWidth`/`getHeight`/`getLeft`). Each case is the DECORATED tile
 * `FtileFactoryDelegatorSwitch#createWithLinks` builds
 * (`FtileDecorateOutLabel(FtileDecorateInLabel(branch.getFtile(), ...))`,
 * `FtileFactoryDelegatorSwitch.java:109-113`), not the bare branch body --
 * see `gtile-switch.ts#decorateCase`.
 */
export interface CaseDim {
  readonly width: number;
  readonly height: number;
  readonly left: number;
}

/** A bare tile's own {@link CaseDim} (no label decoration). */
export function caseDimOf(tile: Tile): CaseDim {
  return { width: tile.width, height: tile.height, left: leftOf(tile) };
}

/**
 * Pure layout math for {@link GtileSwitch}, split out of `gtile-switch.ts`
 * purely to keep that file's constructor under the complexity hook's NLOC
 * cap -- every formula here is a direct port of `FtileSwitchWithDiamonds`'s
 * constructor and private helpers plus `FtileSwitchNude`'s own geometry,
 * both `vcompact/cond/`. No behaviour of its own beyond the arithmetic.
 */

/** `FtileSwitchNude.xSeparation` (`FtileSwitchNude.java:54`) -- the gap
 *  between adjacent SMALL_DIAMOND-mode cases. Distinct from the generic
 *  `NODE_MARGIN_X` (40) other tiles use; upstream's switch has its own. */
export const SWITCH_X_SEPARATION = 20;
/** `FtileSwitchWithDiamonds.SUPP15` (`:53`) -- the fixed margin either
 *  side of the diamond's own span in BIG_DIAMOND-mode width. */
export const SWITCH_SUPP15 = 15;
/** `FtileSwitchWithDiamonds#getYdelta1b` (`:104-106`) -- fixed, never
 *  overridden by either `WithManyLinks` or `WithOneLink`. */
export const SWITCH_YDELTA1B = 10;
/** `FtileSwitchNude#calculateDimensionInternalSlow`'s own `result.delta(
 *  xSeparation * (n - 1), 100)` (`:132`) -- the fixed `100` padding added
 *  to the tallest case's height, regardless of mode. Reserves routing
 *  room for the case-to-merge connectors below the case row. */
const SWITCH_NUDE_HEIGHT_PAD = 100;

/** `FtileGeometry#getLeft()` (`FtileGeometry.java:162-164`): a tile's own
 *  `NORTH_HOOK` x-offset, its `inY`-point pivot. @see leftOf's callers. */
export function leftOf(tile: Tile): number {
  return tile.getCoord(NORTH_HOOK).x;
}

/** `FtileGeometry#getRight()` (`:166-168`): `width - left`. */
export function rightOf(tile: CaseDim): number {
  return tile.width - tile.left;
}

export interface SwitchMode {
  readonly isBigDiamond: boolean;
  readonly w13: number;
  readonly w9: number;
}

/**
 * `Mode.BIG_DIAMOND` vs `Mode.SMALL_DIAMOND`
 * (`FtileSwitchWithDiamonds`'s constructor, `:66-82`): `w13` is
 * `diamond1`'s width minus the first case's `getRight()` minus the last
 * case's `getLeft()`; `w9` sums every case STRICTLY between the first
 * and last (`:84-90` -- unreachable for <= 2 cases, so `w9` is 0 there
 * and `mode` reduces to `w13 > 0`).
 */
export function computeSwitchMode(diamond1Width: number, caseTiles: readonly CaseDim[]): SwitchMode {
  if (caseTiles.length === 0) return { isBigDiamond: false, w13: 0, w9: 0 };
  const first = caseTiles[0]!;
  const last = caseTiles[caseTiles.length - 1]!;
  const w13 = diamond1Width - rightOf(first) - last.left;
  let w9 = 0;
  for (let i = 1; i < caseTiles.length - 1; i++) w9 += caseTiles[i]!.width;
  return { isBigDiamond: w13 > w9, w13, w9 };
}

export interface NudeDimensions {
  readonly width: number;
  readonly height: number;
}

/**
 * `FtileSwitchNude#calculateDimensionInternalSlow` (`:127-135`): every
 * case `mergeLR`'d (sum width, max height), then `delta(xSeparation *
 * (n-1), 100)`.
 */
export function computeNudeDimensions(caseTiles: readonly CaseDim[]): NudeDimensions {
  let width = 0;
  let height = 0;
  for (const tile of caseTiles) {
    width += tile.width;
    if (tile.height > height) height = tile.height;
  }
  const n = caseTiles.length;
  return { width: width + SWITCH_X_SEPARATION * Math.max(0, n - 1), height: height + SWITCH_NUDE_HEIGHT_PAD };
}

export interface Ydelta1aParams {
  readonly isBigDiamond: boolean;
  readonly diamond1Height: number;
  readonly maxPositiveLabelHeight: number;
  readonly isSingleCase: boolean;
}

/**
 * `FtileSwitchWithDiamonds#getYdelta1a` (`:100-102`, flat `20`, used
 * as-is by `FtileSwitchWithOneLink` which never overrides it) vs
 * `FtileSwitchWithManyLinks#getYdelta1a` (`:413-423`): `max(10, tallest
 * branch positive label)`, `+= diamond1.height / 2` under BIG_DIAMOND,
 * `+ 10`.
 */
export function computeYdelta1a(params: Ydelta1aParams): number {
  if (params.isSingleCase) return 20;
  let max = Math.max(10, params.maxPositiveLabelHeight);
  if (params.isBigDiamond) max += params.diamond1Height / 2;
  return max + 10;
}

export interface CaseXOffsets {
  readonly xOffsets: number[];
  readonly totalWidth: number;
  readonly pivotLeft: number;
}

/**
 * BIG_DIAMOND-mode per-case X offsets, `FtileSwitchWithDiamonds
 * #getTranslateOf`'s BIG_DIAMOND branch (`:149-163`) plus the width/left
 * from `calculateDimensionInternalSlow`'s own BIG_DIAMOND branch
 * (`:115-121`): the extra span `w13 - w9` is distributed evenly as
 * `suppx` between every consecutive pair of the first `n-1` cases; the
 * LAST case sits flush against the trailing `SUPP15` margin.
 */
export function computeBigDiamondCaseX(
  caseTiles: readonly CaseDim[],
  mode: SwitchMode,
  diamond1Width: number,
): CaseXOffsets {
  const n = caseTiles.length;
  const tile0Width = caseTiles[0]!.width;
  const suppx = n > 1 ? (mode.w13 - mode.w9) / (n - 1) : 0;
  const xOffsets: number[] = new Array<number>(n).fill(0);
  let dx = 0;
  for (let i = 0; i < n - 1; i++) {
    xOffsets[i] = dx;
    dx += caseTiles[i]!.width + suppx;
  }
  if (n > 0) xOffsets[n - 1] = tile0Width + mode.w13 + SWITCH_SUPP15 + SWITCH_SUPP15;
  const totalWidth = tile0Width + SWITCH_SUPP15 + mode.w13 + SWITCH_SUPP15 + (caseTiles[n - 1]?.width ?? 0);
  // `getTranslateDiamond1`'s own `x1 = dimTotal.left - dim1.left` inverted
  // (`FtileSwitchWithDiamonds.java:174-180`): `dimTotal.left` (this
  // `pivotLeft`) is `tile0.getLeft() + SUPP15 + dim1.left`.
  const pivotLeft = caseTiles[0]!.left + SWITCH_SUPP15 + diamond1Width / 2;
  return { xOffsets, totalWidth, pivotLeft };
}

/**
 * SMALL_DIAMOND-mode per-case X offsets, `FtileSwitchNude
 * #getTranslateNude` (`:97-107`): plain left-to-right flow, `xSeparation`
 * apart. Width/pivot come from the caller (`computeSmallDiamondExtent`),
 * which also folds in `diamond1`/`diamond2`'s own widths.
 */
export function computeSmallDiamondCaseX(caseTiles: readonly CaseDim[]): number[] {
  const xOffsets: number[] = [];
  let x = 0;
  for (const tile of caseTiles) {
    xOffsets.push(x);
    x += tile.width + SWITCH_X_SEPARATION;
  }
  return xOffsets;
}
