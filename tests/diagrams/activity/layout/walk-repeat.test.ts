/**
 * Unit tests for `walkRepeat` itself (T6), using synthetic tiles that
 * bypass the parser/`tile-layout.ts` construction path entirely -- the
 * counterpart to `gtile-repeat.test.ts`'s own stubs, but exercising the
 * WALKER (node/edge emission) rather than `GtileRepeat`'s own dimension
 * arithmetic. `GtileRepeat`-shaped test doubles are plain object literals
 * cast through `unknown` (same idiom as `gtile-repeat.test.ts`'s own
 * `makeDiamond`): `walkRepeat` only ever reads `children`, the three
 * `*OffsetX/Y` pairs, `width`, and `backConnection`, so a duck-typed
 * literal is enough to drive every point-list branch directly, without
 * satisfying the real constructor's own geometry invariants.
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
  return {
    nodes: [],
    edges: [],
    edgeMeta: [],
    reservations: [],
    nextId: (prefix: string) => `${prefix}${n++}`,
  };
}

/** A leaf stub with a NORTH_HOOK at `(left, 0)` and a SOUTH_HOOK at
 *  `(left, height)` -- the box shape every `makeTile` in this codebase's
 *  test suites already uses (`gtile-repeat.test.ts`, `gtile-while.test.ts`). */
function makeLeaf(kind: string, width: number, height: number, left = width / 2, hasPointOut = true): Tile {
  return {
    kind,
    width,
    height,
    getCoord: (hook: HookName): GPoint => (hook === SOUTH_HOOK ? { x: left, y: height } : { x: left, y: 0 }),
    hasPointOut: () => hasPointOut,
  };
}

/** A `GtileDiamondInside` stub with no side labels (`labelAt` always
 *  `null`), so `pushRepeatCondition`'s own `emitDiamondLabels` call pushes
 *  nothing -- these tests assert on the `ConnectionIn`/`Back`/`ConnectionOut`
 *  edges, never on label nodes. */
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
  entryOffsetY: number;
  bodyOffsetX: number;
  bodyOffsetY: number;
  conditionOffsetX: number;
  conditionOffsetY: number;
  width: number;
  backConnection: RepeatBackConnection;
}

/** A duck-typed `GtileRepeat` -- see the module doc for why a plain object
 *  literal is enough for `walkRepeat`'s own reads. */
function makeRepeatTile(o: RepeatTileOptions): GtileRepeat {
  return {
    kind: 'gtile-repeat' as const,
    children: [o.entry, o.body, o.condition],
    entryOffsetX: o.entryOffsetX,
    entryOffsetY: o.entryOffsetY,
    bodyOffsetX: o.bodyOffsetX,
    bodyOffsetY: o.bodyOffsetY,
    conditionOffsetX: o.conditionOffsetX,
    conditionOffsetY: o.conditionOffsetY,
    width: o.width,
    backConnection: o.backConnection,
  } as unknown as GtileRepeat;
}

// A condition/backConnection pair every "In"/"Out"-focused test below reuses
// verbatim -- only the entry/body geometry under test changes.
const filler = { condition: makeCondition(50, 40), conditionOffsetX: 0, conditionOffsetY: 120 };

describe('walkRepeat — ConnectionIn (entry -> body, FtileRepeat.java:221-274)', () => {
  it('a straight two-point run when the entry and body hooks share an x', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 12);
    const tile = makeRepeatTile({
      entry,
      body,
      condition: filler.condition,
      entryOffsetX: 0,
      entryOffsetY: 0,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: filler.conditionOffsetX,
      conditionOffsetY: filler.conditionOffsetY,
      width: 100,
      backConnection: 'simple2',
    });
    const out = makeOut();
    walkRepeat(tile, 0, 0, undefined, out);

    // entry SOUTH_HOOK = (12, 24); body NORTH_HOOK = (12, 50) -- same x.
    expect(out.edges[0]!.points).toEqual([
      { x: 12, y: 24 },
      { x: 12, y: 50 },
    ]);
  });

  it('a dog-leg at the midpoint y when the entry and body hooks differ in x', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 20);
    const tile = makeRepeatTile({
      entry,
      body,
      condition: filler.condition,
      entryOffsetX: 0,
      entryOffsetY: 0,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: filler.conditionOffsetX,
      conditionOffsetY: filler.conditionOffsetY,
      width: 100,
      backConnection: 'simple2',
    });
    const out = makeOut();
    walkRepeat(tile, 0, 0, undefined, out);

    // entry SOUTH_HOOK = (12, 24); body NORTH_HOOK = (20, 50); my = (24+50)/2 = 37.
    expect(out.edges[0]!.points).toEqual([
      { x: 12, y: 24 },
      { x: 12, y: 37 },
      { x: 20, y: 37 },
      { x: 20, y: 50 },
    ]);
  });
});

