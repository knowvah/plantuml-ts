import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { Theme } from '../../../core/theme.js';
import { activityFontSize } from '../activity-style-defaults.js';
import {
  computeBigDiamondCaseX,
  computeNudeDimensions,
  computeSmallDiamondCaseX,
  computeSwitchMode,
  computeYdelta1a,
  SWITCH_YDELTA1B,
} from './gtile-switch-geometry.js';

/** `AtomText#calculateDimensionSlow`'s own per-line height floor (L).
 *  @see net/sourceforge/plantuml/klimt/creole/legacy/AtomText.java:179-181 */
const ATOM_TEXT_MIN_HEIGHT = 10;

/** `Branch#getTextBlockPositive`'s own height, per case label, folded
 *  per-line the same way `gtile-diamond-inside.ts#measureLabel` does --
 *  used only for {@link computeYdelta1a}'s `maxPositiveLabelHeight`. */
function measureLabelHeight(text: string | undefined, bounder: StringBounder, fontSize: number): number {
  if (text === undefined || text === '') return 0;
  let height = 0;
  for (const line of text.split('\n')) height += Math.max(bounder.getDimension(line, fontSize).height, ATOM_TEXT_MIN_HEIGHT);
  return height;
}

interface SwitchLayout {
  readonly width: number;
  readonly height: number;
  readonly isBigDiamond: boolean;
  readonly diamond1Offset: GPoint;
  readonly caseOffsets: GPoint[];
  readonly mergeOffset: GPoint | null;
  readonly pivotLeft: number;
}

/**
 * The full dimension/placement computation, split out of the constructor
 * purely to keep it under the complexity hook's NLOC cap. Mirrors
 * `FtileSwitchWithDiamonds`'s constructor + `calculateDimensionInternalSlow`
 * (`:66-129`) and `#getTranslateMain`/`#getTranslateDiamond1`/
 * `#getTranslateDiamond2`/`#getTranslateOf` (`:147-188`): the height
 * formula and both diamonds' Y offsets are MODE-INDEPENDENT (`dim1.height
 * + nudeHeight + dim2.height + Yd1a + Yd1b`, `y1 = 0` for diamond1 always,
 * `y2 = height - dim2.height` for diamond2 always) -- only the WIDTH and
 * the per-case X offsets differ between `BIG_DIAMOND`/`SMALL_DIAMOND`.
 */
function computeSwitchLayout(
  diamond1: Tile,
  caseTiles: readonly Tile[],
  mergeDiamond: Tile | null,
  caseLabels: readonly (string | undefined)[],
  bounder: StringBounder,
  theme: Theme,
): SwitchLayout {
  const mode = computeSwitchMode(diamond1.width, caseTiles);
  const nude = computeNudeDimensions(caseTiles);
  const arrowSize = activityFontSize(theme, 'arrow');
  let maxPositiveLabelHeight = 0;
  for (const label of caseLabels) {
    const h = measureLabelHeight(label, bounder, arrowSize);
    if (h > maxPositiveLabelHeight) maxPositiveLabelHeight = h;
  }
  const yDelta1a = computeYdelta1a({
    isBigDiamond: mode.isBigDiamond,
    diamond1Height: diamond1.height,
    maxPositiveLabelHeight,
    isSingleCase: caseTiles.length === 1,
  });

  const extent = mode.isBigDiamond
    ? computeBigDiamondCaseX(caseTiles, mode, diamond1.width)
    : { xOffsets: computeSmallDiamondCaseX(caseTiles), totalWidth: 0, pivotLeft: 0 };
  const width = mode.isBigDiamond
    ? extent.totalWidth
    : Math.max(diamond1.width, nude.width, mergeDiamond?.width ?? 0);
  const pivotLeft = mode.isBigDiamond ? extent.pivotLeft : width / 2;

  const caseOffsetY = diamond1.height + yDelta1a;
  const caseOffsets = extent.xOffsets.map((x) => ({ x, y: caseOffsetY }));

  const height =
    diamond1.height + nude.height + (mergeDiamond !== null ? mergeDiamond.height + SWITCH_YDELTA1B : 0) + yDelta1a;
  const mergeOffset =
    mergeDiamond !== null ? { x: pivotLeft - mergeDiamond.width / 2, y: height - mergeDiamond.height } : null;

  return {
    width,
    height,
    isBigDiamond: mode.isBigDiamond,
    diamond1Offset: { x: pivotLeft - diamond1.width / 2, y: 0 },
    caseOffsets,
    mergeOffset,
    pivotLeft,
  };
}

export class GtileSwitch extends TileComposite {
  readonly kind = 'gtile-switch' as const;
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];
  /** Per-case `{x, y}`, in this tile's own local frame -- `y` is the SAME
   *  for every case (both modes), `x` differs per {@link isBigDiamond}. */
  readonly caseOffsets: readonly GPoint[];
  readonly diamondOffset: GPoint;
  readonly mergeOffset: GPoint | null;
  /** `case (LABEL)`'s own label, one per case, aligned with
   *  {@link caseOffsets} -- the diamond-to-case edge's own text. */
  readonly caseLabels: readonly (string | undefined)[];
  /** `Mode.BIG_DIAMOND` (vs. `SMALL_DIAMOND`), computed once in the
   *  constructor exactly as upstream does.
   *  @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchWithDiamonds.java:73-90 */
  readonly isBigDiamond: boolean;
  readonly pivotLeft: number;

  constructor(
    diamond: Tile,
    cases: Array<{ tile: Tile; label?: string }>,
    mergeDiamond: Tile | null,
    bounder: StringBounder,
    theme: Theme,
  ) {
    super();
    const caseTiles = cases.map((c) => c.tile);
    this.caseLabels = cases.map((c) => c.label);
    const layout = computeSwitchLayout(diamond, caseTiles, mergeDiamond, this.caseLabels, bounder, theme);
    this.isBigDiamond = layout.isBigDiamond;
    this.width = layout.width;
    this.height = layout.height;
    this.caseOffsets = layout.caseOffsets;
    this.diamondOffset = layout.diamond1Offset;
    this.mergeOffset = layout.mergeOffset;
    this.pivotLeft = layout.pivotLeft;
    this.children = mergeDiamond !== null ? [diamond, ...caseTiles, mergeDiamond] : [diamond, ...caseTiles];
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.pivotLeft, y: 0 };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: this.pivotLeft, y: this.height };
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
   * `true` iff any CASE tile has an out point -- `FtileSwitchNude
   * #calculateDimensionFtile` (`:116-124`) iterates `tiles` (the cases,
   * never `diamond2`) and keeps the outY as soon as one `hasPointOut()`;
   * otherwise strips it.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchNude.java:116-124
   */
  hasPointOut(): boolean {
    const cases = this.children.slice(1, 1 + this.caseOffsets.length);
    return cases.some((c) => c.hasPointOut());
  }
}
