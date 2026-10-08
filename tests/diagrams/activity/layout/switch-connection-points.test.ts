/**
 * add4-T1f (R1): `ConnectionVerticalThenHorizontal#drawU`
 * (`FtileSwitchWithManyLinks.java:159-186`) picks the arrow polygon with the
 * same branch that picks `p2`; the port returns that direction with the
 * points.
 */
import { describe, expect, it } from 'vitest';

import { verticalThenHorizontalPoints } from '../../../../src/diagrams/activity/layout/switch-connection-points.js';

const hex2 = { west: { x: 90, y: 200 }, east: { x: 110, y: 200 }, north: { x: 100, y: 190 } };

describe('verticalThenHorizontalPoints', () => {
  it('x1 < ptD.x: RIGHT, landing on west', () => {
    expect(verticalThenHorizontalPoints({ x: 20, y: 100 }, hex2)).toEqual({
      points: [
        { x: 20, y: 100 },
        { x: 20, y: 200 },
        { x: 90, y: 200 },
      ],
      direction: 'right',
    });
  });

  it('x1 > ptB.x far right: LEFT, landing on east', () => {
    const r = verticalThenHorizontalPoints({ x: 200, y: 100 }, hex2);
    expect(r.direction).toBe('left');
    expect(r.points.at(-1)).toEqual(hex2.east);
  });

  it('x1 > ptB.x within 10 px: the LEFT detour (x1 + 12)', () => {
    const r = verticalThenHorizontalPoints({ x: 115, y: 100 }, hex2);
    expect(r.points).toEqual([
      { x: 115, y: 100 },
      { x: 115, y: 192 },
      { x: 127, y: 192 },
      { x: 127, y: 200 },
      { x: 110, y: 200 },
    ]);
    expect(r.direction).toBe('left');
  });

  it('x1 inside [ptD.x, ptB.x]: DOWN to north, even when the tail is horizontal', () => {
    const r = verticalThenHorizontalPoints({ x: 97, y: 100 }, hex2);
    expect(r.points).toEqual([
      { x: 97, y: 100 },
      { x: 97, y: 190 },
      { x: 100, y: 190 },
    ]);
    expect(r.direction).toBe('down');
  });
});