describe('walkRepeat — ConnectionOut (body -> condition, FtileRepeat.java:275-332)', () => {
  it('is skipped entirely when the body has no point out', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 12, false);
    const tile = makeRepeatTile({
      entry,
      body,
      condition: filler.condition,
      entryOffsetX: 0,
      entryOffsetY: 0,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: filler.conditionOffsetX,
      conditionOffsetY: filler.conditionOffsetY,
      width: 100,
      backConnection: 'simple2',
    });
    const out = makeOut();
    walkRepeat(tile, 0, 0, undefined, out);

    // In, Back -- no Out.
    expect(out.edges).toHaveLength(2);
  });

  it('a straight two-point run from the body point out to the condition point in when the body has one', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 12, true);
    const tile = makeRepeatTile({
      entry,
      body,
      condition: filler.condition,
      entryOffsetX: 0,
      entryOffsetY: 0,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 5,
      conditionOffsetY: 120,
      width: 100,
      backConnection: 'simple2',
    });
    const out = makeOut();
    walkRepeat(tile, 0, 0, undefined, out);

    // In, Back, Out.
    expect(out.edges).toHaveLength(3);
    // body SOUTH_HOOK = (12, 110); condition NORTH_HOOK = (5 + 25, 120) = (30, 120).
    expect(out.edges[2]!.points).toEqual([
      { x: 12, y: 110 },
      { x: 30, y: 120 },
    ]);
    // T3 (mission `activity-loop-lane-translate`, D2): the `repeat-out` loop
    // record `routeLoopTranslate`/`routeRepeatOut` need carries the SAME two
    // points as `ConnectionOut#getP1`/`getP2` (`FtileRepeat.java:285-293`) --
    // never a copy the walker could drift from the pushed points above.
    expect(out.edgeMeta[2]!.loop).toEqual({
      kind: 'repeat-out',
      p1: { x: 12, y: 110 },
      p2: { x: 30, y: 120 },
    });
  });
});

describe('walkRepeat — back connection: simple2 (ConnectionBackSimple2#drawU, FtileRepeat.java:626-648)', () => {
  it('runs from the condition’s right edge, right to tileX + tileWidth - 12, to the entry’s right edge', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 12);
    const condition = makeCondition(50, 40);
    const tile = makeRepeatTile({
      entry,
      body,
      condition,
      entryOffsetX: 30,
      entryOffsetY: 0,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 5,
      conditionOffsetY: 100,
      width: 200,
      backConnection: 'simple2',
    });
    const out = makeOut();
    walkRepeat(tile, 10, 0, undefined, out);

    // entryX = 10+30 = 40; condX = 10+5 = 15.
    // x1 = condX + condition.width = 65; y1 = condY + condition.height/2 = 120.
    // x2 = entryX + entry.width = 64; y2 = entryY + entry.height/2 = 12.
    // xmax = tileX(10) + tileWidth(200) - 12 = 198.
    const back = out.edges[1]!;
    expect(back.points).toEqual([
      { x: 65, y: 120 },
      { x: 198, y: 120 },
      { x: 198, y: 12 },
      { x: 64, y: 12 },
    ]);
    expect(back.emphasize).toBe('up');
    // T3, D2: `ConnectionBackSimple2#getP1`/`getP2` (`FtileRepeat.java:
    // 618-623`) are the diamonds' own UNTRANSLATED origins -- condX/condY
    // and entryX/entryY -- never the mid-height points `back.points` above
    // computes for the same-lane `drawU` shape.
    expect(out.edgeMeta[1]!.loop).toEqual({
      kind: 'repeat-simple2',
      p1: { x: 15, y: 100 },
      p2: { x: 40, y: 0 },
      diamond1: { width: 24, height: 24 },
      diamond2: { width: 50, height: 40 },
    });
  });
});

