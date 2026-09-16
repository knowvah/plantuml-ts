import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { GtileDiamondInside } from './gtile-diamond-inside.js';

/** `ConditionalBuilder.java:138-139`: `FtileMinWidthCentered(branch, 30)`. */
const MIN_BRANCH_WIDTH = 30;
/** `ConditionalBuilder.java:219-220`: `addHorizontalMargin(_, 10)`. */
const BRANCH_MARGIN = 10;
/** `FtileIfWithDiamonds.java:72`: `SUPP_WIDTH`, `widthInner`'s own floor. */
const SUPP_WIDTH = 20;
/** `FtileDiamond.java:110`, `Hexagon.hexagonHalfSize * 2` -- the merge
 *  rhombus's fixed size (never a north label for `with-links`, D2). */
const MERGE_SIZE = 24;
/** `ConditionalBuilder.java:306`: `FtileEmpty(0, Hexagon.hexagonHalfSize / 2)`
 *  -- the invisible placeholder when `!hasTwoBranches()`. */
const MERGE_EMPTY_HEIGHT = 6;

export interface IfWithLinksBranch {
  readonly tile: Tile;
  /** `Branch#isEmpty()` -- zero source nodes, distinct from `!hasPointOut()`
   *  (a branch ending in `kill` is non-empty but has no point out). */
  readonly isEmpty: boolean;
}

interface PaddedWidth {
  /** The branch's own effective width after both wraps. */
  readonly outer: number;
  /** How far the branch's own (unwrapped) content is offset from the
   *  padded box's left edge -- both wraps preserve `left === width / 2`
   *  symmetry, so this reduces to one delta. */
  readonly contentDx: number;
}

/** `FtileMinWidthCentered(branch, 30)` folded with `addHorizontalMargin(_,
 *  10)` (`FtileMinWidthCentered.java:68-79,99-106`; `FtileMarged.java:93-97`). */
function paddedWidth(raw: number): PaddedWidth {
  const min = Math.max(raw, MIN_BRANCH_WIDTH);
  return { outer: min + 2 * BRANCH_MARGIN, contentDx: (min - raw) / 2 + BRANCH_MARGIN };
}

interface AlignedGeo {
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

/** `FtileGeometryMerger#appendBottom`: align on the larger `left`, sum
 *  heights, width is each side's own width padded to the shared `left`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometryMerger.java:42-54
 */
function appendBottomGeo(a: AlignedGeo, b: AlignedGeo): AlignedGeo {
  const left = Math.max(a.left, b.left);
  const width = Math.max(a.width + (left - a.left), b.width + (left - b.left));
  return { left, width, height: a.height + b.height };
}

/** `getShape2`'s `hasTwoBranches()` branch: a real 24x24 rhombus, or the
 *  invisible placeholder. @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/ConditionalBuilder.java:285-311 */
function mergeGeo(hasTwoBranches: boolean): AlignedGeo {
  if (hasTwoBranches) return { left: MERGE_SIZE / 2, width: MERGE_SIZE, height: MERGE_SIZE };
  return { left: 0, width: 0, height: MERGE_EMPTY_HEIGHT };
}

/** One branch's padded width plus its own (unwrapped) height -- bundled so
 *  {@link computeCoreGeometry} stays within the file's 5-parameter limit. */
export interface BranchGeo {
  readonly padded: PaddedWidth;
  readonly height: number;
}

interface NudeAndMerge {
  readonly geoTotal: AlignedGeo;
  readonly merge: AlignedGeo;
}

/** `d1.appendBottom(nude).appendBottom(d2)`, split out of
 *  {@link computeCoreGeometry} only to keep that function's own NLOC under
 *  the file's limit. @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithDiamonds.java:183-186 */
function computeNudeAndMerge(
  diamond1: GtileDiamondInside,
  b1: BranchGeo,
  b2: BranchGeo,
  hasTwoBranches: boolean,
): NudeAndMerge {
  const diamondLeft = diamond1.getCoord(SOUTH_HOOK).x;
  const diamondOutY = diamond1.getCoord(SOUTH_HOOK).y;
  const diamondWidth = diamond1.width;

  // `FtileIfWithDiamonds#widthInner`: max(super.widthInner, diamond1.w + 20).
  const innerMargin = Math.max(b1.padded.outer / 2 + b2.padded.outer / 2, diamondWidth + SUPP_WIDTH);
  const nude: AlignedGeo = {
    left: b1.padded.outer / 2 + innerMargin / 2,
    width: b1.padded.outer / 2 + innerMargin + b2.padded.outer / 2,
    height: Math.max(b1.height, b2.height),
  };
  const geoA = appendBottomGeo({ left: diamondLeft, width: diamondWidth, height: diamondOutY }, nude);
  const merge = mergeGeo(hasTwoBranches);
  return { geoTotal: appendBottomGeo(geoA, merge), merge };
}

interface CoreGeometry {
  readonly totalLeft: number;
  readonly totalWidth: number;
  /** Post-`addDim(0, ydelta1a + ydelta1b)`, pre-`suppHeight`. */
  readonly totalHeight: number;
  readonly diamond1X0: number;
  readonly branchY0: number;
  readonly tile2X0: number;
  readonly hasTwoBranches: boolean;
  readonly merge: AlignedGeo;
}

/**
 * `d1.appendBottom(nude).appendBottom(d2)` plus `getYdelta1a/1b`
 * (`FtileIfWithDiamonds.java:156-193`). `laneCount` is this `if`'s own
 * `getSwimlanes().size()` (`FtileIfNude.java:79-87` -- the subtree's own
 * touched lanes, not the whole diagram's).
 */
function computeCoreGeometry(
  diamond1: GtileDiamondInside,
  b1: BranchGeo,
  b2: BranchGeo,
  hasTwoBranches: boolean,
  laneCount: number,
): CoreGeometry {
  const diamondLeft = diamond1.getCoord(SOUTH_HOOK).x;
  const diamondOutY = diamond1.getCoord(SOUTH_HOOK).y;
  const { geoTotal, merge } = computeNudeAndMerge(diamond1, b1, b2, hasTwoBranches);

  // `getYdelta1a`/`getYdelta1b` (`FtileIfWithDiamonds.java:156-166`).
  const ydelta1a = laneCount > 1 ? 20 : 10;
  const ydelta1b = laneCount > 1 ? 10 : hasTwoBranches ? 6 : 0;

  return {
    totalLeft: geoTotal.left,
    totalWidth: geoTotal.width,
    totalHeight: geoTotal.height + ydelta1a + ydelta1b,
    diamond1X0: geoTotal.left - diamondLeft,
    branchY0: diamondOutY + ydelta1a,
    tile2X0: geoTotal.width - b2.padded.outer,
    hasTwoBranches,
    merge,
  };
}

interface LabelMargins {
  readonly diff1: number;
  readonly diff2: number;
  readonly suppHeight: number;
}

/**
 * `computeMarginNeedForBranchLabe1/2` and
 * `computeVerticalMarginNeedForBranchs` (`FtileIfWithDiamonds.java:250-281`).
 */
function computeLabelMargins(diamond1: GtileDiamondInside, core: CoreGeometry): LabelMargins {
  const diamondOutY = diamond1.getCoord(SOUTH_HOOK).y;
  const west = diamond1.labelAt('west');
  const east = diamond1.labelAt('east');
  const label1Width = west?.width ?? 0;
  const label1Height = west?.height ?? 0;
  const label2Width = east?.width ?? 0;
  const label2Height = east?.height ?? 0;

  const diff1 = Math.max(0, label1Width - core.diamond1X0);
  const theoreticalEnd = core.diamond1X0 + diamond1.width + label2Width;
  const diff2 = Math.max(0, theoreticalEnd - core.totalWidth);
  const suppHeight = Math.max(0, Math.max(label1Height, label2Height) - diamondOutY);
  return { diff1, diff2, suppHeight };
}

/**
 * `FtileIfWithLinks`/`FtileIfWithDiamonds`: a hexagon condition, two
 * branches wrapped in `FtileMinWidthCentered(_, 30)` +
 * `addHorizontalMargin(_, 10)`, and a merge rhombus reached only when both
 * branches have a point out. Geometry only -- `layout/walk-if-with-links.ts`
 * emits the nodes and the four `addLinks` connectors from these fields.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/ConditionalBuilder.java:213-232
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithDiamonds.java
 */
export class GtileIfWithLinks extends TileComposite {
  readonly kind = 'gtile-if-with-links' as const;
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];

