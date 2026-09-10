import { describe, expect, it } from 'vitest';
import { GtileSplit } from '../../../../src/diagrams/activity/tiles/gtile-split.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';

const BAR_OVERHANG = 10;

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

describe('GtileSplit — geometry (same as GtileFork, 2 branches w=80 h=60/80)', () => {
  const b1 = stubTile(80, 60);
  const b2 = stubTile(80, 80);
  const tile = new GtileSplit([b1, b2], bounder);

  it('kind === "gtile-split"', () => {
    expect(tile.kind).toBe('gtile-split');
  });

  it('width = 220 (same formula as fork)', () => {
    // branchTotalWidth = 80 + 40 + 80 = 200; + 2 * BAR_OVERHANG(10) = 220
    expect(tile.width).toBe(220);
  });

  it('height = 136 (same formula as fork)', () => {
    // 8 + 20 + 80 + 20 + 8 = 136
    expect(tile.height).toBe(136);
  });

  it('barWidth === width', () => {
    expect(tile.barWidth).toBe(tile.width);
  });

  it('branchTopY = 28', () => {
    expect(tile.branchTopY).toBe(28);
  });

  it('branchOffsets[0] = 10', () => {
    expect(tile.branchOffsets[0]).toBe(BAR_OVERHANG);
  });

  it('branchOffsets[1] = 130', () => {
    expect(tile.branchOffsets[1]).toBe(130);
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
