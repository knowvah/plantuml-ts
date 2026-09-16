import { describe, expect, it } from 'vitest';
import { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

const bounder: StringBounder = {
  getDimension: (text: string, _size: number) => ({ width: text.length * 7, height: 14 }),
};

const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

describe('GtileDiamondInside — empty condition label', () => {
  // FtileDiamondInside.java:106-116 -- special-cased to a literal 24x24,
  // NOT atLeast(24,24).delta(24,0) (which would give 24+24=48 wide).
  const tile = new GtileDiamondInside('', {}, bounder, theme);

  it('is a literal 24x24 hexagon', () => {
    expect(tile.width).toBe(24);
    expect(tile.height).toBe(24);
  });
});

describe('GtileDiamondInside — long condition label', () => {
  // 20 chars * 7 = 140; width = max(140,24)+24 = 164; height = max(14,24) = 24.
  const tile = new GtileDiamondInside('X'.repeat(20), {}, bounder, theme);

  it('width = max(labelWidth, 24) + 24', () => {
    expect(tile.width).toBe(164);
  });

  it('height = max(labelHeight, 24)', () => {
    expect(tile.height).toBe(24);
  });
});

describe('GtileDiamondInside — total height includes the north label, hooks do not', () => {
  // condition '' -> hexAlone 24x24; north 'n' -> height 14 (mock is constant).
  const tile = new GtileDiamondInside('', { north: 'n' }, bounder, theme);

  it('total height is hexAlone + northHeight', () => {
    expect(tile.height).toBe(38);
  });

  it('SOUTH_HOOK.y is the hexagon-alone height, not the total height', () => {
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 12, y: 24 });
  });

  it('NORTH_HOOK is unaffected by the north label', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 12, y: 0 });
  });

  it('EAST_HOOK/WEST_HOOK use the hexagon-alone half-height', () => {
    expect(tile.getCoord(EAST_HOOK)).toEqual({ x: 24, y: 12 });
    expect(tile.getCoord(WEST_HOOK)).toEqual({ x: 0, y: 12 });
  });
});

describe('GtileDiamondInside — west/east labelAt', () => {
  // hex '' -> 24x24. west 'yes' -> width 21, height 14. east 'no' -> width 14, height 14.
  const tile = new GtileDiamondInside('', { west: 'yes', east: 'no' }, bounder, theme);

  it('west label sits left of the hexagon, vertically centred', () => {
    expect(tile.labelAt('west')).toEqual({ x: -21, y: -2, width: 21, height: 14, label: 'yes' });
  });

  it('east label sits right of the hexagon, vertically centred', () => {
    expect(tile.labelAt('east')).toEqual({ x: 24, y: -2, width: 14, height: 14, label: 'no' });
  });

  it('north/south labelAt is null when unset', () => {
    expect(tile.labelAt('north')).toBeNull();
    expect(tile.labelAt('south')).toBeNull();
  });
});

describe('GtileDiamondInside — north and south share the same anchor', () => {
  // @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:91-92
  const tile = new GtileDiamondInside('', { north: 'n', south: 's' }, bounder, theme);

  it('both draw at (4 + w/2, hexHeight)', () => {
    const north = tile.labelAt('north')!;
    const south = tile.labelAt('south')!;
    expect(north.x).toBe(16);
    expect(north.y).toBe(24);
    expect(south.x).toBe(north.x);
    expect(south.y).toBe(north.y);
  });
});

describe('GtileDiamondInside — swapEastWest', () => {
  it('swaps the west/east label slots in place', () => {
    const tile = new GtileDiamondInside('', { west: 'yes', east: 'no' }, bounder, theme);
    tile.swapEastWest();
    expect(tile.labelAt('west')!.label).toBe('no');
    expect(tile.labelAt('east')!.label).toBe('yes');
  });
});

describe('GtileDiamondInside — hasPointOut()', () => {
  it('is true (4-arg FtileGeometry ctor with a real outY)', () => {
    expect(new GtileDiamondInside('c', {}, bounder, theme).hasPointOut()).toBe(true);
  });
});
