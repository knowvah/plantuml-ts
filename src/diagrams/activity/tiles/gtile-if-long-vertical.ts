import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { GtileDiamondInside2 } from './gtile-diamond-inside2.js';
import { HEXAGON_HALF_SIZE } from '../layout/hexagon-reservations.js';

/** `FtileIfLongVertical.java:78`: `ySeparation`. */
const Y_SEPARATION = 20;
/** `FtileIfLongVertical.java:80`: `marginy1`. */
const MARGIN_Y1 = 30;
/**
 * `FtileIfLongVertical.create`'s own `double west = 10;` (`:141`) -- the
 * floor of the `FtileMargedWest(branch.getFtile(), west)` margin every
 * branch body tile gets (`:165`). {@link westMargin} raises it to the widest
 * `Branch#getInlabel()` (`:154-158`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileMargedWest.java
 */
const WEST_MARGIN = 10;
/** `FtileMinWidthCentered(branch2.getFtile(), 30)` -- `:170`. */
const MIN_TILE2_WIDTH = 30;
/** `FtileIfLongVertical.java:522`: `lastElseArrowHeight`. */
const LAST_ELSE_ARROW_HEIGHT = 40;
/** `lastDiamond`'s shape -- a label-less `FtileDiamond`
 *  (`vertical/FtileDiamond.java`), `Hexagon.asPolygon(shadowing)`'s
 *  four-point rhombus (`Hexagon.java:46-62`). Computed locally (not
 *  imported from `tiles/gtile-merge.ts`, T1p-c's own new module) to avoid a
 *  cross-task write-set dependency, mirroring `gtile-repeat-entry.ts`'s own
 *  identical precedent. */
const MERGE_DIAMOND_SIZE = HEXAGON_HALF_SIZE * 2;

/**
 * A branch's own `Branch#getInlabel()` (`(No) elseif ...`): the text and its
 * `tbInlabel.calculateDimension(...).getWidth()` (`FtileIfLongVertical.java:
 * 154-157`), measured by the builder at the arrow font.
 */
export interface VerticalInlabel {
  readonly label: string;
  readonly width: number;
}

/** `west = max(west, tbInlabel.width)` over every branch, from the floor
 *  {@link WEST_MARGIN} (`FtileIfLongVertical.java:141,154-158`). */
function westMargin(inlabels: readonly (VerticalInlabel | undefined)[]): number {
  return Math.max(WEST_MARGIN, ...inlabels.map((l) => l?.width ?? 0));
}

interface MinWidthPad {
  readonly outer: number;
  readonly contentDx: number;
  readonly paddedLeft: number;
}

/** `FtileMinWidthCentered(tile2, 30)` -- byte-identical to `gtile-if-long-
 *  horizontal.ts`'s own `minWidthCentered` (D5: no shared helper module
 *  between builder-specific tile files), used here ONLY for `tile2`
 *  (branch tiles get the {@link westMargin} unilateral margin instead, never
 *  this centering).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileMinWidthCentered.java */
function minWidthCentered(tile: Tile, minWidth: number): MinWidthPad {
  const raw = tile.width;
  const outer = Math.max(raw, minWidth);
  const contentDx = (outer - raw) / 2;
  return { outer, contentDx, paddedLeft: tile.getCoord(NORTH_HOOK).x + contentDx };
}

/** `allDiamondsWidth` -- `:528-534`. */
function allDiamondsWidth(diamonds: readonly GtileDiamondInside2[]): number {
  return Math.max(0, ...diamonds.map((d) => d.width));
}

/** `getTranslateDy` -- `:473-482`. */
function translateDy(idx: number, diamonds: readonly GtileDiamondInside2[], tiles: readonly Tile[]): number {
  let y = MARGIN_Y1;
  for (let i = 0; i < idx; i++) y += tiles[i]!.height + diamonds[i]!.height + Y_SEPARATION;
  return y;
}

export interface VerticalBranchLayout {
  readonly diamondX: number;
  readonly diamondY: number;
  /** The branch body tile's own CONTENT origin -- i.e. the box origin
   *  (`allDiamondsWidth + (dimTotal.width - allDiamondsWidth - dim1.width)
   *  / 2`, `getTranslate1`, `:459-471`) already shifted by {@link
   *  westMargin} (`FtileMargedWest`'s own `dx` content shift). */
  readonly tileX: number;
  readonly tileY: number;
  readonly hasPointOut: boolean;
}

