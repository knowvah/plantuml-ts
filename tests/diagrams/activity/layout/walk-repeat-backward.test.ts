/**
 * Unit tests for `walkRepeat`'s `backward` handling (mission `activity-
 * divergence-drive` T3h -- `ConnectionBackBackward1`/`Backward2`,
 * `FtileRepeat.java:181-187,406-535,685-692`). Companion to
 * `walk-repeat.test.ts`, which never sets `backward` and so never exercises
 * this file's own `pushRepeatBackwardNode`/`pushRepeatBackDispatch`.
 */

import { describe, expect, it } from 'vitest';
import { walkRepeat } from '../../../../src/diagrams/activity/layout/walk-repeat.js';
import type { GtileRepeat, RepeatBackConnection } from '../../../../src/diagrams/activity/tiles/gtile-repeat.js';
import type { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';
import type { Out } from '../../../../src/diagrams/activity/layout/tile-coordinates.js';
import type { GPoint, HookName } from '../../../../src/diagrams/activity/tiles/points.js';
import { SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { Tile } from '../../../../src/diagrams/activity/tiles/tile.js';

function makeOut(): Out {
  let n = 0;
  return { nodes: [], edges: [], edgeMeta: [], reservations: [], nextId: (prefix: string) => `${prefix}${n++}`, groupScope: []  };
}

function makeLeaf(kind: string, width: number, height: number, left = width / 2, hasPointOut = true): Tile {
  return {
    kind,
    width,
    height,
    getCoord: (hook: HookName): GPoint => (hook === SOUTH_HOOK ? { x: left, y: height } : { x: left, y: 0 }),
    hasPointOut: () => hasPointOut,
  };
}

function makeCondition(width: number, height: number): GtileDiamondInside {
  return {
    kind: 'gtile-diamond-inside' as const,
    label: '',
    width,
    height,
    getCoord: (hook: HookName): GPoint => (hook === SOUTH_HOOK ? { x: width / 2, y: height } : { x: width / 2, y: 0 }),
    hasPointOut: () => true,
    labelAt: () => null,
  } as unknown as GtileDiamondInside;
}

interface RepeatTileOptions {
  entry: Tile;
  body: Tile;
  condition: GtileDiamondInside;
  entryOffsetX: number;
  bodyOffsetX: number;
  bodyOffsetY: number;
  conditionOffsetX: number;
  conditionOffsetY: number;
  width: number;
  backward?: Tile;
  backwardOffsetX?: number;
  backwardOffsetY?: number;
}

function makeRepeatTile(o: RepeatTileOptions): GtileRepeat {
  return {
    kind: 'gtile-repeat' as const,
    children: [o.entry, o.body, o.condition],
    entryOffsetX: o.entryOffsetX,
    entryOffsetY: 0,
    bodyOffsetX: o.bodyOffsetX,
    bodyOffsetY: o.bodyOffsetY,
    conditionOffsetX: o.conditionOffsetX,
    conditionOffsetY: o.conditionOffsetY,
    width: o.width,
    backConnection: 'simple2' as RepeatBackConnection,
    backward: o.backward,
    backwardOffsetX: o.backwardOffsetX ?? 0,
    backwardOffsetY: o.backwardOffsetY ?? 0,
  } as unknown as GtileRepeat;
}

describe('walkRepeat — backward unset: identical to the pre-T3h shape', () => {
  it('still pushes the simple2 back edge, no backward node', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 12);
    const condition = makeCondition(50, 40);
    const tile = makeRepeatTile({
      entry,
      body,
      condition,
      entryOffsetX: 30,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 5,
      conditionOffsetY: 100,
      width: 200,
    });
    const out = makeOut();
    walkRepeat(tile, 10, 0, undefined, out);

    expect(out.nodes.map((n) => n.kind)).toEqual(['stub-body', 'stub-entry', 'repeat-cond']);
    expect(out.edges).toHaveLength(3);
  });
});

