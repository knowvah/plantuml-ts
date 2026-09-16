import { describe, expect, it } from 'vitest';
import { GtileRepeatEntry } from '../../../../src/diagrams/activity/tiles/gtile-repeat-entry.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';

// FtileDiamond.java:108-112 -- `calculateDimensionFtile` with every label
// slot empty (`suppY1 = 0`): `dim = (24, 24)`, `left = 12`, `inY = 0`,
// `outY = 24`. Hexagon.java:46 -- `hexagonHalfSize = 12`.
describe('GtileRepeatEntry', () => {
  const tile = new GtileRepeatEntry();

  it('kind === "gtile-repeat-entry"', () => {
    expect(tile.kind).toBe('gtile-repeat-entry');
  });

  it('width === 24', () => {
    expect(tile.width).toBe(24);
  });

  it('height === 24', () => {
    expect(tile.height).toBe(24);
  });

  it('NORTH_HOOK === (12, 0)', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 12, y: 0 });
  });

  it('SOUTH_HOOK === (12, 24)', () => {
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 12, y: 24 });
  });

  it('EAST_HOOK === (24, 12)', () => {
    expect(tile.getCoord(EAST_HOOK)).toEqual({ x: 24, y: 12 });
  });

  it('WEST_HOOK === (0, 12)', () => {
    expect(tile.getCoord(WEST_HOOK)).toEqual({ x: 0, y: 12 });
  });

  it('hasPointOut() === true', () => {
    expect(tile.hasPointOut()).toBe(true);
  });

  it('swimlane is unset until withSwimlane assigns it (tile-layout.ts#tileRepeatEntry)', () => {
    expect(tile.swimlane).toBeUndefined();
  });
});
