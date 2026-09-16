import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { GtileDiamondInside } from './gtile-diamond-inside.js';

/** `ConditionalBuilder.java:171-172`: `new FtileMinWidthCentered(branch.getFtile(), 30)`. */
const MIN_BRANCH_WIDTH = 30;
/** `ConditionalBuilder.java:178,182,186,189`: `FtileUtils.addHorizontalMargin(_, 10)`. */
const BRANCH_MARGIN = 10;
/** `Hexagon.hexagonHalfSize`. @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46 */
const HEXAGON_HALF_SIZE = 12;
/** `FtileDiamond.java:108-112`, `Hexagon.hexagonHalfSize * 2` -- the merge
 *  rhombus's fixed size when both branches have a point out (D2). */
const MERGE_SIZE = 24;
/** `ConditionalBuilder.java:306`: `FtileEmpty(0, Hexagon.hexagonHalfSize / 2)`
 *  -- the invisible placeholder when `!hasTwoBranches()` and `optionalStop`
 *  is unset (e.g. the main flow itself ends without a point out). */
const MERGE_EMPTY_HEIGHT = 6;

interface PaddedWidth {
  readonly outer: number;
  readonly contentDx: number;
  /** The padded box's own `left` -- the branch's OWN `left` shifted through
   *  both wraps, NOT `outer / 2`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileMinWidthCentered.java:99-106
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileMarged.java:93-97 */
  readonly paddedLeft: number;
}

/** `FtileMinWidthCentered(branch, 30)` folded with `addHorizontalMargin(_,
 *  10)` (`FtileMinWidthCentered.java:68-79,99-106`; `FtileMarged.java:93-97`).
 *  Duplicated from `walk-if-with-links.ts`'s own copy per D5 (one walker/
 *  tile module per builder, no shared helper module). `branch` is the
 *  branch tile's OWN (unwrapped) geometry. */
function paddedWidth(branch: Tile): PaddedWidth {
  const raw = branch.width;
  const min = Math.max(raw, MIN_BRANCH_WIDTH);
  const outer = min + 2 * BRANCH_MARGIN;
  const contentDx = (min - raw) / 2 + BRANCH_MARGIN;
  return { outer, contentDx, paddedLeft: branch.getCoord(NORTH_HOOK).x + contentDx };
}

