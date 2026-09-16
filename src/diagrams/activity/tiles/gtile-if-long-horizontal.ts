import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { GtileDiamondInside2 } from './gtile-diamond-inside2.js';

/** `FtileIfLongHorizontal.java:82`: `xSeparation`. */
const X_SEPARATION = 20;
/** `ConditionalBuilder`-style branch wrap floor -- `FtileMinWidthCentered
 *  (branch.getFtile(), 30)`, no further `addHorizontalMargin` wrap here
 *  (unlike `down`/`with-links`, D5: no shared helper module).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:160-165 */
const MIN_TILE_WIDTH = 30;
/** `alignDiamonds`' own fixed bottom pad, added after the `missing/2` top
 *  pad that equalises the diamonds' out points.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:110-122 */
const DIAMOND_ALIGN_BOTTOM_MARGIN = 20;
/** `Math.max(100, maxOutY)` -- the fixed floor under the branch row.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:690 */
const MIN_ROW_HEIGHT = 100;

interface PaddedWidth {
  readonly outer: number;
  readonly contentDx: number;
}

/** `FtileMinWidthCentered(tile, 30)` alone -- no `addHorizontalMargin` fold
 *  (contrast `gtile-if-down.ts`'s own `paddedWidth`, which folds both). */
function minWidthCentered(raw: number): PaddedWidth {
  const outer = Math.max(raw, MIN_TILE_WIDTH);
  return { outer, contentDx: (outer - raw) / 2 };
}

interface AlignedDiamond {
  readonly topMargin: number;
  readonly height: number;
  readonly outY: number;
}

/** `alignDiamonds`/`getMaxOutY`: every diamond's out point is equalised to
 *  the row's tallest hexagon via a `missing/2` top pad, plus a fixed `20`
 *  bottom pad -- NOT a full equalisation (the resulting `outY`s are the
 *  AVERAGE of each diamond's own and the max, per `incVertically`'s own
 *  `outY += missing1` where `missing1 = missing/2`), ported verbatim.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:110-128
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometry.java:105-108 -- `incVertically`. */
function alignDiamonds(diamonds: readonly GtileDiamondInside2[]): AlignedDiamond[] {
  const maxOutY = diamonds.reduce((m, d) => Math.max(m, d.hexHeight), 0);
  return diamonds.map((d) => {
    const topMargin = (maxOutY - d.hexHeight) / 2;
    return { topMargin, height: d.height + topMargin + DIAMOND_ALIGN_BOTTOM_MARGIN, outY: d.hexHeight + topMargin };
  });
}

interface CoupleGeo {
  readonly diamondLocalX: number;
  readonly tileLocalX: number;
  readonly tileLocalY: number;
  readonly width: number;
  readonly left: number;
  readonly height: number;
}

/** `FtileAssemblySimple(diamond, tile)` (`dim1.appendBottom(dim2)`, tile at
 *  `(assemblyLeft - tile.left, dim1.h)`) plus `addHorizontalMargin(_,
 *  inlabelSize, 0)` folded in (D4: wrappers folded into the constructor).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileAssemblySimple.java:56-141
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileMarged.java:71-77 */
function coupleGeometry(
  diamond: GtileDiamondInside2,
  alignedHeight: number,
  tile: Tile,
  inlabelSize: number,
): CoupleGeo {
  const tilePad = minWidthCentered(tile.width);
  const assemblyLeft = Math.max(diamond.left, tilePad.outer / 2);
  const assemblyWidth = Math.max(
    diamond.width + (assemblyLeft - diamond.left),
    tilePad.outer + (assemblyLeft - tilePad.outer / 2),
  );
  return {
    diamondLocalX: inlabelSize + (assemblyLeft - diamond.left),
    tileLocalX: inlabelSize + (assemblyLeft - tilePad.outer / 2) + tilePad.contentDx,
    tileLocalY: alignedHeight,
    width: assemblyWidth + inlabelSize,
    left: assemblyLeft + inlabelSize,
    height: alignedHeight + tile.height,
  };
}