// `FtileRepeat.create` (`:181-196`): `backward != null` is checked BEFORE
// `backConnection`'s own selection ever runs -- Backward1/Backward2 REPLACE
// it entirely.
describe('walkRepeat — backward set: node order and replaced back connection', () => {
  it('pushes backward LAST among nodes (FtileRepeat.java:690-691), then In, Backward1, Backward2, Out', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 12);
    const condition = makeCondition(50, 40);
    const backward = makeLeaf('gtile-action', 30, 20, 15);
    const tile = makeRepeatTile({
      entry,
      body,
      condition,
      entryOffsetX: 30,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 5,
      conditionOffsetY: 100,
      width: 200,
      backward,
      backwardOffsetX: 150,
      backwardOffsetY: 10,
    });
    const out = makeOut();
    walkRepeat(tile, 10, 0, undefined, out);

    expect(out.nodes.map((n) => n.kind)).toEqual(['stub-body', 'stub-entry', 'repeat-cond', 'action']);
    // In, Backward1, Backward2, Out -- 4 edges, not the 3-edge no-backward case.
    expect(out.edges).toHaveLength(4);
  });

  it('ConnectionBackBackward1 (diamond2 -> backward): side chosen by backward.x vs diamond2 centre (FtileRepeat.java:440-459)', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 12);
    const condition = makeCondition(50, 40);
    const backward = makeLeaf('gtile-action', 30, 20, 15);
    const tile = makeRepeatTile({
      entry,
      body,
      condition,
      entryOffsetX: 30,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 5,
      conditionOffsetY: 100,
      width: 200,
      backward,
      backwardOffsetX: 150,
      backwardOffsetY: 10,
    });
    const out = makeOut();
    walkRepeat(tile, 10, 0, undefined, out);

    // condX = 15, condition.width = 50 -> diamondCenterX = 40.
    // backSouth = (150+10+15, 10+20) = (175, 30); backSouth.x(175) >= 40 -- right edge.
    // x1 = condX + condition.width = 65; y1 = condY(100) + 20 = 120.
    const backward1 = out.edges[1]!;
    expect(backward1.points).toEqual([
      { x: 65, y: 120 },
      { x: 175, y: 120 },
      { x: 175, y: 30 },
    ]);
    expect(backward1.emphasize).toBeUndefined();
  });

  it('ConnectionBackBackward1 exits on the LEFT when backward sits left of diamond2 centre', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 12);
    const condition = makeCondition(50, 40);
    const backward = makeLeaf('gtile-action', 20, 20, 10);
    const tile = makeRepeatTile({
      entry,
      body,
      condition,
      entryOffsetX: 30,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 50,
      conditionOffsetY: 100,
      width: 200,
      backward,
      backwardOffsetX: 0,
      backwardOffsetY: 10,
    });
    const out = makeOut();
    walkRepeat(tile, 0, 0, undefined, out);

    // condX = 50, condition.width = 50 -> centre = 75; backSouth.x = 0+10 = 10 < 75 -- left edge (condX).
    const backward1 = out.edges[1]!;
    expect(backward1.points[0]).toEqual({ x: 50, y: 100 + 20 });
  });

  it('ConnectionBackBackward2 (backward -> entry): always targets the entry’s RIGHT edge, asToLeft, no emphasize (FtileRepeat.java:513-533)', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 12);
    const condition = makeCondition(50, 40);
    const backward = makeLeaf('gtile-action', 30, 20, 15);
    const tile = makeRepeatTile({
      entry,
      body,
      condition,
      entryOffsetX: 30,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 5,
      conditionOffsetY: 100,
      width: 200,
      backward,
      backwardOffsetX: 150,
      backwardOffsetY: 10,
    });
    const out = makeOut();
    walkRepeat(tile, 10, 0, undefined, out);

    // backNorth = (150+10+15, 10) = (175, 10). entryX = 10+30 = 40; entry
    // right edge = 40+24 = 64; y2 = entryY(0) + entry.height/2(12) = 12.
    const backward2 = out.edges[2]!;
    expect(backward2.points).toEqual([
      { x: 175, y: 10 },
      { x: 175, y: 12 },
      { x: 64, y: 12 },
    ]);
    expect(backward2.emphasize).toBeUndefined();
  });

  it('still pushes ConnectionOut last (body -> condition)', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 12, true);
    const condition = makeCondition(50, 40);
    const backward = makeLeaf('gtile-action', 30, 20, 15);
    const tile = makeRepeatTile({
      entry,
      body,
      condition,
      entryOffsetX: 30,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 5,
      conditionOffsetY: 100,
      width: 200,
      backward,
      backwardOffsetX: 150,
      backwardOffsetY: 10,
    });
    const out = makeOut();
    walkRepeat(tile, 10, 0, undefined, out);

    // bodyX = 10+0 = 10, SOUTH_HOOK = (10+12, 50+60) = (22, 110).
    // condX = 10+5 = 15, NORTH_HOOK = (15+25, 0+100) = (40, 100).
    expect(out.edges[3]!.points).toEqual([
      { x: 22, y: 110 },
      { x: 40, y: 100 },
    ]);
  });
});
