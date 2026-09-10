import { describe, expect, it } from 'vitest';
import { GtileFork } from '../../../../src/diagrams/activity/tiles/gtile-fork.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';

// Constants mirroring the implementation
// `AbstractParallelFtilesBuilder.java:64` -- was an unsourced 8 (apc-T3).
const BAR_HEIGHT = 6;
// `AbstractParallelFtilesBuilder.java:130` -- was the unsourced module-local
// `BAR_OVERHANG` (10) before apc-T4.
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

describe('GtileFork — geometry with 2 branches (w=80 each, h=60 and h=80)', () => {
  const b1 = stubTile(80, 60);
  const b2 = stubTile(80, 80);
  const tile = new GtileFork([b1, b2], bounder);

  it('width = 2 * (14 + 80 + 14) = 216 (computeNewFtile, no other gap)', () => {
    expect(tile.width).toBe(216);
  });

  it('height = BAR_HEIGHT + SPACE_AROUND_BLACK_BAR*2 + maxBranchH + BAR_HEIGHT = 132', () => {
    // 6 + 40 + 80 + 6 = 132
    expect(tile.height).toBe(132);
  });

  it('barWidth === width', () => {
    expect(tile.barWidth).toBe(tile.width);
  });

  it('barHeight === BAR_HEIGHT (default, fork)', () => {
    expect(tile.barHeight).toBe(BAR_HEIGHT);
  });

  it('branchTopYs[1] (the max-height branch) = BAR_HEIGHT + SPACE_AROUND_BLACK_BAR = 26', () => {
    expect(tile.branchTopYs[1]).toBe(BAR_HEIGHT + SPACE_AROUND_BLACK_BAR);
  });

  it('branchTopYs[0] (the shorter branch) is centred: + (80-60)/2 = 36', () => {
    expect(tile.branchTopYs[0]).toBe(BAR_HEIGHT + SPACE_AROUND_BLACK_BAR + 10);
  });

  it('branchOffsets[0] = PARALLEL_X_MARGIN = 14', () => {
    expect(tile.branchOffsets[0]).toBe(PARALLEL_X_MARGIN);
  });

  it('branchOffsets[1] = PARALLEL_X_MARGIN + 80 + PARALLEL_X_MARGIN*2 = 122', () => {
    expect(tile.branchOffsets[1]).toBe(PARALLEL_X_MARGIN + 80 + PARALLEL_X_MARGIN * 2);
  });

  it('NORTH_HOOK → y = 0', () => {
    expect(tile.getCoord(NORTH_HOOK).y).toBe(0);
  });

  it('SOUTH_HOOK → y = height', () => {
    expect(tile.getCoord(SOUTH_HOOK).y).toBe(tile.height);
  });

  it('NORTH_HOOK → x = width / 2', () => {
    expect(tile.getCoord(NORTH_HOOK).x).toBe(tile.width / 2);
  });

  it('SOUTH_HOOK → x = width / 2', () => {
    expect(tile.getCoord(SOUTH_HOOK).x).toBe(tile.width / 2);
  });

  it('children contains both branches', () => {
    expect(tile.children).toHaveLength(2);
    expect(tile.children[0]).toBe(b1);
    expect(tile.children[1]).toBe(b2);
  });

  it('kind === "gtile-fork"', () => {
    expect(tile.kind).toBe('gtile-fork');
  });
});

describe('GtileFork — single branch', () => {
  const b = stubTile(60, 50);
  const tile = new GtileFork([b], bounder);

  it('width = 14 + 60 + 14 = 88', () => {
    expect(tile.width).toBe(88);
  });

  it('height = 6 + 20 + 50 + 20 + 6 = 102', () => {
    expect(tile.height).toBe(102);
  });

  it('branchOffsets[0] = PARALLEL_X_MARGIN = 14', () => {
    expect(tile.branchOffsets[0]).toBe(PARALLEL_X_MARGIN);
  });
});

// `FtileForkInner`'s width is the SUM of decorated branch widths
// (`vcompact/FtileForkInner.java:90-113`); with zero branches that sum is
// 0 -- unlike the pre-apc-T4 model, which unconditionally added a
// two-sided overhang even with no branches to margin.
describe('GtileFork — zero branches (empty fork)', () => {
  const tile = new GtileFork([], bounder);

  it('width = 0 (sum of zero decorated branch widths)', () => {
    expect(tile.width).toBe(0);
  });

  it('height = BAR_HEIGHT + SPACE_AROUND_BLACK_BAR*2 + 0 + BAR_HEIGHT = 52', () => {
    // 6 + 40 + 0 + 6 = 52
    expect(tile.height).toBe(52);
  });

  it('branchOffsets is empty', () => {
    expect(tile.branchOffsets).toHaveLength(0);
  });

  it('branchTopYs is empty', () => {
    expect(tile.branchTopYs).toHaveLength(0);
  });
});

// The fork's join bar is an unconditional `FtileBlackBlock`
// (vertical/FtileBlackBlock.java:94, 5-arg ctor, outY=height), assembled
// with `appendBottom` (FtileAssemblySimple.java:120-130 ->
// FtileGeometryMerger.java:42-54, whose result takes the LOWER tile's --
// the bar's -- hasPointOut). Unlike ParallelBuilderSplit
// (vcompact/ParallelBuilderSplit.java:127-133, :150-151), ParallelBuilderFork
// never wraps its result in `FtileKilled`: every branch's own hasPointOut
// only gates whether THAT branch draws a `ConnectionOut`
// (ParallelBuilderFork.java:123-126), not whether the fork itself
// continues. So a fork's hasPointOut() is unconditionally `true`, even
// when every branch is detached -- this is a discovered divergence from
// decisions.md D5's "any branch has one" generalisation, filed for review.
describe('GtileFork — hasPointOut() is unconditionally true', () => {
  it('is true when every branch continues', () => {
    const tile = new GtileFork([stubTile(80, 60, true), stubTile(80, 80, true)], bounder);
    expect(tile.hasPointOut()).toBe(true);
  });

  it('is true when every branch is detached (no FtileKilled wrap for fork)', () => {
    const tile = new GtileFork([stubTile(80, 60, false), stubTile(80, 80, false)], bounder);
    expect(tile.hasPointOut()).toBe(true);
  });

  it('is true for an empty fork', () => {
    const tile = new GtileFork([], bounder);
    expect(tile.hasPointOut()).toBe(true);
  });
});

// GtileSplit passes THIN_SPLIT_HEIGHT (1.5) as the third constructor
// argument (`gtile-split.ts`); this exercises the parameter directly on
// GtileFork itself, without depending on the subclass.
describe('GtileFork — the third constructor argument overrides barHeight', () => {
  it('a custom barHeight replaces BAR_HEIGHT in barHeight/branchTopYs/height', () => {
    const b1 = stubTile(80, 60);
    const b2 = stubTile(80, 80);
    const tile = new GtileFork([b1, b2], bounder, 1.5);

    expect(tile.barHeight).toBe(1.5);
    expect(tile.branchTopYs[1]).toBe(1.5 + SPACE_AROUND_BLACK_BAR);
    expect(tile.branchTopYs[0]).toBe(1.5 + SPACE_AROUND_BLACK_BAR + 10);
    expect(tile.height).toBe(1.5 + SPACE_AROUND_BLACK_BAR * 2 + 80 + 1.5);
    // width/barWidth/branchOffsets are NOT barHeight-derived (D3, T4's job).
    expect(tile.width).toBe(216);
  });
});