/** `getTranslateCouple1`: couple `i` at `(Σ_{j<i}(couple_j.w + 20), 25)`. */
function coupleAbsX(coupleWidths: readonly number[]): number[] {
  const xs: number[] = [];
  let x = 0;
  for (const w of coupleWidths) {
    xs.push(x);
    x += w + X_SEPARATION;
  }
  return xs;
}

interface OverallGeo {
  readonly width: number;
  readonly height: number;
}

/** `calculateDimensionInternal`: `mergeLR` over couples, then `tile2`
 *  (delta'd by `diamondsH/2`), then the `20*n` / `max(100,maxOutY)` delta.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:679-693 */
function computeOverall(
  coupleWidths: readonly number[],
  coupleHeights: readonly number[],
  tile2: { readonly outer: number; readonly height: number },
  diamondsH: number,
  maxOutYAligned: number,
): OverallGeo {
  const sumCoupleWidth = coupleWidths.reduce((a, b) => a + b, 0);
  const maxCoupleHeight = Math.max(0, ...coupleHeights);
  const width = sumCoupleWidth + tile2.outer + X_SEPARATION * coupleWidths.length;
  const height = Math.max(maxCoupleHeight, tile2.height + diamondsH / 2) + Math.max(MIN_ROW_HEIGHT, maxOutYAligned);
  return { width, height };
}

export interface BranchLayout {
  readonly diamondX: number;
  readonly diamondY: number;
  readonly tileX: number;
  readonly tileY: number;
  readonly coupleX: number;
  readonly coupleLeft: number;
  readonly coupleWidth: number;
  readonly hasPointOut: boolean;
}

interface FullGeo {
  readonly width: number;
  readonly height: number;
  readonly branches: BranchLayout[];
  readonly tile2X: number;
  readonly tile2Y: number;
  readonly tile2Left: number;
  readonly tile2ContentDx: number;
  readonly nbOut: number;
}

/** `getTranslateCouple1`/`ConnectionVerticalIn`'s own inputs, per branch --
 *  split out of {@link computeGeometry} only to keep that function's own
 *  NLOC under the file's limit. */
function buildBranchLayouts(
  couples: readonly CoupleGeo[],
  aligned: readonly AlignedDiamond[],
  xs: readonly number[],
  tiles: readonly Tile[],
): BranchLayout[] {
  return couples.map((c, i) => ({
    diamondX: xs[i]! + c.diamondLocalX,
    diamondY: 25 + aligned[i]!.topMargin,
    tileX: xs[i]! + c.tileLocalX,
    tileY: 25 + c.tileLocalY,
    coupleX: xs[i]!,
    coupleLeft: c.left,
    coupleWidth: c.width,
    hasPointOut: tiles[i]!.hasPointOut(),
  }));
}

interface OverallAndTile2 {
  readonly width: number;
  readonly height: number;
  readonly tile2X: number;
  readonly tile2Y: number;
  readonly tile2Left: number;
  readonly tile2ContentDx: number;
}

/** {@link computeOverall} plus `tile2`'s own placement (`getTranslate2`,
 *  `h` is always `0` -- the `getAllDiamondsHeight` term upstream comments
 *  out, preserved as a no-op rather than "fixed") -- split out of
 *  {@link computeGeometry} only to keep that function's own NLOC under the
 *  file's limit.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:624-635 */
function computeOverallAndTile2(
  couples: readonly CoupleGeo[],
  tile2: Tile,
  aligned: readonly AlignedDiamond[],
): OverallAndTile2 {
  const tile2Pad = minWidthCentered(tile2.width);
  const diamondsH = Math.max(0, ...aligned.map((a) => a.height));
  const maxOutYAligned = Math.max(0, ...aligned.map((a) => a.outY));
  const overall = computeOverall(
    couples.map((c) => c.width),
    couples.map((c) => c.height),
    { outer: tile2Pad.outer, height: tile2.height },
    diamondsH,
    maxOutYAligned,
  );
  return {
    width: overall.width,
    height: overall.height,
    tile2X: overall.width - tile2Pad.outer,
    tile2Y: (overall.height - tile2.height) / 2,
    tile2Left: tile2Pad.outer / 2,
    tile2ContentDx: tile2Pad.contentDx,
  };
}

