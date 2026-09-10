import { describe, expect, it } from 'vitest';
import { GtileBreak } from '../../../../src/diagrams/activity/tiles/gtile-break.js';
import { GtileEnd } from '../../../../src/diagrams/activity/tiles/gtile-end.js';
import { GtileKill } from '../../../../src/diagrams/activity/tiles/gtile-kill.js';
import { GtileStart } from '../../../../src/diagrams/activity/tiles/gtile-start.js';
import { GtileStop } from '../../../../src/diagrams/activity/tiles/gtile-stop.js';
import {
  EAST_HOOK,
  NORTH_BORDER,
  NORTH_HOOK,
  SOUTH_BORDER,
  SOUTH_HOOK,
  WEST_HOOK,
} from '../../../../src/diagrams/activity/tiles/points.js';

describe('GtileStart', () => {
  const tile = new GtileStart();

  it('has width = 20', () => {
    expect(tile.width).toBe(20);
  });

  it('has height = 20', () => {
    expect(tile.height).toBe(20);
  });

  it('NORTH_HOOK → { x: 10, y: 0 }', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 10, y: 0 });
  });

  it('SOUTH_HOOK → { x: 10, y: 20 }', () => {
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 10, y: 20 });
  });

  it('EAST_HOOK → { x: 20, y: 10 }', () => {
    expect(tile.getCoord(EAST_HOOK)).toEqual({ x: 20, y: 10 });
  });

  it('WEST_HOOK → { x: 0, y: 10 }', () => {
    expect(tile.getCoord(WEST_HOOK)).toEqual({ x: 0, y: 10 });
  });

  it('NORTH_BORDER → same as NORTH_HOOK', () => {
    expect(tile.getCoord(NORTH_BORDER)).toEqual({ x: 10, y: 0 });
  });

  it('SOUTH_BORDER → same as SOUTH_HOOK', () => {
    expect(tile.getCoord(SOUTH_BORDER)).toEqual({ x: 10, y: 20 });
  });

  it('hasPointOut() === true (FtileCircleStart.java:91, 5-arg ctor)', () => {
    expect(tile.hasPointOut()).toBe(true);
  });
});

describe('GtileStop', () => {
  const tile = new GtileStop();

  it('has width = 28', () => {
    expect(tile.width).toBe(28);
  });

  it('has height = 28', () => {
    expect(tile.height).toBe(28);
  });

  it('NORTH_HOOK → { x: 14, y: 0 }', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 14, y: 0 });
  });

  it('SOUTH_HOOK → { x: 14, y: 28 }', () => {
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 14, y: 28 });
  });

  it('EAST_HOOK → { x: 28, y: 14 }', () => {
    expect(tile.getCoord(EAST_HOOK)).toEqual({ x: 28, y: 14 });
  });

  it('WEST_HOOK → { x: 0, y: 14 }', () => {
    expect(tile.getCoord(WEST_HOOK)).toEqual({ x: 0, y: 14 });
  });

  it('NORTH_BORDER → same as NORTH_HOOK', () => {
    expect(tile.getCoord(NORTH_BORDER)).toEqual({ x: 14, y: 0 });
  });

  it('SOUTH_BORDER → same as SOUTH_HOOK', () => {
    expect(tile.getCoord(SOUTH_BORDER)).toEqual({ x: 14, y: 28 });
  });

  it('hasPointOut() === false (FtileCircleStop.java:93, 4-arg ctor); also what detach builds', () => {
    expect(tile.hasPointOut()).toBe(false);
  });
});

describe('GtileEnd', () => {
  const tile = new GtileEnd();

  it('has width = 28', () => {
    expect(tile.width).toBe(28);
  });

  it('has height = 28', () => {
    expect(tile.height).toBe(28);
  });

  it('NORTH_HOOK → { x: 14, y: 0 }', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 14, y: 0 });
  });

  it('SOUTH_HOOK → { x: 14, y: 28 }', () => {
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 14, y: 28 });
  });

  it('EAST_HOOK → { x: 28, y: 14 }', () => {
    expect(tile.getCoord(EAST_HOOK)).toEqual({ x: 28, y: 14 });
  });

  it('WEST_HOOK → { x: 0, y: 14 }', () => {
    expect(tile.getCoord(WEST_HOOK)).toEqual({ x: 0, y: 14 });
  });

  it('NORTH_BORDER → same as NORTH_HOOK', () => {
    expect(tile.getCoord(NORTH_BORDER)).toEqual({ x: 14, y: 0 });
  });

  it('SOUTH_BORDER → same as SOUTH_HOOK', () => {
    expect(tile.getCoord(SOUTH_BORDER)).toEqual({ x: 14, y: 28 });
  });

  it('hasPointOut() === false (FtileCircleEndCross.java:121, 4-arg ctor)', () => {
    expect(tile.hasPointOut()).toBe(false);
  });
});

describe('GtileBreak', () => {
  const tile = new GtileBreak();

  it('has width = 20', () => {
    expect(tile.width).toBe(20);
  });

  it('has height = 20', () => {
    expect(tile.height).toBe(20);
  });

  it('NORTH_HOOK → { x: 10, y: 0 }', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 10, y: 0 });
  });

  it('SOUTH_HOOK → { x: 10, y: 20 }', () => {
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 10, y: 20 });
  });

  it('EAST_HOOK → { x: 20, y: 10 }', () => {
    expect(tile.getCoord(EAST_HOOK)).toEqual({ x: 20, y: 10 });
  });

  it('WEST_HOOK → { x: 0, y: 10 }', () => {
    expect(tile.getCoord(WEST_HOOK)).toEqual({ x: 0, y: 10 });
  });

  it('NORTH_BORDER → same as NORTH_HOOK', () => {
    expect(tile.getCoord(NORTH_BORDER)).toEqual({ x: 10, y: 0 });
  });

  it('SOUTH_BORDER → same as SOUTH_HOOK', () => {
    expect(tile.getCoord(SOUTH_BORDER)).toEqual({ x: 10, y: 20 });
  });

  it('hasPointOut() === false (FtileBreak.java:63, withoutPointOut())', () => {
    expect(tile.hasPointOut()).toBe(false);
  });
});

describe('GtileKill', () => {
  const tile = new GtileKill();

  it('has width = 28', () => {
    expect(tile.width).toBe(28);
  });

  it('has height = 28', () => {
    expect(tile.height).toBe(28);
  });

  it('NORTH_HOOK → { x: 14, y: 0 }', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 14, y: 0 });
  });

  it('SOUTH_HOOK → { x: 14, y: 28 }', () => {
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 14, y: 28 });
  });

  it('EAST_HOOK → { x: 28, y: 14 }', () => {
    expect(tile.getCoord(EAST_HOOK)).toEqual({ x: 28, y: 14 });
  });

  it('WEST_HOOK → { x: 0, y: 14 }', () => {
    expect(tile.getCoord(WEST_HOOK)).toEqual({ x: 0, y: 14 });
  });

  it('NORTH_BORDER → same as NORTH_HOOK', () => {
    expect(tile.getCoord(NORTH_BORDER)).toEqual({ x: 14, y: 0 });
  });

  it('SOUTH_BORDER → same as SOUTH_HOOK', () => {
    expect(tile.getCoord(SOUTH_BORDER)).toEqual({ x: 14, y: 28 });
  });

  it('hasPointOut() === false (FtileKilled.java:71-74, 3-arg dimension ctor)', () => {
    expect(tile.hasPointOut()).toBe(false);
  });
});