interface AlignedGeo {
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

/** `FtileGeometryMerger#appendBottom`: align on the larger `left`, sum
 *  heights. @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometryMerger.java:42-54 */
function appendBottomGeo(a: AlignedGeo, b: AlignedGeo): AlignedGeo {
  const left = Math.max(a.left, b.left);
  const width = Math.max(a.width + (left - a.left), b.width + (left - b.left));
  return { left, width, height: a.height + b.height };
}

/**
 * `diamond2`'s own geometry -- three distinct shapes (`ConditionalBuilder
 * .java:285-311` composed with `FtileIfDown.java:130-132`):
 * - `optionalStop` set: the field is REPLACED with `new FtileEmpty
 *   (skinParam)` regardless of what `getShape2` computed -- a genuine
 *   zero-size placeholder (`FtileEmpty.java:66-68`'s zero-arg ctor), not
 *   `getShape2`'s own `(0, hexagonHalfSize/2)` one, which is discarded.
 * - `optionalStop` unset, both original branches have a point out: the real
 *   24x24 merge rhombus (`FtileDiamond.java:108-112`), an `if-merge` node.
 * - `optionalStop` unset, one original branch lacks a point out (without
 *   being a lone stop/spot -- e.g. the main flow itself ends in `stop;`
 *   mid-sequence): `getShape2`'s own invisible `(0, hexagonHalfSize/2)`
 *   placeholder, no `if-merge` node, but its height still pads the tile.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/ConditionalBuilder.java:285-311
 */
function diamond2Geo(hasOptionalStop: boolean, hasTwoBranches: boolean): AlignedGeo {
  if (hasOptionalStop) return { left: 0, width: 0, height: 0 };
  if (hasTwoBranches) return { left: MERGE_SIZE / 2, width: MERGE_SIZE, height: MERGE_SIZE };
  return { left: 0, width: 0, height: MERGE_EMPTY_HEIGHT };
}

interface CoreGeometry {
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly d1Height: number;
  readonly d2: AlignedGeo;
  readonly thenPadded: PaddedWidth;
  readonly thenGeo: AlignedGeo;
}

/** `getAdditionalWidth` (`FtileIfDown.java:580-585`): `max(stopWidth,
 *  eastLabelWidth + stopWidth / 2)`. Shared by {@link computeGeometry}'s own
 *  width term and `computeStopOffsets`' own `stopX` -- both need the exact
 *  same value, never two independently-rounded copies. */
function additionalWidthFor(diamond1: GtileDiamondInside, optionalStopWidth: number): number {
  const eastLabelWidth = diamond1.labelAt('east')?.width ?? 0;
  return Math.max(optionalStopWidth, eastLabelWidth + optionalStopWidth / 2);
}

interface AlignedTotal {
  readonly geo: AlignedGeo;
  readonly d1Height: number;
  readonly thenPadded: PaddedWidth;
  readonly thenGeo: AlignedGeo;
}

/** `d1.appendBottom(then).appendBottom(d2)`, split out of {@link
 *  computeGeometry} only to keep that function's own NLOC under the file's
 *  limit. @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:547-550 */
function computeAlignedTotal(
  diamond1: GtileDiamondInside,
  main: Tile,
  hasOptionalStop: boolean,
  hasTwoBranches: boolean,
): AlignedTotal {
  const d1Geo: AlignedGeo = { left: diamond1.width / 2, width: diamond1.width, height: diamond1.height };
  const thenPadded = paddedWidth(main);
  const thenGeo: AlignedGeo = { left: thenPadded.paddedLeft, width: thenPadded.outer, height: main.height };
  const d2 = diamond2Geo(hasOptionalStop, hasTwoBranches);
  const geo = appendBottomGeo(appendBottomGeo(d1Geo, thenGeo), d2);
  return { geo, d1Height: d1Geo.height, thenPadded, thenGeo };
}

/**
 * The `36 + max(12, southLabelHeight)` vertical pad and the `12` (`+ stop
 * width + additionalWidth` when `optionalStop`) horizontal pad. `opale`
 * (notes on an `if`) is out of scope (D8) so every `opaleWidth`/
 * `opaleHeight` term in the Java is always `0` here, collapsing the
 * `supp > 0` branch permanently.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:555-564
 */
function computeGeometry(
  diamond1: GtileDiamondInside,
  main: Tile,
  hasOptionalStop: boolean,
  hasTwoBranches: boolean,
  optionalStopWidth: number,
): CoreGeometry {
  const total = computeAlignedTotal(diamond1, main, hasOptionalStop, hasTwoBranches);
  const d2 = diamond2Geo(hasOptionalStop, hasTwoBranches);
  const southLabelHeight = diamond1.labelAt('south')?.height ?? 0;
  const height = total.geo.height + 3 * HEXAGON_HALF_SIZE + Math.max(HEXAGON_HALF_SIZE, southLabelHeight);
  const width = hasOptionalStop
    ? total.geo.width + HEXAGON_HALF_SIZE + optionalStopWidth + additionalWidthFor(diamond1, optionalStopWidth)
    : total.geo.width + HEXAGON_HALF_SIZE;
  return {
    left: total.geo.left,
    width,
    height,
    d1Height: total.d1Height,
    d2,
    thenPadded: total.thenPadded,
    thenGeo: total.thenGeo,
  };
}

interface MainOffsets {
  readonly diamond1X: number;
  readonly wrapX: number;
  readonly wrapWidth: number;
  readonly mainTileX: number;
  readonly mainTileY: number;
  readonly diamond2X: number;
  readonly diamond2Y: number;
  readonly diamond2Left: number;
  readonly diamond2Size: number;
}

/** The main-flow content's own placement plus `diamond2`'s (real or
 *  invisible) placement -- split out of the constructor only to keep its
 *  own NLOC under the file's limit.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:624-637,659-665
 */
function computeOffsets(diamond1: GtileDiamondInside, core: CoreGeometry): MainOffsets {
  const diamond1X = core.left - diamond1.width / 2;
  const wrapX = core.left - core.thenGeo.left;
  const mainTileY = core.d1Height + (core.height - core.d1Height - core.d2.height - core.thenGeo.height) / 2;
  return {
    diamond1X,
    wrapX,
    wrapWidth: core.thenGeo.width,
    mainTileX: wrapX + core.thenPadded.contentDx,
    mainTileY,
    diamond2X: core.left - core.d2.left,
    diamond2Y: core.height - core.d2.height,
    diamond2Left: core.d2.left,
    diamond2Size: core.d2.width,
  };
}

interface StopOffsets {
  readonly stopX: number;
  readonly stopY: number;
}

/** `getTranslateOptionalStop` (`FtileIfDown.java:648-657`), split out of the
 *  constructor for the same reason as {@link computeOffsets}. Returns the
 *  zero placeholder when there is no optional-stop side box. */
function computeStopOffsets(diamond1: GtileDiamondInside, optionalStop: Tile | null, core: CoreGeometry): StopOffsets {
  if (optionalStop === null) return { stopX: 0, stopY: 0 };
  const additionalWidth = additionalWidthFor(diamond1, optionalStop.width);
  return {
    stopX: core.left - diamond1.width / 2 + diamond1.width + additionalWidth,
    stopY: (diamond1.height - optionalStop.height) / 2,
  };
}

/**
 * `FtileIfDown`: the single-branch `if` whose OTHER branch is either empty
 * or a lone stop/end/killed-action (D1). Geometry only -- `layout/
 * walk-if-down.ts` emits the nodes and the `conns`-order connectors from
 * these fields.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java
 */
export class GtileIfDown extends TileComposite {
  readonly kind = 'gtile-if-down' as const;
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];

