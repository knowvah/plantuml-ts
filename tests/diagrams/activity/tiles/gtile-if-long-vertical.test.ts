import { describe, expect, it } from 'vitest';
import { GtileIfLongVertical } from '../../../../src/diagrams/activity/tiles/gtile-if-long-vertical.js';
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

describe('GtileIfLongVertical — two branches, both with a point out', () => {
  // Both diamonds: condition '' -> hexAlone 24x24, left=12; `east` never
  // affects hexWidth/height/left/width (only `labelAt('east')`).
  const d0 = new GtileDiamondInside2('', {}, bounder, theme);
  const d1 = new GtileDiamondInside2('', { east: 'no' }, bounder, theme);
  const tile0 = stubTile(40, 20);
  const tile1 = stubTile(40, 20);
  const tile2 = stubTile(40, 20);
  const tile = new GtileIfLongVertical([d0, d1], [tile0, tile1], tile2, undefined);

  // diamondsWidth=24; tilesOuterWidth=[50,50], col2=50; widthBase=74.
  // branchColumnHeight = 30 + (24+20) + (24+20) = 118.
  // tile2Pad: outer=max(40,30)=40, contentDx=0, paddedLeft=20 (stub's own
  // NORTH_HOOK x, width/2).
  // left0=37; leftMerged=max(37,20)=37; dx1=0,dx2=17;
  // widthMerged=max(74,40+17)=74. heightMerged=118+20=138.
  // height=138+20*2+40+24=242.
  it('width === 74, height === 242, left === 37', () => {
    expect(tile.width).toBe(74);
    expect(tile.height).toBe(242);
    expect(tile.left).toBe(37);
  });

  it('branch 0: diamondX=0, diamondY=30, tileX=34, tileY=54', () => {
    const b = tile.branches[0]!;
    expect(b.diamondX).toBe(0);
    expect(b.diamondY).toBe(30);
    expect(b.tileX).toBe(34);
    expect(b.tileY).toBe(54);
  });

  it('branch 1: diamondY=94 (30 + 20 + 24 + 20), tileY=118 (94 + 24)', () => {
    const b = tile.branches[1]!;
    expect(b.diamondY).toBe(94);
    expect(b.tileY).toBe(118);
  });

  it('tile2 at x=17 ((74-40)/2 + 0), y=158 (translateDy(2))', () => {
    expect(tile.tile2X).toBe(17);
    expect(tile.tile2Y).toBe(158);
  });

  it('lastDiamond at x=25 ((74-24)/2), y=218 (242-24), size 24', () => {
    expect(tile.lastDiamondX).toBe(25);
    expect(tile.lastDiamondY).toBe(218);
    expect(tile.lastDiamondSize).toBe(24);
  });

  it('both branches have a point out; hasPointOut() is true', () => {
    expect(tile.branches[0]!.hasPointOut).toBe(true);
    expect(tile.branches[1]!.hasPointOut).toBe(true);
    expect(tile.hasPointOut()).toBe(true);
  });

  it('getCoord reports the composite left/height, not diamond-local values', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 37, y: 0 });
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 37, y: 242 });
  });

  it('children is [tiles..., tile2] -- matches FtileIfLongVertical#getMyChildren, EXCLUDING diamonds/lastDiamond', () => {
    expect(tile.children).toEqual([tile0, tile1, tile2]);
  });

  it('elseLabel defaults to undefined when not passed', () => {
    expect(tile.elseLabel).toBeUndefined();
  });
});

describe('GtileIfLongVertical — elseLabel is threaded onto the tile', () => {
  it('carries the constructor-supplied label verbatim', () => {
    const d0 = new GtileDiamondInside2('', {}, bounder, theme);
    const tile0 = stubTile(40, 20);
    const tile2 = stubTile(40, 20);
    const tile = new GtileIfLongVertical([d0], [tile0], tile2, 'otherwise');
    expect(tile.elseLabel).toBe('otherwise');
  });
});

describe('GtileIfLongVertical — a branch with no point out is excluded from hasPointOut()', () => {
  const d0 = new GtileDiamondInside2('', {}, bounder, theme);
  const d1 = new GtileDiamondInside2('', {}, bounder, theme);
  const stopTile = stubTile(30, 10, false);
  const tile1 = stubTile(40, 20);
  const tile2 = stubTile(40, 20, false);
  const tile = new GtileIfLongVertical([d0, d1], [stopTile, tile1], tile2, undefined);

  it('branches[0].hasPointOut is false', () => {
    expect(tile.branches[0]!.hasPointOut).toBe(false);
  });

  it('hasPointOut() is true (branch 1 still has one, even though tile2 does not)', () => {
    expect(tile.hasPointOut()).toBe(true);
  });

  it('hasPointOut() is false when every branch and tile2 have none', () => {
    const allStopped = new GtileIfLongVertical(
      [d0, d1],
      [stubTile(30, 10, false), stubTile(30, 10, false)],
      stubTile(40, 20, false),
      undefined,
    );
    expect(allStopped.hasPointOut()).toBe(false);
  });
});

describe('GtileIfLongVertical — mismatched diamonds/tiles length throws', () => {
  it('throws when diamonds.length !== tiles.length', () => {
    const d0 = new GtileDiamondInside2('', {}, bounder, theme);
    const tile2 = stubTile(10, 10);
    expect(() => new GtileIfLongVertical([d0], [], tile2, undefined)).toThrow();
  });
});
