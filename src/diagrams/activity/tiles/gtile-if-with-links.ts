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
/** `Hexagon.hexagonHalfSize`. @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46 */
const HEXAGON_HALF_SIZE = 12;

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
   *  padded box's left edge. */
  readonly contentDx: number;
  /** The padded box's own `left` -- the branch's OWN `left`
   *  (`getPoint2`/`FtileMarged`'s `orig.left + margin1`), NOT `outer / 2`:
   *  a branch whose own content is off-centre (e.g. a nested `if`) shifts
   *  through both wraps unchanged in kind, only translated.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileMinWidthCentered.java:99-106
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileMarged.java:93-97 */
  readonly paddedLeft: number;
  /** `outer - paddedLeft` -- the padded box's own `width - left`, the
   *  Java's `(dimN.getWidth() - dimN.getLeft())` term. */
  readonly paddedRight: number;
}

/** `FtileMinWidthCentered(branch, 30)` folded with `addHorizontalMargin(_,
 *  10)` (`FtileMinWidthCentered.java:68-79,99-106`; `FtileMarged.java:93-97`).
 *  `branch` is the branch tile's OWN (unwrapped) geometry -- `paddedLeft`
 *  reads its real `getCoord(NORTH_HOOK).x`, not an assumed `width / 2`. */
