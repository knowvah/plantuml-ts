/**
 * add4-T3j: `FtileWhile`'s connector ends are child-LOCAL points translated
 * by the walk origin LAST (`FtileWhile.java:179-186,621-641`; `Worm.java:67-79`),
 * so the in-edge's two ends share one x exactly -- `Direction.fromVector`
 * (`Direction.java:110-130`) compares with `==`.
 */
import { describe, expect, it } from 'vitest';

import { childHook } from '../../../src/diagrams/activity/layout/walk-while-branch.js';
import type { Tile } from '../../../src/diagrams/activity/tiles/tile.js';
import type { GPoint, HookName } from '../../../src/diagrams/activity/tiles/points.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../src/diagrams/activity/tiles/points.js';

function tileAt(point: GPoint): Tile {
  return { getCoord: (_hook: HookName) => point } as unknown as Tile;
}

// xovigi-85-rufa987 under FULL-block hexagon sizing: the header's half
// width carries the resolved bold width's float noise.
const HEADER_SOUTH_X = 26.987499999999997;
const BODY_NORTH_X = 88.975;
const MERGED_LEFT = 112.975;
const ORIGIN = { x: 56, y: 0 };

describe('walk-while-branch childHook', () => {
  it('resolves the header out and body in to the same x', () => {
    const header = childHook(
      ORIGIN,
      { x: MERGED_LEFT - HEADER_SOUTH_X, y: 0 },
      tileAt({ x: HEADER_SOUTH_X, y: 30 }),
      SOUTH_HOOK,
    );
    const body = childHook(
      ORIGIN,
      { x: MERGED_LEFT - BODY_NORTH_X, y: 40 },
      tileAt({ x: BODY_NORTH_X, y: 0 }),
      NORTH_HOOK,
    );
    expect(header).toEqual({ x: 168.975, y: 30 });
    expect(body).toEqual({ x: 168.975, y: 40 });
  });

  it('differs from the origin-first grouping it replaced', () => {
    const originFirst = ORIGIN.x + (MERGED_LEFT - HEADER_SOUTH_X) + HEADER_SOUTH_X;
    expect(originFirst).toBe(168.97500000000002);
  });
});
