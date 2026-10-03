import { describe, expect, it } from 'vitest';
import { GtileDiamondSquare } from '../../../../src/diagrams/activity/tiles/gtile-diamond-square.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

const bounder: StringBounder = {
  getDimension: (text: string, _size: number) => ({ width: text.length * 7, height: 14 }),
};

const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

describe('GtileDiamondSquare — empty condition label', () => {
  // FtileDiamondSquare.java:116-117 -- same 24x24 special case as the
  // hexagon variant for an empty/zero-dimension label.
  const tile = new GtileDiamondSquare('', {}, bounder, theme);

  it('is a literal 24x24 square', () => {
    expect(tile.width).toBe(24);
    expect(tile.height).toBe(24);
  });
});

describe('GtileDiamondSquare — long condition label', () => {
  // 20 chars * 7 = 140; width = 140 + 24 = 164; height = 14 + 24 = 38.
  // NOT max(.,24) on either axis -- FtileDiamondSquare.java:120 pads BOTH
  // dimensions unconditionally, unlike GtileDiamondInside's width-only
  // atLeast(24,24).delta(24,0).
  const tile = new GtileDiamondSquare('X'.repeat(20), {}, bounder, theme);

  it('width = labelWidth + 24 (no atLeast floor)', () => {
    expect(tile.width).toBe(164);
  });

  it('height = labelHeight + 24 (no atLeast floor)', () => {
    expect(tile.height).toBe(38);
  });
});

describe('GtileDiamondSquare — total height does NOT include the north label', () => {
  // FtileDiamondSquare.java:109-112 never adds northHeight, unlike
  // FtileDiamondInside's calculateDimensionFtile (incHeight(northHeight)).
  // condition '' -> 24x24; north 'n' would be height 14 on the hexagon
  // variant's total, but here it must NOT move this.height at all.
  const tile = new GtileDiamondSquare('', { north: 'n' }, bounder, theme);

  it('height is the diamond-alone size, unmoved by the north label', () => {
    expect(tile.height).toBe(24);
  });

  it('SOUTH_HOOK.y is this SAME (diamond-alone) height', () => {
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 12, y: 24 });
  });

  it('NORTH_HOOK is unaffected by the north label', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 12, y: 0 });
  });

  it('EAST_HOOK/WEST_HOOK use the diamond-alone half-height', () => {
    expect(tile.getCoord(EAST_HOOK)).toEqual({ x: 24, y: 12 });
    expect(tile.getCoord(WEST_HOOK)).toEqual({ x: 0, y: 12 });
  });
});

describe('GtileDiamondSquare — west/east labelAt use DIFFERENT constants', () => {
  // hex '' -> 24x24. west 'yes' -> width 21, height 14. east 'no' -> width 14, height 14.
  // west: y = -height + HEXAGON_HALF_SIZE(12) = -14 + 12 = -2.
  // east: y = -height + HEXAGON_HALF_SIZE(12) + 5 = -14 + 17 = 3.
  // FtileDiamondSquare.java:101,104 -- east gets the SAME constant plus an
  // extra +5 that west never gets (an upstream asymmetry, not a slip).
  const tile = new GtileDiamondSquare('', { west: 'yes', east: 'no' }, bounder, theme);

  it('west label sits left of the square, offset by the FIXED hexagonHalfSize', () => {
    expect(tile.labelAt('west')).toEqual({ x: -21, y: -2, width: 21, height: 14, label: 'yes' });
  });

  it('east label sits right of the square, offset by hexagonHalfSize + 5', () => {
    expect(tile.labelAt('east')).toEqual({ x: 24, y: 3, width: 14, height: 14, label: 'no' });
  });

  it('north/south labelAt is null when unset', () => {
    expect(tile.labelAt('north')).toBeNull();
    expect(tile.labelAt('south')).toBeNull();
  });
});

describe('GtileDiamondSquare — north and south share the same anchor', () => {
  // @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondSquare.java:93-94
  const tile = new GtileDiamondSquare('', { north: 'n', south: 's' }, bounder, theme);

  it('both draw at (4 + w/2, height)', () => {
    const north = tile.labelAt('north')!;
    const south = tile.labelAt('south')!;
    expect(north.x).toBe(16);
    expect(north.y).toBe(24);
    expect(south.x).toBe(north.x);
    expect(south.y).toBe(north.y);
  });
});

describe('GtileDiamondSquare — swapEastWest and hasPointOut', () => {
  it('swaps the west/east label slots in place', () => {
    const tile = new GtileDiamondSquare('', { west: 'yes', east: 'no' }, bounder, theme);
    tile.swapEastWest();
    expect(tile.labelAt('west')!.label).toBe('no');
    expect(tile.labelAt('east')!.label).toBe('yes');
  });

  it('hasPointOut is always true', () => {
    expect(new GtileDiamondSquare('', {}, bounder, theme).hasPointOut()).toBe(true);
  });
});