function paddedWidth(branch: Tile): PaddedWidth {
  const raw = branch.width;
  const min = Math.max(raw, MIN_BRANCH_WIDTH);
  const outer = min + 2 * BRANCH_MARGIN;
  const contentDx = (min - raw) / 2 + BRANCH_MARGIN;
  const paddedLeft = branch.getCoord(NORTH_HOOK).x + contentDx;
  return { outer, contentDx, paddedLeft, paddedRight: outer - paddedLeft };
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

/** The two geometry-affecting flags {@link mergeGeo}/{@link
 *  computeNudeAndMerge}/{@link computeCoreGeometry} all need, bundled so
 *  none of those functions exceeds the file's 5-parameter limit (T1p-a
 *  added `conditionEndStyle` to what was a lone `hasTwoBranches` flag). */
interface IfLinksFlags {
  readonly hasTwoBranches: boolean;
  /** `createWithLinks`'s own `getShape2(branch1, branch2, false)`
   *  (`ConditionalBuilder.java:221`) -- see {@link mergeGeo}'s own doc. */
  readonly conditionEndStyle: 'diamond' | 'hline';
}

/**
 * `getShape2`'s `hasTwoBranches()` branch: a real 24x24 rhombus, or the
 * invisible placeholder -- EXCEPT `conditionEndStyle === 'hline'` (T1p-a),
 * which takes `getShape2`'s own early return (`:287-288`, BEFORE the
 * `hasTwoBranches()` check) regardless of `hasTwoBranches`: `FtileEmpty(0,
 * hexagonHalfSize)`, twice the plain placeholder's height.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/ConditionalBuilder.java:285-311
 */
function mergeGeo(flags: IfLinksFlags): AlignedGeo {
  if (flags.conditionEndStyle === 'hline') return { left: 0, width: 0, height: HEXAGON_HALF_SIZE };
  if (flags.hasTwoBranches) return { left: MERGE_SIZE / 2, width: MERGE_SIZE, height: MERGE_SIZE };
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
function computeNudeAndMerge(diamond1: GtileDiamondInside, b1: BranchGeo, b2: BranchGeo, flags: IfLinksFlags): NudeAndMerge {
  const diamondLeft = diamond1.getCoord(SOUTH_HOOK).x;
  const diamondOutY = diamond1.getCoord(SOUTH_HOOK).y;
  const diamondWidth = diamond1.width;

  // `FtileIfNude#widthInner`: (dim1.w - dim1.left) + dim2.left.
  // `FtileIfWithDiamonds#widthInner`: max(super.widthInner, diamond1.w + 20).
  const innerMargin = Math.max(b1.padded.paddedRight + b2.padded.paddedLeft, diamondWidth + SUPP_WIDTH);
  // `FtileIfNude.java:147,153`: width = dim1.left + innerMargin + (dim2.w -
  // dim2.left); left = dim1.left + innerMargin / 2.
  const nude: AlignedGeo = {
    left: b1.padded.paddedLeft + innerMargin / 2,
    width: b1.padded.paddedLeft + innerMargin + b2.padded.paddedRight,
    height: Math.max(b1.height, b2.height),
  };
  const geoA = appendBottomGeo({ left: diamondLeft, width: diamondWidth, height: diamondOutY }, nude);
  const merge = mergeGeo(flags);
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
  flags: IfLinksFlags,
  laneCount: number,
): CoreGeometry {
  const diamondLeft = diamond1.getCoord(SOUTH_HOOK).x;
  const diamondOutY = diamond1.getCoord(SOUTH_HOOK).y;
  const { geoTotal, merge } = computeNudeAndMerge(diamond1, b1, b2, flags);

  // `getYdelta1a`/`getYdelta1b` (`FtileIfWithDiamonds.java:156-166`) --
  // UNAFFECTED by `conditionEndStyle` (the shared base class has no such
  // field; only `diamond2`'s own geometry, folded into `merge` above,
  // differs for `hline`).
  const ydelta1a = laneCount > 1 ? 20 : 10;
  const ydelta1b = laneCount > 1 ? 10 : flags.hasTwoBranches ? 6 : 0;

  return {
    totalLeft: geoTotal.left,
    totalWidth: geoTotal.width,
    totalHeight: geoTotal.height + ydelta1a + ydelta1b,
    diamond1X0: geoTotal.left - diamondLeft,
    branchY0: diamondOutY + ydelta1a,
    tile2X0: geoTotal.width - b2.padded.outer,
    hasTwoBranches: flags.hasTwoBranches,
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

/** Every field {@link GtileIfWithLinks}'s own constructor derives from
 *  `core`/`margins` -- split into a pure function (not inlined in the
 *  constructor) so T1p-a's new `conditionEndStyle` param did not push the
 *  constructor's own NLOC over the file's limit; applied via
 *  `Object.assign` (a plain object of `readonly`-named fields assigns onto
 *  the instance's own `readonly` properties without TS complaint, since
 *  `Object.assign`'s typing does not special-case `readonly`). */
interface Placement {
  readonly width: number;
  readonly height: number;
  readonly left: number;
  readonly diamond1X: number;
  readonly diamond1Y: number;
  readonly tile1X: number;
  readonly tile2X: number;
  readonly branchY: number;
  readonly hasMerge: boolean;
  readonly mergeX: number;
  readonly mergeY: number;
}

function computePlacement(b1: BranchGeo, b2: BranchGeo, core: CoreGeometry, margins: LabelMargins, flags: IfLinksFlags): Placement {
  return {
    width: core.totalWidth + margins.diff1 + margins.diff2,
    height: core.totalHeight + margins.suppHeight,
    left: core.totalLeft + margins.diff1,
    diamond1X: core.diamond1X0 + margins.diff1,
    diamond1Y: margins.suppHeight,
    tile1X: margins.diff1 + b1.padded.contentDx,
    tile2X: core.tile2X0 + margins.diff1 + b2.padded.contentDx,
    branchY: core.branchY0 + margins.suppHeight,
    hasMerge: core.hasTwoBranches && flags.conditionEndStyle !== 'hline',
    mergeX: core.totalLeft - core.merge.width / 2 + margins.diff1,
    mergeY: core.totalHeight - core.merge.height + margins.suppHeight,
  };
}

/** Every value {@link GtileIfWithLinks}'s own (private) constructor needs,
 *  pre-computed by {@link GtileIfWithLinks.create}. */
interface GtileIfWithLinksFields extends Placement {
  readonly diamond1: GtileDiamondInside;
  readonly tile1: Tile;
  readonly tile2: Tile;
  readonly thenIsEmpty: boolean;
  readonly elseIsEmpty: boolean;
  readonly hasPointOut1: boolean;
  readonly hasPointOut2: boolean;
  readonly conditionEndStyle: 'diamond' | 'hline';
}

/**
 * `FtileIfWithLinks`/`FtileIfWithDiamonds`: a hexagon condition, two
 * branches wrapped in `FtileMinWidthCentered(_, 30)` +
 * `addHorizontalMargin(_, 10)`, and a merge rhombus reached only when both
 * branches have a point out. Geometry only -- `layout/walk-if-with-links.ts`
 * emits the nodes and the four `addLinks` connectors from these fields.
 * Construct via {@link GtileIfWithLinks.create}, not `new` (T1p-a: the
 * constructor itself is a dumb field-assignment sink -- see its own doc).
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
  /** T1p-a: `skinparam ConditionEndStyle` -- see `theme.ts
   *  #conditionEndStyle`'s own doc comment. */
  readonly conditionEndStyle: 'diamond' | 'hline';

  /**
   * All computation lives in {@link GtileIfWithLinks.create} (a static
   * factory, T1p-a): this constructor does nothing but field assignment, so
   * that a 5th constructor param (`conditionEndStyle`) forcing a multi-line
   * signature never pushes an arithmetic-heavy function over the file's
   * NLOC limit.
   */
  private constructor(f: GtileIfWithLinksFields) {
    super();
    this.diamond1 = f.diamond1;
    this.tile1 = f.tile1;
    this.tile2 = f.tile2;
    this.thenIsEmpty = f.thenIsEmpty;
    this.elseIsEmpty = f.elseIsEmpty;
    this.hasPointOut1 = f.hasPointOut1;
    this.hasPointOut2 = f.hasPointOut2;
    this.conditionEndStyle = f.conditionEndStyle;
    this.width = f.width;
    this.height = f.height;
    this.left = f.left;
    this.diamond1X = f.diamond1X;
    this.diamond1Y = f.diamond1Y;
    this.tile1X = f.tile1X;
    this.tile2X = f.tile2X;
    this.branchY = f.branchY;
    this.hasMerge = f.hasMerge;
    this.mergeX = f.mergeX;
    this.mergeY = f.mergeY;
    this.children = [f.diamond1, f.tile1, f.tile2];
  }

  /** @param conditionEndStyle `skinparam ConditionEndStyle` -- default
   *    `'diamond'` (`SkinParam.java:1007-1013`). */
  static create(
    diamond1: GtileDiamondInside,
    branch1: IfWithLinksBranch,
    branch2: IfWithLinksBranch,
    laneCount: number,
    conditionEndStyle: 'diamond' | 'hline' | undefined = 'diamond',
  ): GtileIfWithLinks {
    const style = conditionEndStyle ?? 'diamond';
    const hasPointOut1 = branch1.tile.hasPointOut();
    const hasPointOut2 = branch2.tile.hasPointOut();
    const b1: BranchGeo = { padded: paddedWidth(branch1.tile), height: branch1.tile.height };
    const b2: BranchGeo = { padded: paddedWidth(branch2.tile), height: branch2.tile.height };
    const flags: IfLinksFlags = { hasTwoBranches: hasPointOut1 && hasPointOut2, conditionEndStyle: style };
    const core = computeCoreGeometry(diamond1, b1, b2, flags, laneCount);
    const margins = computeLabelMargins(diamond1, core);
    const placement = computePlacement(b1, b2, core, margins, flags);
    return new GtileIfWithLinks({
      diamond1,
      tile1: branch1.tile,
      tile2: branch2.tile,
      thenIsEmpty: branch1.isEmpty,
      elseIsEmpty: branch2.isEmpty,
      hasPointOut1,
      hasPointOut2,
      conditionEndStyle: style,
      ...placement,
    });
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
