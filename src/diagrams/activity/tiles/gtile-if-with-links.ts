import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { DiamondConditionTile } from './gtile-diamond-inside.js';
import type { IfOwnNote } from './gtile-note.js';
import type { IfOwnNoteGeometry } from './gtile-if-with-links-notes.js';
import { computeIfOwnNoteGeometry } from './gtile-if-with-links-notes.js';

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

/** Flags {@link mergeGeo}/{@link computeNudeAndMerge}/{@link
 *  computeCoreGeometry} all need, bundled under the file's 5-param limit.
 *  `xDeltaNote`/`yDeltaNote`/`suppWidthNode` are `FtileIfNude.java:58-60`'s
 *  own IFNOTE fields, computed once by `gtile-if-with-links-notes.ts
 *  #computeIfOwnNoteGeometry`; exported so that module can build its own
 *  trial values of this shape. */
export interface IfLinksFlags {
  readonly hasTwoBranches: boolean;
  /** `createWithLinks`'s own `getShape2(branch1, branch2, false)`
   *  (`ConditionalBuilder.java:221`) -- see {@link mergeGeo}'s own doc. */
  readonly conditionEndStyle: 'diamond' | 'hline';
  /** How far the LEFT note's own width overhangs `diamond1`'s baseline x. */
  readonly xDeltaNote: number;
  /** The taller of the two notes' own height; pads `diamond1`'s own y (see
   *  {@link GtileIfWithLinks.getCoord}'s `NORTH_HOOK` case). */
  readonly yDeltaNote: number;
  /** How far the RIGHT note's own width overhangs the baseline right edge. */
  readonly suppWidthNode: number;
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

export interface NudeAndMerge {
  readonly geoTotal: AlignedGeo;
  readonly merge: AlignedGeo;
}

/** `d1.appendBottom(nude).appendBottom(d2)`, split out of {@link
 *  computeCoreGeometry} for NLOC. Exported: `gtile-if-with-links-notes.ts
 *  #computeIfOwnNoteGeometry` also calls this with TRIAL
 *  `xDeltaNote`/`suppWidthNode` to read `diamond1`'s baseline x and the
 *  composite's baseline width, mirroring `getTranslateDiamond1().getDx()`'s
 *  own recompute-after-each-note semantics (`FtileIfWithDiamonds.java:
 *  88,100-102`, `clearCacheDimensionInternal()` at `:108`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithDiamonds.java:183-186 */
export function computeNudeAndMerge(diamond1: DiamondConditionTile, b1: BranchGeo, b2: BranchGeo, flags: IfLinksFlags): NudeAndMerge {
  const diamondLeft = diamond1.getCoord(SOUTH_HOOK).x;
  const diamondOutY = diamond1.getCoord(SOUTH_HOOK).y;
  const diamondWidth = diamond1.width;

  // `FtileIfNude#widthInner`: (dim1.w - dim1.left) + dim2.left.
  // `FtileIfWithDiamonds#widthInner`: max(super.widthInner, diamond1.w + 20).
  const innerMargin = Math.max(b1.padded.paddedRight + b2.padded.paddedLeft, diamondWidth + SUPP_WIDTH);
  // `FtileIfNude.java:147,152-153`: width = xDeltaNote + dim1.left +
  // innerMargin + (dim2.w - dim2.left) + suppWidthNode; left = xDeltaNote +
  // dim1.left + innerMargin / 2; height = yDeltaNote + dim12.height (dim12
  // = dim1.mergeLR(dim2), i.e. max of the two branch heights).
  const nude: AlignedGeo = {
    left: flags.xDeltaNote + b1.padded.paddedLeft + innerMargin / 2,
    width: flags.xDeltaNote + b1.padded.paddedLeft + innerMargin + b2.padded.paddedRight + flags.suppWidthNode,
    height: flags.yDeltaNote + Math.max(b1.height, b2.height),
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
  readonly diamond1Y0: number;
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
  diamond1: DiamondConditionTile,
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
    // `getTranslateDiamond1`'s own `y1=yDeltaNote` (`FtileIfWithDiamonds
    // .java:235`) -- room made at the composite's own top for the note.
    diamond1Y0: flags.yDeltaNote,
    // `getTranslateBranch1/2`'s own `+dimDiamond1.height+getYdelta1a`
    // (`:221-232`) composed with the base class's own `y1=yDeltaNote`
    // (`FtileIfNude.java:98-99,107-108`) -- both branches drop too.
    branchY0: diamondOutY + ydelta1a + flags.yDeltaNote,
    // `getTranslateBranch2`'s own `x2=dimTotal.width-dim2.width-
    // suppWidthNode` (`FtileIfNude.java:107`): `geoTotal.width` already
    // carries `+suppWidthNode` ONCE (via `nude.width`); subtract it again
    // so branch2 lands where it would without the right note at all.
    tile2X0: geoTotal.width - b2.padded.outer - flags.suppWidthNode,
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
function computeLabelMargins(diamond1: DiamondConditionTile, core: CoreGeometry): LabelMargins {
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
  /** `getTranslateDiamond1`'s own `y1=yDeltaNote` (`FtileIfWithDiamonds
   *  .java:235`), folded with the external `addVerticalMargin` wrap
   *  (`ConditionalBuilder.java:230`) into one frame. See {@link noteY}. */
  readonly diamond1Y: number;
  readonly tile1X: number;
  readonly tile2X: number;
  readonly branchY: number;
  /** `opaleLeft`/`opaleRight`'s own local `y=0` (`FtileIfWithDiamonds
   *  .java:203,209` -- no `dy` translate), same frame as {@link diamond1Y}.
   *  `diamond1Y` sits `yDeltaNote` BELOW this -- that gap is the room the
   *  note's own height made. */
  readonly noteY: number;
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
    diamond1Y: core.diamond1Y0 + margins.suppHeight,
    tile1X: margins.diff1 + flags.xDeltaNote + b1.padded.contentDx,
    tile2X: core.tile2X0 + margins.diff1 + b2.padded.contentDx,
    branchY: core.branchY0 + margins.suppHeight,
    noteY: margins.suppHeight,
    hasMerge: core.hasTwoBranches && flags.conditionEndStyle !== 'hline',
    mergeX: core.totalLeft - core.merge.width / 2 + margins.diff1,
    mergeY: core.totalHeight - core.merge.height + margins.suppHeight,
  };
}

/** Every value {@link GtileIfWithLinks}'s own (private) constructor needs,
 *  pre-computed by {@link GtileIfWithLinks.create}. */
interface GtileIfWithLinksFields extends Placement {
  readonly diamond1: DiamondConditionTile;
  readonly tile1: Tile;
  readonly tile2: Tile;
  readonly thenIsEmpty: boolean;
  readonly elseIsEmpty: boolean;
  readonly hasPointOut1: boolean;
  readonly hasPointOut2: boolean;
  readonly conditionEndStyle: 'diamond' | 'hline';
  readonly opaleLeft: IfOwnNote | null;
  readonly opaleRight: IfOwnNote | null;
}

/** {@link GtileIfWithLinks.create}'s own trailing options bag -- bundled
 *  under the file's 5-param limit, same convention `GtileIfDown`'s own
 *  `GtileIfDownOptions` uses for its `opale`. `notes` are PRE-MEASURED by
 *  the caller (`gtile-note.ts#measureIfOwnNote`), same as
 *  `conditionEndStyle`'s own convention -- this module stays free of
 *  `StringBounder`/`Theme`. */
export interface IfWithLinksCreateOptions {
  /** `skinparam ConditionEndStyle` -- default `'diamond'`
   *  (`SkinParam.java:1007-1013`). */
  readonly conditionEndStyle?: 'diamond' | 'hline' | undefined;
  /** `ActivityIf.notes` (T2a's capture), pre-measured.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithDiamonds.java:79-111 */
  readonly notes?: readonly IfOwnNote[];
}

/** Both branches' own padded geometry plus their raw `hasPointOut` --
 *  split out of {@link GtileIfWithLinks.create} purely to keep that
 *  function's own NLOC under the file's limit. */
interface BranchGeos {
  readonly b1: BranchGeo;
  readonly b2: BranchGeo;
  readonly hasPointOut1: boolean;
  readonly hasPointOut2: boolean;
}

function buildBranchGeos(branch1: IfWithLinksBranch, branch2: IfWithLinksBranch): BranchGeos {
  return {
    hasPointOut1: branch1.tile.hasPointOut(),
    hasPointOut2: branch2.tile.hasPointOut(),
    b1: { padded: paddedWidth(branch1.tile), height: branch1.tile.height },
    b2: { padded: paddedWidth(branch2.tile), height: branch2.tile.height },
  };
}

interface ResolvedPlacement {
  readonly placement: Placement;
  readonly noteGeo: IfOwnNoteGeometry;
}

/** The note-geometry pre-pass (`computeIfOwnNoteGeometry`) composed with
 *  `computeCoreGeometry`/`computeLabelMargins`/`computePlacement` -- split
 *  out of {@link GtileIfWithLinks.create} purely to keep that function's
 *  own NLOC under the file's limit. */
function resolvePlacement(
  diamond1: DiamondConditionTile,
  geos: BranchGeos,
  laneCount: number,
  style: 'diamond' | 'hline',
  notes: readonly IfOwnNote[],
): ResolvedPlacement {
  const baseFlags: IfLinksFlags = {
    hasTwoBranches: geos.hasPointOut1 && geos.hasPointOut2,
    conditionEndStyle: style,
    xDeltaNote: 0,
    yDeltaNote: 0,
    suppWidthNode: 0,
  };
  const noteGeo = computeIfOwnNoteGeometry(notes, diamond1, geos.b1, geos.b2, baseFlags);
  const flags: IfLinksFlags = { ...baseFlags, xDeltaNote: noteGeo.xDeltaNote, yDeltaNote: noteGeo.yDeltaNote, suppWidthNode: noteGeo.suppWidthNode };
  const core = computeCoreGeometry(diamond1, geos.b1, geos.b2, flags, laneCount);
  const margins = computeLabelMargins(diamond1, core);
  return { placement: computePlacement(geos.b1, geos.b2, core, margins, flags), noteGeo };
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

  readonly diamond1: DiamondConditionTile;
  readonly tile1: Tile;
  readonly tile2: Tile;
  readonly left: number;
  readonly diamond1X: number;
  readonly diamond1Y: number;
  readonly tile1X: number;
  readonly tile2X: number;
  readonly branchY: number;
  readonly noteY: number;
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
  /** `null` when this if owns no LEFT/RIGHT note respectively.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithDiamonds.java:75-76 */
  readonly opaleLeft: IfOwnNote | null;
  readonly opaleRight: IfOwnNote | null;

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
    this.opaleLeft = f.opaleLeft;
    this.opaleRight = f.opaleRight;
    this.width = f.width;
    this.height = f.height;
    this.left = f.left;
    this.diamond1X = f.diamond1X;
    this.diamond1Y = f.diamond1Y;
    this.tile1X = f.tile1X;
    this.tile2X = f.tile2X;
    this.branchY = f.branchY;
    this.noteY = f.noteY;
    this.hasMerge = f.hasMerge;
    this.mergeX = f.mergeX;
    this.mergeY = f.mergeY;
    this.children = [f.diamond1, f.tile1, f.tile2];
  }

  /** @param options {@link IfWithLinksCreateOptions} -- bundled (not two
   *    more positional params) to stay under the file's 5-parameter limit. */
  static create(
    diamond1: DiamondConditionTile,
    branch1: IfWithLinksBranch,
    branch2: IfWithLinksBranch,
    laneCount: number,
    options?: IfWithLinksCreateOptions,
  ): GtileIfWithLinks {
    const style = options?.conditionEndStyle ?? 'diamond';
    const geos = buildBranchGeos(branch1, branch2);
    const { placement, noteGeo } = resolvePlacement(diamond1, geos, laneCount, style, options?.notes ?? []);
    return new GtileIfWithLinks({
      diamond1,
      tile1: branch1.tile,
      tile2: branch2.tile,
      thenIsEmpty: branch1.isEmpty,
      elseIsEmpty: branch2.isEmpty,
      hasPointOut1: geos.hasPointOut1,
      hasPointOut2: geos.hasPointOut2,
      conditionEndStyle: style,
      opaleLeft: noteGeo.opaleLeft,
      opaleRight: noteGeo.opaleRight,
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
