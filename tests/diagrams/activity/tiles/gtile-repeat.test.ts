import { describe, expect, it } from 'vitest';
import { GtileRepeat } from '../../../../src/diagrams/activity/tiles/gtile-repeat.js';
import { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import type { GPoint, HookName } from '../../../../src/diagrams/activity/tiles/points.js';

const bounder: StringBounder = {
  getDimension: (_text: string, _size: number) => ({ width: 0, height: 0 }),
};

// A REAL resolved theme, not a `{ fontSize, fontFamily } as unknown as
// Theme` stub. The tiles now resolve per-element style through
// `activityFontSize` (`activity-style-defaults.ts`), which reads
// `theme.colors.elements` -- a partial cast had no `colors` at all and
// threw. `fontSize` is kept at 13 so every assertion below that depends
// on the ROOT font is unchanged.
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

// A stub's `left` (its `NORTH_HOOK.x`, `FtileGeometry.java:48-82` --
// `pointIn = (left, inY)`) defaults to `width / 2`, i.e. symmetric; pass
// `left` to model an asymmetric child such as an `if`.
function makeTile(width: number, height: number, hasPointOut = true, left = width / 2): Tile {
  return {
    kind: 'stub',
    width,
    height,
    getCoord: (): GPoint => ({ x: left, y: 0 }),
    hasPointOut: () => hasPointOut,
  };
}

// A symmetric entry stub (`FtileRepeat.java:744-748` reads `entry.width /
// 2` unconditionally, never `entry.left` -- see `GtileRepeat`'s own class
// doc), 24x24 like the real `GtileRepeatEntry`.
function makeEntry(width = 24, height = 24): Tile {
  return makeTile(width, height);
}

// GtileDiamondInside stub (mission `activity-loop-tile-port` T2, D1: the
// repeat condition is a `GtileDiamondInside`, never a `GtileDiamond`).
// Duck-typed and cast through `unknown` -- see `gtile-while.test.ts`'s own
// header comment for why a plain object literal needs the cast.
function makeDiamond(width: number, height: number) {
  return {
    kind: 'gtile-diamond-inside' as const,
    label: '',
    width,
    height,
    getCoord: (_hook: HookName): GPoint => ({ x: width / 2, y: 0 }),
    hasPointOut: () => true,
  } as unknown as GtileDiamondInside;
}

// T6: the constructor gained a `backConnection` parameter (D5), bundling
// `bounder`/`theme` into one trailing context object to stay at the hook's
// 5-parameter limit (`GtileRepeat`'s own class doc) -- neither is read, so
// every dimension test below passes a fixed `'simple2'` (the no-lane
// default) unless the test is specifically about `backConnection` itself.
const ctx = { bounder, theme };

// The task's own acceptance numbers (T5-repeat-dimension.md): body 40x60
// (left 10), condition 50x40, entry 24x24 -> left=25, width=79, height=220,
// bodyOffsetY=72, conditionOffsetY=180, entryOffsetX=13.
describe('GtileRepeat — acceptance: body 40x60 (left 10), condition 50x40, entry 24x24', () => {
  const entry = makeEntry();
  const body = makeTile(40, 60, true, 10);
  const condition = makeDiamond(50, 40);
  const tile = new GtileRepeat(entry, body, condition, 'simple2', ctx);

  it('left === 25', () => {
    expect(tile.left).toBe(25);
  });

  it('width === 79', () => {
    expect(tile.width).toBe(79);
  });

  it('height === 220', () => {
    expect(tile.height).toBe(220);
  });

  it('bodyOffsetY === 72', () => {
    expect(tile.bodyOffsetY).toBe(72);
  });

  it('conditionOffsetY === 180', () => {
    expect(tile.conditionOffsetY).toBe(180);
  });

  it('entryOffsetX === 13', () => {
    expect(tile.entryOffsetX).toBe(13);
  });

  it('entryOffsetY === 0', () => {
    expect(tile.entryOffsetY).toBe(0);
  });

  it('children is [entry, body, condition]', () => {
    expect(tile.children).toHaveLength(3);
    expect(tile.children[0]).toBe(entry);
    expect(tile.children[1]).toBe(body);
    expect(tile.children[2]).toBe(condition);
  });

  it("backConnection stores the constructor's own argument (D5, T6 retires `backEdgeLeftX`)", () => {
    expect(tile.backConnection).toBe('simple2');
  });
});

describe('GtileRepeat — backConnection stores whichever value tile-layout.ts#tileRepeat selects (D5)', () => {
  it.each(['simple1', 'simple2', 'complex1'] as const)('stores %s verbatim', (backConnection) => {
    const entry = makeEntry();
    const body = makeTile(40, 60, true, 10);
    const condition = makeDiamond(50, 40);
    const tile = new GtileRepeat(entry, body, condition, backConnection, ctx);
    expect(tile.backConnection).toBe(backConnection);
  });
});

// FtileRepeat.java:696-699 -- the tile's `left` IS `getLeft()`, UNPADDED by
// the `+2*hexagonHalfSize` gutter `calculateDimensionInternal` adds only to
// `width` -- so hooks sit at `left`, not `width / 2`, once children are
// asymmetric.
describe('GtileRepeat — hooks', () => {
  const entry = makeEntry();
  const body = makeTile(80, 60);
  const condition = makeDiamond(60, 40);
  const tile = new GtileRepeat(entry, body, condition, 'simple2', ctx);

  it('NORTH_HOOK.y === 0', () => {
    expect(tile.getCoord(NORTH_HOOK).y).toBe(0);
  });

  it('NORTH_HOOK.x === left (the +24 gutter sits entirely on the right, so left !== width / 2)', () => {
    // body left 40, condition left 30, entry half 12: left = max(40,12,30)
    // = 40; right = max(80-40=40,12,30) = 40; width = max(80,24)+24 = 104.
    expect(tile.left).toBe(40);
    expect(tile.getCoord(NORTH_HOOK).x).toBe(40);
    expect(tile.width).toBe(104);
  });

  it('SOUTH_HOOK.y === height', () => {
    expect(tile.getCoord(SOUTH_HOOK).y).toBe(tile.height);
  });

  it('SOUTH_HOOK.x === left', () => {
    expect(tile.getCoord(SOUTH_HOOK).x).toBe(tile.left);
  });

  it('EAST_HOOK.x === width', () => {
    expect(tile.getCoord(EAST_HOOK).x).toBe(tile.width);
  });

  it('WEST_HOOK.x === 0', () => {
    expect(tile.getCoord(WEST_HOOK).x).toBe(0);
  });
});

// FtileRepeat.java:696-698 `calculateDimensionFtile` unconditionally
// returns `new FtileGeometry(dimTotal, getLeft(...), 0,
// dimTotal.getHeight())` -- the exit is the condition diamond's own
// "false" path, independent of the body's own hasPointOut.
describe('GtileRepeat — hasPointOut() is unconditionally true', () => {
  it('is true even when the body has no out point (ends in a stop)', () => {
    const entry = makeEntry();
    const body = makeTile(80, 60, false);
    const condition = makeDiamond(60, 40);
    const tile = new GtileRepeat(entry, body, condition, 'simple2', ctx);
    expect(tile.hasPointOut()).toBe(true);
  });
});

// FtileRepeat.java:767-786 -- `getLeft = max(repeat.left, d1.w/2, d2.w/2)`,
// `getRight = max(repeat.w - repeat.left, d1.w/2, d2.w/2)`; `:701-717`
// `width = max(getLeft + getRight, tbTest.w + 24) + 24` (`tbTest.w` is
// always 0 under `INSIDE_HEXAGON`, `:155`); `:730-765` each child at
// `left - child.left` (`left - entry.width/2` for the entry, `:744-748`).
describe('GtileRepeat — merger left/right with asymmetric children', () => {
  it('body left 10 / width 40, condition width 50, symmetric entry: left 25, width 79', () => {
    const entry = makeEntry();
    const body = makeTile(40, 60, true, 10);
    const condition = makeDiamond(50, 40);
    const tile = new GtileRepeat(entry, body, condition, 'simple2', ctx);
    expect(tile.left).toBe(25);
    expect(tile.width).toBe(79);
    expect(tile.bodyOffsetX).toBe(25 - 10);
    expect(tile.conditionOffsetX).toBe(25 - 25);
    expect(tile.entryOffsetX).toBe(25 - 12);
  });

  it('a wide asymmetric entry (inline action) drives left via its OWN width / 2, never its .left', () => {
    // width 100, left 20 (asymmetric) -- FtileRepeat.java:767-775 reads
    // `dimDiamond1.getWidth() / 2 === 50`, NOT `dimDiamond1.getLeft() ===
    // 20`, even for the inline-action entry.
    const entry = makeEntry(100, 24);
    Object.defineProperty(entry, 'getCoord', { value: (): GPoint => ({ x: 20, y: 0 }) });
    const body = makeTile(40, 60, true, 10);
    const condition = makeDiamond(50, 40);
    const tile = new GtileRepeat(entry, body, condition, 'simple2', ctx);
    expect(tile.left).toBe(50); // max(10, 100/2=50, 25) = 50
    expect(tile.entryOffsetX).toBe(50 - 50); // left - entry.width/2, not left - 20
  });

  it('body left 20 px right of its centre: body.SOUTH -> condition.NORTH is vertical', () => {
    const entry = makeEntry();
    const body = makeTile(80, 60, true, 60); // centre 40, left 60
    const condition = makeDiamond(60, 40); // left 30
    const tile = new GtileRepeat(entry, body, condition, 'simple2', ctx);
    expect(tile.left).toBe(60);
    // right = max(80 - 60, entryHalf=12, conditionHalf=30) = 30
    expect(tile.width).toBe(60 + 30 + 24);
    expect(tile.bodyOffsetX + body.getCoord(SOUTH_HOOK).x).toBe(tile.conditionOffsetX + condition.width / 2);
  });

  it('symmetric children: offsets equal the centring and hooks equal left', () => {
    const entry = makeEntry();
    const body = makeTile(80, 60);
    const condition = makeDiamond(60, 40);
    const tile = new GtileRepeat(entry, body, condition, 'simple2', ctx);
    expect(tile.left).toBe(40);
    expect(tile.width).toBe(40 + 40 + 24);
    expect(tile.bodyOffsetX).toBe(0);
    expect(tile.conditionOffsetX).toBe(10);
    expect(tile.entryOffsetX).toBe(28);
    expect(tile.getCoord(NORTH_HOOK).x).toBe(tile.left);
  });
});

// mission `activity-loop-tile-port` T2 (prior observation, D3): a REAL
// `GtileDiamondInside` (not the stub above) must still have `left ===
// width / 2`, the invariant `GtileRepeat`'s own centring math relies on.
describe('GtileRepeat — a real GtileDiamondInside condition keeps left === width / 2', () => {
  it('holds with a labelled condition (east/south set, non-trivial width)', () => {
    const labelBounder: StringBounder = {
      getDimension: (text: string, _size: number) => ({ width: text.length * 7, height: 13 }),
    };
    const condition = new GtileDiamondInside('cond', { east: 'yes', south: 'no' }, labelBounder, theme);
    // gtile-diamond-inside.ts:92-99 -- NORTH_HOOK is unconditionally
    // `{ x: this.width / 2, y: 0 }`.
    expect(condition.getCoord(NORTH_HOOK).x).toBe(condition.width / 2);
  });
});
