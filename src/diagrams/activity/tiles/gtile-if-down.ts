import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { DiamondConditionTile } from './gtile-diamond-inside.js';
import type { IfOwnNote } from './gtile-note.js';

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

/** The three geometry-affecting flags {@link diamond2Geo}/{@link
 *  computeAlignedTotal}/{@link computeGeometry} all need, bundled so none of
 *  those functions exceeds the file's 5-parameter limit (T1p-a added
 *  `conditionEndStyle` to what was a 2-flag pair). */
interface IfDownFlags {
  readonly hasOptionalStop: boolean;
  readonly hasTwoBranches: boolean;
  /** `ConditionalBuilder#getShape2` (`:285-311`): `skinparam
   *  ConditionEndStyle hline` -- see this constant's own doc below. */
  readonly conditionEndStyle: 'diamond' | 'hline';
}

/**
 * `diamond2`'s own geometry -- FOUR distinct shapes (`ConditionalBuilder
 * .java:285-311` composed with `FtileIfDown.java:130-132`):
 * - `optionalStop` set: the field is REPLACED with `new FtileEmpty
 *   (skinParam)` regardless of what `getShape2` computed -- a genuine
 *   zero-size placeholder (`FtileEmpty.java:66-68`'s zero-arg ctor), not
 *   `getShape2`'s own return value, which is discarded. UNAFFECTED by
 *   `conditionEndStyle` (the override happens after `getShape2` returns).
 * - `optionalStop` unset, `conditionEndStyle === 'hline'` (T1p-a):
 *   `getShape2`'s OWN early return (`:287-288`, BEFORE the
 *   `hasTwoBranches()` check) -- `FtileEmpty(0, hexagonHalfSize)`,
 *   regardless of `hasTwoBranches`.
 * - `optionalStop` unset, `'diamond'`, both original branches have a point
 *   out: the real 24x24 merge rhombus (`FtileDiamond.java:108-112`), an
 *   `if-merge` node.
 * - `optionalStop` unset, `'diamond'`, one original branch lacks a point out
 *   (without being a lone stop/spot -- e.g. the main flow itself ends in
 *   `stop;` mid-sequence): `getShape2`'s own invisible `(0,
 *   hexagonHalfSize/2)` placeholder, no `if-merge` node, but its height
 *   still pads the tile.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/ConditionalBuilder.java:285-311
 */
function diamond2Geo(flags: IfDownFlags): AlignedGeo {
  if (flags.hasOptionalStop) return { left: 0, width: 0, height: 0 };
  if (flags.conditionEndStyle === 'hline') return { left: 0, width: 0, height: HEXAGON_HALF_SIZE };
  if (flags.hasTwoBranches) return { left: MERGE_SIZE / 2, width: MERGE_SIZE, height: MERGE_SIZE };
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
  /** `ConnectionOut#getP2hline` vs `#getP2` (`FtileIfDown.java:254-264,
   *  275-278`): the local Y offset of `diamond2`'s own point the main
   *  flow's `ConnectionOut` lands on -- `0` (the point-IN, top) under
   *  `'diamond'`, `d2.height / 2` (the east-MID point) under `'hline'`.
   *  Reduces to `0` whenever `d2.height` is itself `0` (the `optionalStop`
   *  placeholder), so this single field is correct for all three shapes
   *  without a separate flag. */
  readonly diamond2PointInY: number;
}

/** `getAdditionalWidth` (`FtileIfDown.java:580-585`): `max(stopWidth,
 *  eastLabelWidth + stopWidth / 2)`. Shared by {@link computeGeometry}'s own
 *  width term and `computeStopOffsets`' own `stopX` -- both need the exact
 *  same value, never two independently-rounded copies. */
