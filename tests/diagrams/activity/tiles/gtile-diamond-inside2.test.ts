import { describe, expect, it } from 'vitest';
import { GtileDiamondInside2 } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside2.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

const bounder: StringBounder = {
  getDimension: (text: string, _size: number) => ({ width: text.length * 7, height: 14 }),
};

const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

describe('GtileDiamondInside2 — empty condition label', () => {
  // FtileDiamondInside2.java:104-113 -- calculateDimensionAlone, same
  // literal 24x24 special-case as GtileDiamondInside.
  const tile = new GtileDiamondInside2('', {}, bounder, theme);

  it('hexWidth/hexHeight are a literal 24x24', () => {
    expect(tile.hexWidth).toBe(24);
    expect(tile.hexHeight).toBe(24);
  });

  it('width/height equal the hex-alone dims when no north label', () => {
    expect(tile.width).toBe(24);
    expect(tile.height).toBe(24);
  });

  it('left is hexWidth/2', () => {
    expect(tile.left).toBe(12);
  });
});

describe('GtileDiamondInside2 — long condition label', () => {
  // 20 chars * 7 = 140; hexWidth = max(140,24)+24 = 164; hexHeight = 24.
  const tile = new GtileDiamondInside2('X'.repeat(20), {}, bounder, theme);

  it('hexWidth = max(labelWidth, 24) + 24', () => {
    expect(tile.hexWidth).toBe(164);
  });
});

describe('GtileDiamondInside2 — north label narrower than left: widens height only', () => {
  // condition '' -> hexAlone 24x24, left=12; north 'n' -> width 7 (<=12).
  const tile = new GtileDiamondInside2('', { north: 'n' }, bounder, theme);

  it('width stays the hex-alone width (north does not widen it)', () => {
    expect(tile.width).toBe(24);
  });

  it('height = hexHeight + north.height', () => {
    expect(tile.height).toBe(38);
  });

  it('SOUTH_HOOK.y is the hex-alone height, not the total height', () => {
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 12, y: 24 });
  });

  it('NORTH_HOOK is unaffected by the north label', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 12, y: 0 });
  });
});

describe('GtileDiamondInside2 — north label wider than left: widens the tile only, never the hexagon', () => {
  // condition '' -> hexAlone 24x24, left=12; north 10 chars * 7 = 70 (>12).
  const tile = new GtileDiamondInside2('', { north: 'X'.repeat(10) }, bounder, theme);

  it('width = left + north.width (FtileDiamondInside2.java:119-121)', () => {
    expect(tile.width).toBe(12 + 70);
  });

  it('hexWidth/hexHeight (the drawn hexagon) are unaffected', () => {
    expect(tile.hexWidth).toBe(24);
    expect(tile.hexHeight).toBe(24);
  });

  it('EAST_HOOK uses the full (north-widened) width', () => {
    expect(tile.getCoord(EAST_HOOK)).toEqual({ x: 82, y: 12 });
  });

  it('WEST_HOOK is unaffected', () => {
    expect(tile.getCoord(WEST_HOOK)).toEqual({ x: 0, y: 12 });
  });
});

describe('GtileDiamondInside2 — labelAt: north renders at the SAME point south would (quirk 2)', () => {
  // Verified against FtileDiamondInside2.java:86-87: north.drawU and
  // south.drawU both translate to (4 + hexWidth/2, hexHeight) -- the
  // hexagon's own BOTTOM edge, so a `.withNorth()` label always renders
  // BELOW the hexagon. Confirmed on lifeve-53-zubi598's golden: "Yes" at
  // y=87.556, under a hexagon ending at y=79 (aitp-T1.md Q1).
  const tile = new GtileDiamondInside2('', { north: 'n' }, bounder, theme);

  it('north labelAt sits at (4+left, hexHeight)', () => {
    expect(tile.labelAt('north')).toEqual({ x: 16, y: 24, width: 7, height: 14, label: 'n' });
  });
});

describe('GtileDiamondInside2 — west/east labelAt: west sets west, east sets east (no swap)', () => {
  // Corrects the batch-4 overview's "quirk 1" (east/west field swap)
  // claim: a full trace of FtileDiamondInside2's private constructor
  // (:74-77) composed with FtileDiamondWIP's own (`vertical/
  // FtileDiamondWIP.java:91-99`) shows the two differently-ordered
  // parameter lists cancel out -- `.withWest(x)` sets `this.west`,
  // `.withEast(x)` sets `this.east`, exactly as the method names say.
  // Mission decision-journal, T5.
  const tile = new GtileDiamondInside2('', { west: 'w', east: 'ee' }, bounder, theme);

  it('west labelAt is drawn to the geometric WEST (negative x)', () => {
    expect(tile.labelAt('west')).toEqual({ x: -7, y: 12 - 14, width: 7, height: 14, label: 'w' });
  });

  it('east labelAt is drawn to the geometric EAST, at the HEX-ALONE width', () => {
    expect(tile.labelAt('east')).toEqual({ x: 24, y: 12 - 14, width: 14, height: 14, label: 'ee' });
  });

  it('an unset label side returns null', () => {
    const bare = new GtileDiamondInside2('', {}, bounder, theme);
    expect(bare.labelAt('north')).toBeNull();
    expect(bare.labelAt('west')).toBeNull();
    expect(bare.labelAt('east')).toBeNull();
  });
});

describe('GtileDiamondInside2 — hasPointOut', () => {
  it('is always true (built with a real outY)', () => {
    const tile = new GtileDiamondInside2('c', {}, bounder, theme);
    expect(tile.hasPointOut()).toBe(true);
  });
});
