import { describe, expect, it } from 'vitest';
import { GtileMerge, MERGE_DIAMOND_SIZE } from '../../../../src/diagrams/activity/tiles/gtile-merge.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';

// `AbstractParallelFtilesBuilder.java:64`.
const BAR_HEIGHT = 6;
// `AbstractParallelFtilesBuilder.java:130`.
const PARALLEL_X_MARGIN = 14;
// `AbstractParallelFtilesBuilder.java:129`.
const SPACE_AROUND_BLACK_BAR = 20;

const bounder: StringBounder = {
  getDimension: (_text: string, _size: number) => ({ width: 0, height: 0 }),
};

function stubTile(w: number, h: number, hasPointOut = true): Tile {
  return {
    kind: 'stub',
    width: w,
    height: h,
    getCoord: () => ({ x: 0, y: 0 }),
    hasPointOut: () => hasPointOut,
  };
}

// `Hexagon.hexagonHalfSize * 2` (`Hexagon.java:46`) -- D12/T1p-c.
describe('GtileMerge — geometry with 2 branches (w=80 each, h=60 and h=80)', () => {
  const b1 = stubTile(80, 60);
  const b2 = stubTile(80, 80);
  const tile = new GtileMerge([b1, b2], bounder);

  it('MERGE_DIAMOND_SIZE === 24 (Hexagon.hexagonHalfSize * 2)', () => {
    expect(MERGE_DIAMOND_SIZE).toBe(24);
  });

  it('width = 2 * (14 + 80 + 14) = 216, SAME as GtileFork (doStep1 shared)', () => {
    expect(tile.width).toBe(216);
  });

  it('height = BAR_HEIGHT + SPACE_AROUND_BLACK_BAR*2 + maxBranchH + MERGE_DIAMOND_SIZE = 150', () => {
    // 6 + 40 + 80 + 24 = 150 -- NOT GtileFork's 132 (6+40+80+6): the bottom
    // band is the 24x24 diamond, not a second barHeight band.
    expect(tile.height).toBe(150);
  });

  it('branchTopYs are UNCHANGED from GtileFork (top band is identical)', () => {
    expect(tile.branchTopYs[1]).toBe(BAR_HEIGHT + SPACE_AROUND_BLACK_BAR);
    expect(tile.branchTopYs[0]).toBe(BAR_HEIGHT + SPACE_AROUND_BLACK_BAR + 10);
  });

  it('barWidth === width (full-width top bar, same as fork)', () => {
    expect(tile.barWidth).toBe(tile.width);
  });

  it('barHeight === BAR_HEIGHT (the TOP band only)', () => {
    expect(tile.barHeight).toBe(BAR_HEIGHT);
  });

  it('branchOffsets[0] = PARALLEL_X_MARGIN = 14', () => {
    expect(tile.branchOffsets[0]).toBe(PARALLEL_X_MARGIN);
  });

  it('NORTH_HOOK -> x = width / 2, y = 0', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: tile.width / 2, y: 0 });
  });

  it('SOUTH_HOOK -> y = height', () => {
    expect(tile.getCoord(SOUTH_HOOK).y).toBe(tile.height);
  });

  it('children contains both branches', () => {
    expect(tile.children).toHaveLength(2);
    expect(tile.children[0]).toBe(b1);
    expect(tile.children[1]).toBe(b2);
  });

  // D12/T1p-c: `kind` is deliberately left at the inherited `'gtile-fork'`
  // (`gtile-merge.ts`'s own doc) so `tile-coordinates.ts`'s switch --
  // out of this task's write-set -- routes a merge tile unchanged;
  // `walk-fork-branches.ts#walkForkOrSplit` discriminates with
  // `instanceof GtileMerge` instead.
  it('kind stays "gtile-fork" (dispatch-routing device, not the final node kind)', () => {
    expect(tile.kind).toBe('gtile-fork');
  });

  it("is an instanceof GtileMerge (the walker's own dispatch check)", () => {
    expect(tile instanceof GtileMerge).toBe(true);
  });
});

// Mirrors `GtileFork`'s own "unconditionally true" hasPointOut() --
// `ParallelBuilderMerge`'s diamond join (`FtileDiamond`) always has an out
// point (`vertical/FtileDiamond.java:108-112`'s unconditional `outY`),
// independent of any branch's own `hasPointOut()`.
describe('GtileMerge — hasPointOut() is unconditionally true', () => {
  it('is true when every branch continues', () => {
    const tile = new GtileMerge([stubTile(80, 60, true), stubTile(80, 80, true)], bounder);
    expect(tile.hasPointOut()).toBe(true);
  });

  it('is true when every branch is detached', () => {
    const tile = new GtileMerge([stubTile(80, 60, false), stubTile(80, 80, false)], bounder);
    expect(tile.hasPointOut()).toBe(true);
  });
});