function additionalWidthFor(diamond1: DiamondConditionTile, optionalStopWidth: number): number {
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
function computeAlignedTotal(diamond1: DiamondConditionTile, main: Tile, flags: IfDownFlags): AlignedTotal {
  const d1Geo: AlignedGeo = { left: diamond1.width / 2, width: diamond1.width, height: diamond1.height };
  const thenPadded = paddedWidth(main);
  const thenGeo: AlignedGeo = { left: thenPadded.paddedLeft, width: thenPadded.outer, height: main.height };
  const d2 = diamond2Geo(flags);
  const geo = appendBottomGeo(appendBottomGeo(d1Geo, thenGeo), d2);
  return { geo, d1Height: d1Geo.height, thenPadded, thenGeo };
}

/**
 * The `36 + max(12, southLabelHeight)` vertical pad and the `12` (`+ stop
 * width + additionalWidth` when `optionalStop`) horizontal pad, plus the
 * single opale note's own `supp`/`opaleHeight` terms (`activity-
 * divergence-drive-3` T2a, family IFNOTE -- CLOSES this file's own D8
 * placeholder): `supp = max(0, opaleWidth - geo.left)` widens the LEFT
 * side only when the note is wider than the composite's own natural left
 * margin; `opaleHeight` pads height UNCONDITIONALLY (the note is always
 * drawn, never centred against spare vertical room).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:555-564
 */
/** See {@link CoreGeometry.diamond2PointInY}'s own doc comment. */
function diamond2PointInY(flags: IfDownFlags, d2: AlignedGeo): number {
  return flags.conditionEndStyle === 'hline' ? d2.height / 2 : 0;
}

interface OpaleLeftAdjust {
  readonly supp: number;
  readonly left: number;
}

/** The opale note's own `supp`/`left` adjustment, split out of {@link
 *  computeGeometry} purely to keep that function's own NLOC/param-count
 *  under the file's limit (IFNOTE's one `opale` param pushed it over).
 *  `supp = max(0, opaleWidth - geo.left)`; `left = opaleWidth +
 *  diamond1.width/2` only when `supp > 0`, else unchanged
 *  (`FtileIfDown.java:558-571`). */
function applyOpaleToLeft(diamond1: DiamondConditionTile, geoLeft: number, opaleWidth: number): OpaleLeftAdjust {
  const supp = Math.max(0, opaleWidth - geoLeft);
  return { supp, left: supp > 0 ? opaleWidth + diamond1.width / 2 : geoLeft };
}

interface HeightAndWidthBase {
  readonly height: number;
  readonly widthBase: number;
}

/** `height`/`widthBase` (pre-`supp`), split out of {@link computeGeometry}
 *  for the same NLOC reason as {@link applyOpaleToLeft}. */
function computeHeightAndWidthBase(
  diamond1: DiamondConditionTile,
  total: AlignedTotal,
  flags: IfDownFlags,
  optionalStopWidth: number,
  opaleHeight: number,
): HeightAndWidthBase {
  const southLabelHeight = diamond1.labelAt('south')?.height ?? 0;
  const height = total.geo.height + 3 * HEXAGON_HALF_SIZE + Math.max(HEXAGON_HALF_SIZE, southLabelHeight) + opaleHeight;
  const widthBase = flags.hasOptionalStop
    ? total.geo.width + HEXAGON_HALF_SIZE + optionalStopWidth + additionalWidthFor(diamond1, optionalStopWidth)
    : total.geo.width + HEXAGON_HALF_SIZE;
  return { height, widthBase };
}

interface ResolvedIfDownFlags {
  readonly flags: IfDownFlags;
  readonly hasMergeNode: boolean;
}

/** The constructor's own `flags`/`hasMergeNode` setup, split out purely to
 *  keep that constructor's own CCN under the file's limit. */
function resolveIfDownFlags(optionalStop: Tile | null, options: GtileIfDownOptions, conditionEndStyle: 'diamond' | 'hline'): ResolvedIfDownFlags {
  const hasOptionalStop = optionalStop !== null;
  return {
    flags: { hasOptionalStop, hasTwoBranches: options.hasTwoBranches, conditionEndStyle },
    hasMergeNode: !hasOptionalStop && options.hasTwoBranches && conditionEndStyle !== 'hline',
  };
}

interface GeometryExtras {
  readonly optionalStopWidth: number;
  readonly opale: IfOwnNote | null;
}

function computeGeometry(diamond1: DiamondConditionTile, main: Tile, flags: IfDownFlags, extras: GeometryExtras): CoreGeometry {
  const { optionalStopWidth, opale } = extras;
  const total = computeAlignedTotal(diamond1, main, flags);
  const d2 = diamond2Geo(flags);
  const { supp, left } = applyOpaleToLeft(diamond1, total.geo.left, opale?.box.width ?? 0);
  const { height, widthBase } = computeHeightAndWidthBase(diamond1, total, flags, optionalStopWidth, opale?.box.height ?? 0);
  return {
    left,
    width: widthBase + supp,
    height,
    d1Height: total.d1Height,
    d2,
    diamond2PointInY: diamond2PointInY(flags, d2),
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
  /** See {@link CoreGeometry.diamond2PointInY}'s own doc comment. */
  readonly diamond2PointInY: number;
}

/** The main-flow content's own placement plus `diamond2`'s (real or
 *  invisible) placement -- split out of the constructor only to keep its
 *  own NLOC under the file's limit.
 *
 * `getTranslateForThen`'s own `y` (`:624-637`) leads with `opaleHeight`
 * AND subtracts it again inside the centering remainder -- `opaleHeight`
 * pads the AVAILABLE vertical room (`height` already includes it, added
 * unconditionally by {@link computeHeightAndWidthBase}) and then is added
 * back as a flat offset so the centred remainder is computed over the
 * space BELOW the note, not over the whole (note + d1 + then + d2) span.
 * `0` when this if owns no note (the pre-IFNOTE formula, unchanged) --
 * add3-T3c (family IFNOTE): this file's own {@link GtileIfDown.diamond1Y}
 * field already carries this term for `diamond1`'s own translate; this
 * was the one `getTranslate*` site IFNOTE's original landing missed.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:624-637,659-665
 */
function computeOffsets(diamond1: DiamondConditionTile, core: CoreGeometry, opaleHeight: number): MainOffsets {
  const diamond1X = core.left - diamond1.width / 2;
  const wrapX = core.left - core.thenGeo.left;
  const mainTileY =
    opaleHeight +
    core.d1Height +
    (core.height - opaleHeight - core.d1Height - core.d2.height - core.thenGeo.height) / 2;
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
    diamond2PointInY: core.diamond2PointInY,
  };
}

interface StopOffsets {
  readonly stopX: number;
  readonly stopY: number;
}

/** `getTranslateOptionalStop` (`FtileIfDown.java:648-657`), split out of the
 *  constructor for the same reason as {@link computeOffsets}. Returns the
 *  zero placeholder when there is no optional-stop side box. */
function computeStopOffsets(diamond1: DiamondConditionTile, optionalStop: Tile | null, core: CoreGeometry): StopOffsets {
  if (optionalStop === null) return { stopX: 0, stopY: 0 };
  const additionalWidth = additionalWidthFor(diamond1, optionalStop.width);
  return {
    stopX: core.left - diamond1.width / 2 + diamond1.width + additionalWidth,
    stopY: (diamond1.height - optionalStop.height) / 2,
  };
}

/**
 * @param hasTwoBranches whether the ORIGINAL (pre-swap) then AND else both
 *   have a point out -- `ConditionalBuilder#hasTwoBranches`, always
 *   computed from the un-reordered branches regardless of `optionalStop`.
 * @param useElse1 pre-resolved by the caller (`Swimlane
 *   #isSmallerThanAllOthers`, `Swimlane.java:130-137`) -- this class does
 *   not itself know the diagram's lane declaration order. The caller MUST
 *   pass `false` under `conditionEndStyle: 'hline'` (the swimlane check
 *   that picks `Else1` only runs inside `FtileIfDown.java`'s own
 *   `conditionEndStyle == DIAMOND` branch, `:139-146`).
 * @param conditionEndStyle `skinparam ConditionEndStyle` -- default
 *   `'diamond'` (`SkinParam.java:1007-1013`).
 */
interface GtileIfDownOptions {
  readonly hasTwoBranches: boolean;
  readonly useElse1: boolean;
  readonly conditionEndStyle?: 'diamond' | 'hline' | undefined;
  /** `FtileIfDown.java:116-120`: `notes.size() == 1 ? createOpale(first) :
   *  EMPTY` -- exactly one note (either side; `FtileIfDown` ignores
   *  `NotePosition` entirely), else none at all (2+ notes are silently
   *  dropped, not stacked). Pre-measured by the caller
   *  (`conditional-builder.ts#buildIfDown`, via `measureIfOwnNote`).
   *  `activity-divergence-drive-3` T2a, family IFNOTE. */
  readonly opale?: IfOwnNote | null;
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

  readonly diamond1: DiamondConditionTile;
  readonly mainTile: Tile;
  readonly optionalStop: Tile | null;
  readonly useElse1: boolean;
  readonly hasThenPointOut: boolean;
  readonly hasMergeNode: boolean;
  /** T1p-a: `skinparam ConditionEndStyle` -- see `theme.ts
   *  #conditionEndStyle`'s own doc comment. */
  readonly conditionEndStyle: 'diamond' | 'hline';

  readonly left: number;
  /** `getTranslateDiamond1`'s own `y1 = opale.height` (`FtileIfDown.java:
   *  640-645`) -- `0` when this if owns no note (the pre-IFNOTE value). */
  readonly diamond1Y: number;
  /** {@link MainOffsets.wrapX}/`.wrapWidth` are the WRAPPED (padded)
   *  then-frame's own local x/width -- distinct from `.mainTileX`, which
   *  also folds in the content's own offset within that frame
   *  (`ConnectionElse1`/`Else2`'s own `getTranslateForThen().getDx()`
   *  term). */
  readonly offsets: MainOffsets;
  readonly stop: StopOffsets;
  /** `null` when this if owns no note, or owns more than one (silently
   *  dropped, `GtileIfDownOptions.opale`'s own doc). */
  readonly opale: IfOwnNote | null;

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
   * @param options {@link GtileIfDownOptions} -- bundled (not 3 more
   *   positional params) to stay under the file's 5-parameter limit.
   */
  constructor(diamond1: DiamondConditionTile, mainTile: Tile, optionalStop: Tile | null, options: GtileIfDownOptions) {
    super();
    const conditionEndStyle = options.conditionEndStyle ?? 'diamond';
    this.diamond1 = diamond1;
    this.mainTile = mainTile;
    this.optionalStop = optionalStop;
    this.useElse1 = options.useElse1;
    this.conditionEndStyle = conditionEndStyle;
    this.hasThenPointOut = mainTile.hasPointOut();
    const { flags, hasMergeNode } = resolveIfDownFlags(optionalStop, options, conditionEndStyle);
    this.hasMergeNode = hasMergeNode;
    const opale = options.opale ?? null;
    this.opale = opale;
    const core = computeGeometry(diamond1, mainTile, flags, { optionalStopWidth: optionalStop?.width ?? 0, opale });
    this.left = core.left;
    this.width = core.width;
    this.height = core.height;
    this.diamond1Y = opale?.box.height ?? 0;
    this.offsets = computeOffsets(diamond1, core, this.diamond1Y);
    this.stop = computeStopOffsets(diamond1, optionalStop, core);
    this.children = optionalStop !== null ? [mainTile, diamond1, optionalStop] : [mainTile, diamond1];
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
   * `withoutPointOut` fires only when the main flow itself lacks a point
   * out AND the other branch is a genuine `optionalStop` side box.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:573-576
   */
  hasPointOut(): boolean {
    return this.optionalStop === null || this.hasThenPointOut;
  }
}