  readonly diamond1: GtileDiamondInside;
  readonly mainTile: Tile;
  readonly optionalStop: Tile | null;
  readonly useElse1: boolean;
  readonly hasThenPointOut: boolean;
  readonly hasMergeNode: boolean;

  readonly left: number;
  readonly diamond1Y = 0;
  /** {@link MainOffsets.wrapX}/`.wrapWidth` are the WRAPPED (padded)
   *  then-frame's own local x/width -- distinct from `.mainTileX`, which
   *  also folds in the content's own offset within that frame
   *  (`ConnectionElse1`/`Else2`'s own `getTranslateForThen().getDx()`
   *  term). */
  readonly offsets: MainOffsets;
  readonly stop: StopOffsets;

  /**
   * @param diamond1 the condition hexagon, `.withSouth(mainLabel)
   *   .withEast(sideLabel)` already applied; `swapEastWest()` already
   *   called by the caller when `useElse1` is `true` (mutually exclusive
   *   with `optionalStop`, `FtileIfDown.java:140-143`).
   * @param mainTile the visual main flow's own RAW content tile (never
   *   wrapped by this constructor's caller -- the `FtileMinWidthCentered`
   *   + `addHorizontalMargin` wrap is folded in here, D4).
   * @param optionalStop the OTHER branch's own raw content tile when it is
   *   a genuine side box (a lone stop/end/killed-action), else `null`.
   * @param hasTwoBranches whether the ORIGINAL (pre-swap) then AND else
   *   both have a point out -- `ConditionalBuilder#hasTwoBranches`, always
   *   computed from the un-reordered branches regardless of `optionalStop`.
   * @param useElse1 pre-resolved by the caller (`Swimlane
   *   #isSmallerThanAllOthers`, `Swimlane.java:130-137`) -- this class does
   *   not itself know the diagram's lane declaration order.
   */
  constructor(
    diamond1: GtileDiamondInside,
    mainTile: Tile,
    optionalStop: Tile | null,
    hasTwoBranches: boolean,
    useElse1: boolean,
  ) {
    super();
    this.diamond1 = diamond1;
    this.mainTile = mainTile;
    this.optionalStop = optionalStop;
    this.useElse1 = useElse1;
    this.hasThenPointOut = mainTile.hasPointOut();
    this.hasMergeNode = optionalStop === null && hasTwoBranches;

    const core = computeGeometry(diamond1, mainTile, optionalStop !== null, hasTwoBranches, optionalStop?.width ?? 0);
    this.left = core.left;
    this.width = core.width;
    this.height = core.height;
    this.offsets = computeOffsets(diamond1, core);
    this.stop = computeStopOffsets(diamond1, optionalStop, core);
    this.children = optionalStop !== null ? [mainTile, diamond1, optionalStop] : [mainTile, diamond1];
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.left, y: 0 };
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
   * `withoutPointOut` fires only when the main flow itself lacks a point
   * out AND the other branch is a genuine `optionalStop` side box.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:573-576
   */
  hasPointOut(): boolean {
    return this.optionalStop === null || this.hasThenPointOut;
  }
}
