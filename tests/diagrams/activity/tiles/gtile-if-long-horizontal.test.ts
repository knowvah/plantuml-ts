import { describe, expect, it } from 'vitest';
import { GtileIfLongHorizontal } from '../../../../src/diagrams/activity/tiles/gtile-if-long-horizontal.js';
import { GtileDiamondInside2 } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside2.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

const bounder: StringBounder = {
  getDimension: (text: string, _size: number) => ({ width: text.length * 7, height: 14 }),
};
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

function stubTile(width: number, height: number, hasPointOut = true): Tile {
  return {
    kind: 'stub',
    width,
    height,
    getCoord: (hook) =>
      hook === NORTH_HOOK || hook === SOUTH_HOOK
        ? { x: width / 2, y: hook === NORTH_HOOK ? 0 : height }
        : { x: 0, y: 0 },
    hasPointOut: () => hasPointOut,
  };
}

/** A branch/`tile2` whose own reported `left` differs from `width / 2` --
 *  stands in for a nested `if`/`GtileTopDown` merged subtree (T6c). */
function stubTileAsym(width: number, height: number, left: number, hasPointOut = true): Tile {
  return {
    kind: 'stub-asym',
    width,
    height,
    getCoord: (hook) =>
      hook === NORTH_HOOK || hook === SOUTH_HOOK ? { x: left, y: hook === NORTH_HOOK ? 0 : height } : { x: 0, y: 0 },
    hasPointOut: () => hasPointOut,
  };
}

describe('GtileIfLongHorizontal — two equal-height branches, both with a point out', () => {
  // Both diamonds: condition '' -> hexAlone 24x24, left=12; no north label ->
  // width/height stay 24x24 -> alignDiamonds' maxOutY=24, topMargin=0 for
  // both, alignedHeight = 24+0+20 = 44.
  const d0 = new GtileDiamondInside2('', {}, bounder, theme);
  const d1 = new GtileDiamondInside2('', { east: 'no' }, bounder, theme);
  const tile0 = stubTile(40, 20);
  const tile1 = stubTile(40, 20);
  const tile2 = stubTile(40, 20);
  const tile = new GtileIfLongHorizontal([d0, d1], [tile0, tile1], tile2, [0, 0]);

  // Per branch: tilePad outer=max(40,30)=40; assemblyLeft=max(12,20)=20;
  // assemblyWidth=max(24+8,40+0)=40; coupleWidth=40, coupleLeft=20.
  // coupleAbsX: [0, 40+20=60]. overall.width = 40+40+40(tile2)+20*2 = 160.
  // maxCoupleHeight = alignedHeight(44)+tile.height(20) = 64;
  // tile2 term = 20 + diamondsH(44)/2 = 42; height = max(64,42)+max(100,24) = 164.
  it('width === 160, height === 164, left === 80', () => {
    expect(tile.width).toBe(160);
    expect(tile.height).toBe(164);
    expect(tile.left).toBe(80);
  });

  it('branch 0: diamondX=8, diamondY=25, tileX=0, tileY=69', () => {
    const b = tile.branches[0]!;
    expect(b.diamondX).toBe(8);
    expect(b.diamondY).toBe(25);
    expect(b.tileX).toBe(0);
    expect(b.tileY).toBe(69);
  });

  it('branch 1: diamondX=68 (couple x 60 + 8), tileX=60', () => {
    const b = tile.branches[1]!;
    expect(b.diamondX).toBe(68);
    expect(b.tileX).toBe(60);
  });

  it('tile2 at x=120 (W - outer 40), y=72 ((164-20)/2)', () => {
    expect(tile.tile2X).toBe(120);
    expect(tile.tile2Y).toBe(72);
  });

  it('nbOut === 2 (both branches have a point out); hasPointOut() is true', () => {
    expect(tile.nbOut).toBe(2);
    expect(tile.hasPointOut()).toBe(true);
  });

  it('getCoord reports the composite left, not width/2 coincidentally equal here', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 80, y: 0 });
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 80, y: 164 });
  });
});

describe('GtileIfLongHorizontal — branch 0"s tile is asymmetric (nested if, left != width/2)', () => {
  // Same base geometry as the first describe block, but tile0's own left
  // is 30 (not 20=width/2). tilePad: outer=max(40,30)=40, contentDx=0,
  // paddedLeft = tile0.left(30) + 0 = 30 (`FtileMinWidthCentered.java:
  // 99-106` -- NOT outer/2=20). assemblyLeft = max(diamond.left(12),
  // tileLeft(30)) = 30; assemblyWidth = max(24+18, 40+0) = 42.
  // diamondLocalX = 30-12 = 18; tileLocalX = (30-30)+0 = 0.
  const d0 = new GtileDiamondInside2('', {}, bounder, theme);
  const d1 = new GtileDiamondInside2('', {}, bounder, theme);
  const tile0 = stubTileAsym(40, 20, 30);
  const tile1 = stubTile(40, 20);
  const tile2 = stubTile(40, 20);
  const tile = new GtileIfLongHorizontal([d0, d1], [tile0, tile1], tile2, [0, 0]);

  it('branch 0"s couple: coupleWidth === 42, coupleLeft === 30 (not 20, the symmetric value)', () => {
    expect(tile.branches[0]!.coupleWidth).toBe(42);
    expect(tile.branches[0]!.coupleLeft).toBe(30);
  });

  it('branch 0: diamondX === 18 (not 8), tileX === 0', () => {
    expect(tile.branches[0]!.diamondX).toBe(18);
    expect(tile.branches[0]!.tileX).toBe(0);
  });

  it('ConnectionVerticalIn is a single vertical segment: diamond0"s out-x and tile0"s own real in-x match', () => {
    // `walk-if-long-horizontal.ts#connectionVerticalIn`: p1.x =
    // diamondX + diamond.left; p2.x = tileX + tile.getCoord(NORTH_HOOK).x.
    const p1x = tile.branches[0]!.diamondX + d0.left;
    const p2x = tile.branches[0]!.tileX + tile0.getCoord(NORTH_HOOK).x;
    expect(p1x).toBe(30);
    expect(p2x).toBe(30);
    expect(p1x).toBe(p2x);
  });
});