  readonly diamond1: GtileDiamondInside;
  readonly tile1: Tile;
  readonly tile2: Tile;
  readonly left: number;
  readonly diamond1X: number;
  readonly diamond1Y: number;
  readonly tile1X: number;
  readonly tile2X: number;
  readonly branchY: number;
  readonly hasMerge: boolean;
  readonly mergeX: number;
  readonly mergeY: number;
  readonly mergeSize = MERGE_SIZE;
  readonly hasPointOut1: boolean;
  readonly hasPointOut2: boolean;
  readonly thenIsEmpty: boolean;
  readonly elseIsEmpty: boolean;

  constructor(diamond1: GtileDiamondInside, branch1: IfWithLinksBranch, branch2: IfWithLinksBranch, laneCount: number) {
    super();
    this.diamond1 = diamond1;
    this.tile1 = branch1.tile;
    this.tile2 = branch2.tile;
    this.thenIsEmpty = branch1.isEmpty;
    this.elseIsEmpty = branch2.isEmpty;
    this.hasPointOut1 = branch1.tile.hasPointOut();
    this.hasPointOut2 = branch2.tile.hasPointOut();

    const b1: BranchGeo = { padded: paddedWidth(branch1.tile.width), height: branch1.tile.height };
    const b2: BranchGeo = { padded: paddedWidth(branch2.tile.width), height: branch2.tile.height };
    const hasTwoBranches = this.hasPointOut1 && this.hasPointOut2;
    const core = computeCoreGeometry(diamond1, b1, b2, hasTwoBranches, laneCount);
    const margins = computeLabelMargins(diamond1, core);

    this.width = core.totalWidth + margins.diff1 + margins.diff2;
    this.height = core.totalHeight + margins.suppHeight;
    this.left = core.totalLeft + margins.diff1;

    this.diamond1X = core.diamond1X0 + margins.diff1;
    this.diamond1Y = margins.suppHeight;
    this.tile1X = margins.diff1 + b1.padded.contentDx;
    this.tile2X = core.tile2X0 + margins.diff1 + b2.padded.contentDx;
    this.branchY = core.branchY0 + margins.suppHeight;
    this.hasMerge = core.hasTwoBranches;
    this.mergeX = core.totalLeft - core.merge.width / 2 + margins.diff1;
    this.mergeY = core.totalHeight - core.merge.height + margins.suppHeight;

    this.children = [diamond1, branch1.tile, branch2.tile];
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.left, y: this.diamond1Y };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: this.left, y: this.height };
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
   * `FtileIfNude#calculateDimensionFtile` (unoverridden by
   * `FtileIfWithDiamonds`): the OR of the two branches, never diamond2's
   * own state.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfNude.java:132-138
   */
  hasPointOut(): boolean {
    return this.hasPointOut1 || this.hasPointOut2;
  }
}
