import { describe, expect, it } from 'vitest';
import { GtileDiamondEmpty } from '../../../../src/diagrams/activity/tiles/gtile-diamond-empty.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

const bounder: StringBounder = {
  getDimension: (text: string, _size: number) => ({ width: text.length * 7, height: 14 }),
};

const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

describe('GtileDiamondEmpty — blank condition, no labels', () => {
  // FtileDiamond.java:109-111 -- suppY1 = north.height = 0 -> dim = (24,24).
  const tile = new GtileDiamondEmpty('', {}, bounder, theme);

  it('is a fixed 24x24 box', () => {
    expect(tile.width).toBe(24);
    expect(tile.height).toBe(24);
  });

  it('own label is always empty', () => {
    expect(tile.label).toBe('');
  });

  it('NORTH_HOOK/SOUTH_HOOK sit at the diamond-alone top/bottom (inY=0)', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 12, y: 0 });
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 12, y: 24 });
  });

  it('EAST_HOOK/WEST_HOOK sit at the diamond-alone mid-height', () => {
    expect(tile.getCoord(EAST_HOOK)).toEqual({ x: 24, y: 12 });
    expect(tile.getCoord(WEST_HOOK)).toEqual({ x: 0, y: 12 });
  });

  it('every labelAt side is null when unset', () => {
    expect(tile.labelAt('north')).toBeNull();
    expect(tile.labelAt('south')).toBeNull();
    expect(tile.labelAt('west')).toBeNull();
    expect(tile.labelAt('east')).toBeNull();
  });

  it('hasPointOut is always true', () => {
    expect(tile.hasPointOut()).toBe(true);
  });
});

describe('GtileDiamondEmpty — a non-blank testLabel grows height and shifts inY (while/if)', () => {
  // testLabel 'cond' (4 chars -> width 28, height 14) -> north reserve 14.
  // FtileWhile.java:138/ConditionalBuilder.java:261,264 -- test text always
  // routes to NORTH, south/west from `labels` (yes/out or tb1/tb2).
  const tile = new GtileDiamondEmpty('cond', { south: 'yes', west: 'out' }, bounder, theme);

  it('height = 24 + north.height; width stays fixed at 24', () => {
    expect(tile.width).toBe(24);
    expect(tile.height).toBe(38);
  });

  it('NORTH_HOOK.y is the north reserve (inY); SOUTH_HOOK.y is the full height', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 12, y: 14 });
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 12, y: 38 });
  });

  it('EAST_HOOK/WEST_HOOK sit at inY + hexagonHalfSize, not the fixed 12', () => {
    expect(tile.getCoord(EAST_HOOK)).toEqual({ x: 24, y: 26 });
    expect(tile.getCoord(WEST_HOOK)).toEqual({ x: 0, y: 26 });
  });

  it('north label draws at (18, 0) -- a DIFFERENT x than GtileDiamondInside/Square (16)', () => {
    expect(tile.labelAt('north')).toEqual({ x: 18, y: 0, width: 28, height: 14, label: 'cond' });
  });

  it('south label draws at (18, height) -- the SAME x as north', () => {
    expect(tile.labelAt('south')).toEqual({ x: 18, y: 38, width: 21, height: 14, label: 'yes' });
  });

  it('west label offsets by inY - height + hexagonHalfSize', () => {
    expect(tile.labelAt('west')).toEqual({ x: -21, y: 12, width: 21, height: 14, label: 'out' });
  });

  it('east labelAt is null when unset', () => {
    expect(tile.labelAt('east')).toBeNull();
  });
});

describe('GtileDiamondEmpty — repeat usage: blank testLabel, condition on east', () => {
  // FtileRepeat.java:157-158 -- EMPTY_DIAMOND diamond2 is `.withEast(tbTest)`
  // ONLY; testLabel is always '' here (tbTest goes through `labels.east`,
  // not the diamond-bucket testLabel slot -- gtile-repeat.ts's own caller).
  const tile = new GtileDiamondEmpty('', { east: 'E' }, bounder, theme);

  it('stays 24x24 (east never widens it, same as FtileDiamond.java)', () => {
    expect(tile.width).toBe(24);
    expect(tile.height).toBe(24);
  });

  it('east label offsets by -height + hexagonHalfSize, inY=0', () => {
    expect(tile.labelAt('east')).toEqual({ x: 24, y: -2, width: 7, height: 14, label: 'E' });
  });
});

describe('GtileDiamondEmpty — a very long side label never widens the box', () => {
  // FtileDiamond.java:108-112 never reads west/east/south when sizing --
  // a preserved overflow quirk, same pattern as GtileDiamondSquare's own
  // north/south overflow.
  const tile = new GtileDiamondEmpty('X'.repeat(30), { south: 'Y'.repeat(30) }, bounder, theme);

  it('width is still exactly 24', () => {
    expect(tile.width).toBe(24);
  });
});

describe('GtileDiamondEmpty — swapEastWest', () => {
  it('swaps the west/east label slots in place', () => {
    const tile = new GtileDiamondEmpty('', { west: 'yes', east: 'no' }, bounder, theme);
    tile.swapEastWest();
    expect(tile.labelAt('west')!.label).toBe('no');
    expect(tile.labelAt('east')!.label).toBe('yes');
  });
});