/** Orchestrates the per-branch couple geometry against {@link
 *  computeOverallAndTile2} and {@link buildBranchLayouts}. */
function computeGeometry(
  diamonds: readonly GtileDiamondInside2[],
  tiles: readonly Tile[],
  tile2: Tile,
  inlabelSizes: readonly number[],
): FullGeo {
  const aligned = alignDiamonds(diamonds);
  const couples = diamonds.map((d, i) => coupleGeometry(d, aligned[i]!.height, tiles[i]!, inlabelSizes[i]!));
  const xs = coupleAbsX(couples.map((c) => c.width));
  const rest = computeOverallAndTile2(couples, tile2, aligned);
  const branches = buildBranchLayouts(couples, aligned, xs, tiles);

  return { ...rest, branches, nbOut: branches.filter((b) => b.hasPointOut).length };
}

/**
 * `FtileIfLongHorizontal`: the `elseif`-chain builder (D1) -- a row of
 * per-branch hexagons (`FtileDiamondInside2`) each coupled with its own
 * branch content, plus the `else` branch (`tile2`) placed to the right of
 * the whole row. Geometry only -- `layout/walk-if-long-horizontal.ts`
 * emits the nodes and the `conns`-order connectors from these fields.
 *
 * `inlabelSizes` is always `0` in this port: `Branch#getInlabel()` (a
 * `->label->` on a branch line) has no AST analogue (`ast.ts`'s
 * `ActivityElseIf` carries no such field) and zero corpus fixtures use it
 * (T1 Q1) -- a documented gap, not a silently-dropped one, mirroring T1
 * Q0's `InstructionSpot` gap. The parameter is kept (not hardcoded away)
 * so a future AST extension only has to thread a real value through.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java
 */
export class GtileIfLongHorizontal extends TileComposite {
  readonly kind = 'gtile-if-long-horizontal' as const;
  readonly width: number;
  readonly height: number;
  readonly left: number;
  readonly children: readonly Tile[];

  readonly diamonds: readonly GtileDiamondInside2[];
  readonly tiles: readonly Tile[];
  readonly tile2: Tile;
  readonly branches: readonly BranchLayout[];
  readonly tile2X: number;
  readonly tile2Y: number;
  readonly tile2Left: number;
  readonly tile2ContentDx: number;
  readonly nbOut: number;
  readonly hasTile2PointOut: boolean;

  constructor(diamonds: GtileDiamondInside2[], tiles: Tile[], tile2: Tile, inlabelSizes: readonly number[]) {
    super();
    if (diamonds.length !== tiles.length) throw new Error('GtileIfLongHorizontal: diamonds/tiles length mismatch');
    this.diamonds = diamonds;
    this.tiles = tiles;
    this.tile2 = tile2;
    this.hasTile2PointOut = tile2.hasPointOut();

    const geo = computeGeometry(diamonds, tiles, tile2, inlabelSizes);
    this.width = geo.width;
    this.height = geo.height;
    this.left = geo.width / 2;
    this.branches = geo.branches;
    this.tile2X = geo.tile2X;
    this.tile2Y = geo.tile2Y;
    this.tile2Left = geo.tile2Left;
    this.tile2ContentDx = geo.tile2ContentDx;
    this.nbOut = geo.nbOut;
    this.children = [...diamonds, ...tiles, tile2];
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
   * `calculateDimensionFtile`: `true` iff ANY branch tile or `tile2` has a
   * point out.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:703-712
   */
  hasPointOut(): boolean {
    return this.nbOut > 0 || this.hasTile2PointOut;
  }
}
