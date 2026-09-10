import { describe, expect, it } from 'vitest';
import { GtileSplit } from '../../../../src/diagrams/activity/tiles/gtile-split.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';

// `AbstractParallelFtilesBuilder.java:130` -- was the unsourced module-local
// `BAR_OVERHANG` (10) before apc-T4.
const PARALLEL_X_MARGIN = 14;

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

describe('GtileSplit — geometry (same width formula as GtileFork, own barHeight; 2 branches w=80 h=60/80)', () => {
  const b1 = stubTile(80, 60);
  const b2 = stubTile(80, 80);
  const tile = new GtileSplit([b1, b2], bounder);

  it('kind === "gtile-split"', () => {
    expect(tile.kind).toBe('gtile-split');
  });

  it('width = 2 * (14 + 80 + 14) = 216 (same formula as fork)', () => {
    expect(tile.width).toBe(216);
  });

  it('height = 1.5 + 20 + 80 + 20 + 1.5 = 123 (THIN_SPLIT_HEIGHT, not BAR_HEIGHT)', () => {
    // GtileSplit passes THIN_SPLIT_HEIGHT(1.5) as the barHeight ctor arg
    // (FtileThinSplit.java:61), replacing the fork's BAR_HEIGHT(6).
    expect(tile.height).toBe(123);
  });

  it('barWidth === width', () => {
    expect(tile.barWidth).toBe(tile.width);
  });

  it('barHeight === 1.5 (THIN_SPLIT_HEIGHT, overrides GtileFork default)', () => {
    expect(tile.barHeight).toBe(1.5);
  });

  it('branchTopYs[1] (max-height branch) = 1.5 + 20 = 21.5', () => {
    expect(tile.branchTopYs[1]).toBe(21.5);
  });

  it('branchTopYs[0] (shorter branch) is centred: + (80-60)/2 = 31.5', () => {
    expect(tile.branchTopYs[0]).toBe(31.5);
  });

  it('branchOffsets[0] = PARALLEL_X_MARGIN = 14', () => {
    expect(tile.branchOffsets[0]).toBe(PARALLEL_X_MARGIN);
  });

  it('branchOffsets[1] = 122', () => {
    expect(tile.branchOffsets[1]).toBe(122);
  });

  it('NORTH_HOOK → { x: width/2, y: 0 }', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: tile.width / 2, y: 0 });
  });

  it('SOUTH_HOOK → { x: width/2, y: height }', () => {
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({
      x: tile.width / 2,
      y: tile.height,
    });
  });

  it('children contains both branches', () => {
    expect(tile.children).toHaveLength(2);
  });
});

// Unlike fork, a split becomes `FtileKilled` (no out point) when NO branch
// survives (vcompact/ParallelBuilderSplit.java:127-133 `hasOut()`, :150-151
// `if (hasOut() == false) return new FtileKilled(result)`), matching
// decisions.md D5/D4's "no join line and no out point" when every branch
// is detached.
describe('GtileSplit — hasPointOut() is true iff any branch has one', () => {
  it('is true when one branch continues and one is detached', () => {
    const tile = new GtileSplit([stubTile(80, 60, true), stubTile(80, 80, false)], bounder);
    expect(tile.hasPointOut()).toBe(true);
  });

  it('is false when every branch is detached (ParallelBuilderSplit.java:150-151)', () => {
    const tile = new GtileSplit([stubTile(80, 60, false), stubTile(80, 80, false)], bounder);
    expect(tile.hasPointOut()).toBe(false);
  });

  it('is false for an empty split (vacuous hasOut())', () => {
    const tile = new GtileSplit([], bounder);
    expect(tile.hasPointOut()).toBe(false);
  });
});