describe('walkRepeat — back connection: simple1 (ConnectionBackSimple1#drawU, FtileRepeat.java:555-577)', () => {
  it('runs from the condition’s left edge, left to tileX - 12, to the entry’s left edge', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 12);
    const condition = makeCondition(50, 40);
    const tile = makeRepeatTile({
      entry,
      body,
      condition,
      entryOffsetX: 30,
      entryOffsetY: 0,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 5,
      conditionOffsetY: 100,
      width: 200,
      backConnection: 'simple1',
    });
    const out = makeOut();
    walkRepeat(tile, 10, 0, undefined, out);

    // condX = 15; entryX = 40. y1/y2 as in the simple2 test above.
    // xmin = tileX(10) - 12 = -2.
    const back = out.edges[1]!;
    expect(back.points).toEqual([
      { x: 15, y: 120 },
      { x: -2, y: 120 },
      { x: -2, y: 12 },
      { x: 40, y: 12 },
    ]);
    expect(back.emphasize).toBe('up');
    // T3, D2: `ConnectionBackSimple1#getP1`/`getP2` (`FtileRepeat.java:
    // 547-552`) are the diamonds' own UNTRANSLATED origins; `repeatWidth` is
    // `repeat.calculateDimension().getWidth()` (`:583`) -- `body.width` (40)
    // here, the same tile `complex1Points` already reads for its `x1_b` term.
    expect(out.edgeMeta[1]!.loop).toEqual({
      kind: 'repeat-simple1',
      p1: { x: 15, y: 100 },
      p2: { x: 40, y: 0 },
      repeatWidth: 40,
      diamond1: { height: 24 },
      diamond2: { width: 50, height: 40 },
    });
  });
});