interface FullGeo {
  readonly width: number;
  readonly height: number;
  readonly branches: VerticalBranchLayout[];
  readonly tile2X: number;
  readonly tile2Y: number;
  readonly lastDiamondX: number;
  readonly lastDiamondY: number;
}

interface WidthHeightInputs {
  readonly diamondsWidth: number;
  readonly tilesOuterWidth: readonly number[];
  readonly branchColumnHeight: number;
  readonly tile2Pad: MinWidthPad;
  readonly tile2Height: number;
  readonly branchCount: number;
}

/** `calculateDimensionInternal`'s width/height (`:504-526`) -- `appendBottom`
 *  (`FtileGeometryMerger`) and `addDim`'s own `outY` bookkeeping are
 *  irrelevant here: `calculateDimensionFtile` (`:536-548`) never reads the
 *  merged `outY`, only `dimTotal`'s width/height, so this port tracks
 *  width/height alone. */
function computeWidthHeight(inputs: WidthHeightInputs): { width: number; height: number } {
  const { diamondsWidth, tilesOuterWidth, branchColumnHeight, tile2Pad, tile2Height, branchCount } = inputs;
  const col2 = Math.max(0, ...tilesOuterWidth);
  const widthBase = diamondsWidth + col2;
  const left0 = widthBase / 2;
  const leftMerged = Math.max(left0, tile2Pad.paddedLeft);
  const dx1 = leftMerged - left0;
  const dx2 = leftMerged - tile2Pad.paddedLeft;
  const widthMerged = Math.max(widthBase + dx1, tile2Pad.outer + dx2);
  const heightMerged = branchColumnHeight + tile2Height;
  const height = heightMerged + Y_SEPARATION * branchCount + LAST_ELSE_ARROW_HEIGHT + MERGE_DIAMOND_SIZE;
  return { width: widthMerged, height };
}

/** Per-branch diamond/tile placement (`getTranslateDiamond`/`getTranslate1`,
 *  `:441-471`) -- split out of {@link computeGeometry} only to keep that
 *  function's own NLOC under the file's limit. */
function buildBranchLayouts(
  diamonds: readonly GtileDiamondInside2[],
  tiles: readonly Tile[],
  diamondsWidth: number,
  width: number,
  west: number,
): VerticalBranchLayout[] {
  return diamonds.map((d, i) => {
    const tile = tiles[i]!;
    const outer = tile.width + west;
    const boxX = diamondsWidth + (width - diamondsWidth - outer) / 2;
    return {
      diamondX: (diamondsWidth - d.width) / 2,
      diamondY: translateDy(i, diamonds, tiles),
      tileX: boxX + west,
      tileY: translateDy(i, diamonds, tiles) + d.height,
      hasPointOut: tile.hasPointOut(),
    };
  });
}

/** Orchestrates {@link computeWidthHeight}/{@link buildBranchLayouts} plus
 *  `tile2`'s own placement (`getTranslate2`, `:484-490`) and `lastDiamond`'s
 *  (`getTranslateLastDiamond`, `:452-457`). */
function computeGeometry(
  diamonds: readonly GtileDiamondInside2[],
  tiles: readonly Tile[],
  tile2: Tile,
  west: number,
): FullGeo {
  const diamondsWidth = allDiamondsWidth(diamonds);
  const tilesOuterWidth = tiles.map((t) => t.width + west);
  let branchColumnHeight = MARGIN_Y1;
  for (let i = 0; i < diamonds.length; i++) branchColumnHeight += diamonds[i]!.height + tiles[i]!.height;
  const tile2Pad = minWidthCentered(tile2, MIN_TILE2_WIDTH);

  const { width, height } = computeWidthHeight({
    diamondsWidth,
    tilesOuterWidth,
    branchColumnHeight,
    tile2Pad,
    tile2Height: tile2.height,
    branchCount: diamonds.length,
  });

  const branches = buildBranchLayouts(diamonds, tiles, diamondsWidth, width, west);
  const tile2Y = translateDy(diamonds.length, diamonds, tiles);
  const tile2X = (width - tile2Pad.outer) / 2 + tile2Pad.contentDx;
  const lastDiamondX = (width - MERGE_DIAMOND_SIZE) / 2;
  const lastDiamondY = height - MERGE_DIAMOND_SIZE;

  return { width, height, branches, tile2X, tile2Y, lastDiamondX, lastDiamondY };
}