describe('GtileIfLongHorizontal — tile2 is asymmetric (nested if, left != width/2)', () => {
  // Branches symmetric (same as the baseline block) -- only tile2's own
  // left differs (33, not 20=width/2). tile2Pad: outer=40, contentDx=0,
  // paddedLeft = 33 + 0 = 33 (not outer/2=20).
  const d0 = new GtileDiamondInside2('', {}, bounder, theme);
  const d1 = new GtileDiamondInside2('', { east: 'no' }, bounder, theme);
  const tile0 = stubTile(40, 20);
  const tile1 = stubTile(40, 20);
  const tile2 = stubTileAsym(40, 20, 33);
  const tile = new GtileIfLongHorizontal([d0, d1], [tile0, tile1], tile2, [0, 0]);

  it('width/height/tile2X/tile2Y unaffected (outer, not left, drives them) -- same as the symmetric baseline', () => {
    expect(tile.width).toBe(160);
    expect(tile.height).toBe(164);
    expect(tile.tile2X).toBe(120);
    expect(tile.tile2Y).toBe(72);
  });

  it('tile2Left === 33 (not 20, the symmetric value)', () => {
    expect(tile.tile2Left).toBe(33);
  });

  it('hlineOutXs"s tile2 contribution (tile2X + tile2Left) matches tile2"s own real absolute hook', () => {
    // `walk-if-long-horizontal.ts#hlineOutXs`/`tile2Origin`: the Hline's
    // rightmost extent must land where tile2 actually draws, not at an
    // assumed centre.
    const hlineX = tile.tile2X + tile.tile2Left;
    const realHookX = tile.tile2X + tile.tile2ContentDx + tile2.getCoord(NORTH_HOOK).x;
    expect(hlineX).toBe(153);
    expect(hlineX).toBe(realHookX);
  });
});

describe('GtileIfLongHorizontal — alignDiamonds equalises unequal hexagon heights', () => {
  // A bounder whose height scales with label length lets the two diamonds
  // get genuinely different hexHeight values (24 vs 30).
  const tallBounder: StringBounder = {
    getDimension: (text: string) => ({ width: text.length * 7, height: text.length > 3 ? 30 : 14 }),
  };
  const short = new GtileDiamondInside2('c', {}, tallBounder, theme); // hexHeight 24
  const tall = new GtileDiamondInside2('cccccc', {}, tallBounder, theme); // hexHeight 30
  const tile0 = stubTile(40, 20);
  const tile1 = stubTile(40, 20);
  const tile2 = stubTile(40, 20);
  const tile = new GtileIfLongHorizontal([short, tall], [tile0, tile1], tile2, [0, 0]);

  // maxOutY=30; short.topMargin=(30-24)/2=3, tall.topMargin=0.
  it('the shorter hexagon gets a nonzero top margin (its own diamondY shifts down)', () => {
    expect(tile.branches[0]!.diamondY).toBe(28); // 25 + 3
    expect(tile.branches[1]!.diamondY).toBe(25); // 25 + 0
  });
});

describe('GtileIfLongHorizontal — a branch with no point out skips ConnectionVerticalOut', () => {
  const d0 = new GtileDiamondInside2('', {}, bounder, theme);
  const d1 = new GtileDiamondInside2('', {}, bounder, theme);
  const stopTile = stubTile(30, 10, false);
  const tile1 = stubTile(40, 20);
  const tile2 = stubTile(40, 20, false);
  const tile = new GtileIfLongHorizontal([d0, d1], [stopTile, tile1], tile2, [0, 0]);

  it('branches[0].hasPointOut is false', () => {
    expect(tile.branches[0]!.hasPointOut).toBe(false);
  });

  it('nbOut counts only the branches that do have one', () => {
    expect(tile.nbOut).toBe(1);
  });

  it('hasPointOut() is true (branch 1 still has one, even though tile2 does not)', () => {
    expect(tile.hasPointOut()).toBe(true);
  });
});

describe('GtileIfLongHorizontal — mismatched diamonds/tiles length throws', () => {
  it('throws when diamonds.length !== tiles.length', () => {
    const d0 = new GtileDiamondInside2('', {}, bounder, theme);
    const tile2 = stubTile(10, 10);
    expect(() => new GtileIfLongHorizontal([d0], [], tile2, [])).toThrow();
  });
});