describe('walkRepeat — back connection: complex1 (ConnectionBackComplex1#drawSnake, FtileRepeat.java:364-402)', () => {
  it('routes left through x1_b when the entry sits left of the condition and x1_a < x1_b', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 100, 60, 50);
    const condition = makeCondition(50, 40);
    const tile = makeRepeatTile({
      entry,
      body,
      condition,
      entryOffsetX: 0,
      entryOffsetY: 0,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 0,
      conditionOffsetY: 100,
      width: 200,
      backConnection: 'complex1',
    });
    const out = makeOut();
    walkRepeat(tile, 0, 0, undefined, out);

    // condX=0, condition.width=50 -> x1_a = 50; y1 = condY(100) + 20 = 120.
    // entryX=0, entry.width=24 -> entryRight = 24 < x1_a(50) -- branch 1.
    // x1_b = condX + condition.width/2 + body.width/2 + 12 = 0+25+50+12 = 87.
    // x1_a(50) < x1_b(87) -- elbow = x1_b = 87.
    // y2 = entryY(0) + entry.height/2(12) = 12.
    const back = out.edges[1]!;
    expect(back.points).toEqual([
      { x: 50, y: 120 },
      { x: 87, y: 120 },
      { x: 87, y: 12 },
      { x: 24, y: 12 },
    ]);
    expect(back.emphasize).toBe('up');
    // T3, D2: `ConnectionBackComplex1#getP1`/`getP2` (`FtileRepeat.java:
    // 341-347`) are the diamonds' own UNTRANSLATED origins (condX/condY,
    // entryX/entryY here both 0/100 and 0/0); `repeatWidth` is `body.width`
    // (100), the same term `complex1Points`'s own `x1_b` reads above.
    expect(out.edgeMeta[1]!.loop).toEqual({
      kind: 'repeat-complex1',
      p1: { x: 0, y: 100 },
      p2: { x: 0, y: 0 },
      repeatWidth: 100,
      diamond1: { width: 24, height: 24 },
      diamond2: { width: 50, height: 40 },
    });
  });

  it('routes left through x1_a + 10 when x1_a >= x1_b', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 20, 60, 10);
    const condition = makeCondition(50, 40);
    const tile = makeRepeatTile({
      entry,
      body,
      condition,
      entryOffsetX: 0,
      entryOffsetY: 0,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 0,
      conditionOffsetY: 100,
      width: 200,
      backConnection: 'complex1',
    });
    const out = makeOut();
    walkRepeat(tile, 0, 0, undefined, out);

    // x1_a = 50 (as above); x1_b = 0+25+10+12 = 47 <= x1_a -- elbow = x1_a+10 = 60.
    const back = out.edges[1]!;
    expect(back.points).toEqual([
      { x: 50, y: 120 },
      { x: 60, y: 120 },
      { x: 60, y: 12 },
      { x: 24, y: 12 },
    ]);
    // T3, D2: `repeatWidth` here is `body.width` (20, a narrower body than
    // the sibling test above), the sole difference driving `x1_b`'s branch.
    expect(out.edgeMeta[1]!.loop).toEqual({
      kind: 'repeat-complex1',
      p1: { x: 0, y: 100 },
      p2: { x: 0, y: 0 },
      repeatWidth: 20,
      diamond1: { width: 24, height: 24 },
      diamond2: { width: 50, height: 40 },
    });
  });

  it('routes right through the quarter-point middle when the entry sits at or right of the condition', () => {
    const entry = makeLeaf('stub-entry', 60, 24, 30);
    const body = makeLeaf('stub-body', 100, 60, 50);
    const condition = makeCondition(50, 40);
    const tile = makeRepeatTile({
      entry,
      body,
      condition,
      entryOffsetX: 0,
      entryOffsetY: 0,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 0,
      conditionOffsetY: 100,
      width: 200,
      backConnection: 'complex1',
    });
    const out = makeOut();
    walkRepeat(tile, 0, 0, undefined, out);

    // entryX=0, entry.width=60 -> entryRight = 60 >= x1_a(50) -- branch 2.
    // x2 is overwritten to entryX(0). middle = x1_a/4 + x2*3/4 = 50/4 = 12.5.
    // y2 = entryY(0) + entry.height/2(12) = 12.
    const back = out.edges[1]!;
    expect(back.points).toEqual([
      { x: 50, y: 120 },
      { x: 12.5, y: 120 },
      { x: 12.5, y: 12 },
      { x: 0, y: 12 },
    ]);
    expect(back.emphasize).toBe('up');
    // T3, D2: the wider entry (width 60) only changes `diamond1.width`
    // relative to the first complex1 test above -- `p1`/`p2`/`repeatWidth`
    // are unchanged since condition/body geometry is the same.
    expect(out.edgeMeta[1]!.loop).toEqual({
      kind: 'repeat-complex1',
      p1: { x: 0, y: 100 },
      p2: { x: 0, y: 0 },
      repeatWidth: 100,
      diamond1: { width: 60, height: 24 },
      diamond2: { width: 50, height: 40 },
    });
  });
});

describe('walkRepeat — draw order: every child’s own node first, then In, Back, Out (D7)', () => {
  it('pushes 3 nodes (entry, body, condition) before any of the repeat’s own 3 edges', () => {
    const entry = makeLeaf('stub-entry', 24, 24, 12);
    const body = makeLeaf('stub-body', 40, 60, 12);
    const condition = makeCondition(50, 40);
    const tile = makeRepeatTile({
      entry,
      body,
      condition,
      entryOffsetX: 0,
      entryOffsetY: 0,
      bodyOffsetX: 0,
      bodyOffsetY: 50,
      conditionOffsetX: 0,
      conditionOffsetY: 120,
      width: 100,
      backConnection: 'simple2',
    });
    const out = makeOut();
    walkRepeat(tile, 0, 0, undefined, out);

    expect(out.nodes.map((n) => n.kind)).toEqual(['stub-entry', 'stub-body', 'repeat-cond']);
    expect(out.edges).toHaveLength(3);
    // In: entry -> body, not emphasized.
    expect(out.edges[0]!.emphasize).toBeUndefined();
    // Back: condition -> entry, emphasized 'up' -- the middle edge.
    expect(out.edges[1]!.emphasize).toBe('up');
    // Out: body -> condition, not emphasized.
    expect(out.edges[2]!.emphasize).toBeUndefined();
    expect(out.edges[2]!.points[0]).toEqual({ x: body.getCoord(SOUTH_HOOK).x, y: 50 + body.getCoord(SOUTH_HOOK).y });
    expect(out.edges[0]!.points[0]).toEqual({ x: entry.getCoord(SOUTH_HOOK).x, y: entry.getCoord(SOUTH_HOOK).y });
  });
});