/**
 * `FtileIfLongVertical` (D12/T1p-b, `!pragma useVerticalIf true` +
 * `thens.size() > 1` -- `FtileFactoryDelegatorIf.java:85-88`): an elseif
 * chain laid out as a DOWNWARD column of condition hexagons, each coupled
 * with its own branch body to its right, converging through a label-less
 * merge diamond ({@link MERGE_DIAMOND_SIZE}) fed by the `else` clause
 * (`tile2`, placed below the column) and by every branch body that has a
 * point out. Geometry only -- `layout/walk-if-long-vertical.ts` emits the
 * nodes and the `conns`-order connectors from these fields.
 *
 * `inlabels[i]` is branch `i`'s own `Branch#getInlabel()`: every inlabel
 * widens the shared `west` margin ({@link westMargin}) and branch `i+1`'s
 * inlabel labels `ConnectionVertical(diamond_i, diamond_i+1)`
 * (`FtileIfLongVertical.java:183-190`, drawn by `walk-if-long-vertical.ts`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java
 */
export class GtileIfLongVertical extends TileComposite {
  readonly kind = 'gtile-if-long-vertical' as const;
  readonly width: number;
  readonly height: number;
  readonly left: number;
  /** `getMyChildren()` (`:90-94`): `tiles` then `tile2` -- diamonds and
   *  `lastDiamond` are NOT upstream children (nothing here reads this
   *  field generically; kept for fidelity, see this class's own doc). */
  readonly children: readonly Tile[];

  readonly diamonds: readonly GtileDiamondInside2[];
  readonly tiles: readonly Tile[];
  readonly tile2: Tile;
  readonly branches: readonly VerticalBranchLayout[];
  readonly tile2X: number;
  readonly tile2Y: number;
  readonly lastDiamondX: number;
  readonly lastDiamondY: number;
  /** {@link MERGE_DIAMOND_SIZE}, exposed as a field so `layout/walk-if-
   *  long-vertical.ts` need not re-declare the constant (mirrors `gtile-
   *  if-down.ts`'s own `offsets.diamond2Size` precedent). */
  readonly lastDiamondSize: number;
  readonly hasTile2PointOut: boolean;
  /** `ConnectionLastElse`'s own edge label -- `branch2.getDisplayPositive()`,
   *  `node.elseLabel` in this port's AST (`conditional-builder.ts#buildIf
   *  LongVertical`). Threaded here (not read by `layout/walk-if-long-
   *  vertical.ts` off the AST directly) because the walker only ever sees
   *  the tile, never the source `ActivityIf` node, matching `gtile-switch
   *  .ts#caseLabels`'s own precedent for an edge-carried label. */
  readonly elseLabel: string | undefined;
  /** Per-branch `Branch#getInlabel()` -- see this class's own doc. */
  readonly inlabels: readonly (VerticalInlabel | undefined)[];
  private readonly nbOut: number;

  constructor(
    diamonds: GtileDiamondInside2[],
    tiles: Tile[],
    tile2: Tile,
    elseLabel: string | undefined,
    inlabels: readonly (VerticalInlabel | undefined)[] = [],
  ) {
    super();
    if (diamonds.length !== tiles.length) throw new Error('GtileIfLongVertical: diamonds/tiles length mismatch');
    this.diamonds = diamonds;
    this.tiles = tiles;
    this.tile2 = tile2;
    this.elseLabel = elseLabel;
    this.inlabels = inlabels;
    this.hasTile2PointOut = tile2.hasPointOut();

    const geo = computeGeometry(diamonds, tiles, tile2, westMargin(inlabels));
    this.width = geo.width;
    this.height = geo.height;
    this.left = geo.width / 2;
    this.branches = geo.branches;
    this.tile2X = geo.tile2X;
    this.tile2Y = geo.tile2Y;
    this.lastDiamondX = geo.lastDiamondX;
    this.lastDiamondY = geo.lastDiamondY;
    this.lastDiamondSize = MERGE_DIAMOND_SIZE;
    this.nbOut = geo.branches.filter((b) => b.hasPointOut).length;
    this.children = [...tiles, tile2];
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
   * `calculateDimensionFtile`: `true` iff ANY branch body tile or `tile2`
   * has a point out -- `diamonds`/`lastDiamond` are excluded from this
   * check, matching `getMyChildren()`'s own exclusion.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:536-548
   */
  hasPointOut(): boolean {
    return this.nbOut > 0 || this.hasTile2PointOut;
  }
}
