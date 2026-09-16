import { describe, expect, it } from 'vitest';
import { GtileRepeat } from '../../../../src/diagrams/activity/tiles/gtile-repeat.js';
import { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import type { GPoint, HookName } from '../../../../src/diagrams/activity/tiles/points.js';

const BACK_EDGE_MARGIN = 20;
const NODE_MARGIN_Y = 20;

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

describe('GtileRepeat — no backward body (body h=60, condition h=40)', () => {
  const body = makeTile(80, 60);
  const condition = makeDiamond(60, 40);
  const tile = new GtileRepeat(body, condition, null, bounder, theme);

  it('height === 140', () => {
    // conditionOffsetY = 60+20 = 80; after condition: 80+40 = 120; height = 120+20 = 140
    expect(tile.height).toBe(140);
  });

  it('conditionOffsetY === body.height + NODE_MARGIN_Y', () => {
    expect(tile.conditionOffsetY).toBe(60 + NODE_MARGIN_Y);
  });

  it('conditionOffsetY === 80', () => {
    expect(tile.conditionOffsetY).toBe(80);
  });

  it('bodyOffsetY === 0', () => {
    expect(tile.bodyOffsetY).toBe(0);
  });

  it('backwardOffsetY === null', () => {
    expect(tile.backwardOffsetY).toBeNull();
  });

  it('backEdgeLeftX === 0', () => {
    expect(tile.backEdgeLeftX).toBe(0);
  });

  it('width === max(body.width, condition.width) + BACK_EDGE_MARGIN', () => {
    expect(tile.width).toBe(Math.max(body.width, condition.width) + BACK_EDGE_MARGIN);
  });

  it('children contains body and condition only', () => {
    expect(tile.children).toHaveLength(2);
    expect(tile.children[0]).toBe(body);
    expect(tile.children[1]).toBe(condition);
  });
});

describe('GtileRepeat — with backward body (body h=60, condition h=40, backward h=30)', () => {
  const body = makeTile(80, 60);
  const condition = makeDiamond(60, 40);
  const backward = makeTile(70, 30);
  const tile = new GtileRepeat(body, condition, backward, bounder, theme);

  it('height === 190', () => {
    // conditionOffsetY = 60+20 = 80
    // after condition: 80+40 = 120
    // backwardOffsetY = 120+20 = 140
    // after backward: 140+30 = 170
    // height = 170+20 = 190
    expect(tile.height).toBe(190);
  });

  it('backwardOffsetY is non-null', () => {
    expect(tile.backwardOffsetY).not.toBeNull();
  });

  it('backwardOffsetY === conditionOffsetY + condition.height + NODE_MARGIN_Y', () => {
    const expectedBackward = tile.conditionOffsetY + condition.height + NODE_MARGIN_Y;
    expect(tile.backwardOffsetY).toBe(expectedBackward);
  });

  it('backwardOffsetY === 140', () => {
    expect(tile.backwardOffsetY).toBe(140);
  });

  it('children contains body, condition, and backward', () => {
    expect(tile.children).toHaveLength(3);
    expect(tile.children[0]).toBe(body);
    expect(tile.children[1]).toBe(condition);
    expect(tile.children[2]).toBe(backward);
  });
});

describe('GtileRepeat — width: condition wider than body', () => {
  const body = makeTile(40, 60);
  const condition = makeDiamond(100, 40);
  const tile = new GtileRepeat(body, condition, null, bounder, theme);

  it('width driven by condition.width', () => {
    expect(tile.width).toBe(100 + BACK_EDGE_MARGIN);
  });
});

describe('GtileRepeat — hooks', () => {
  const body = makeTile(80, 60);
  const condition = makeDiamond(60, 40);
  const tile = new GtileRepeat(body, condition, null, bounder, theme);
  const cx = tile.width / 2;

  it('NORTH_HOOK.y === 0', () => {
    expect(tile.getCoord(NORTH_HOOK).y).toBe(0);
  });

  // FtileRepeat.java:696-699 -- the tile's `left` is `getLeft()`; for
  // symmetric children the merged `left` behind `BACK_EDGE_MARGIN / 2` is
  // `width / 2` exactly.
  it('NORTH_HOOK.x === width / 2 === BACK_EDGE_MARGIN / 2 + left', () => {
    expect(tile.getCoord(NORTH_HOOK).x).toBe(cx);
    expect(BACK_EDGE_MARGIN / 2 + tile.left).toBe(cx);
  });

  it('SOUTH_HOOK.y === height', () => {
    expect(tile.getCoord(SOUTH_HOOK).y).toBe(tile.height);
  });

  it('SOUTH_HOOK.x === width / 2', () => {
    expect(tile.getCoord(SOUTH_HOOK).x).toBe(cx);
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
    const body = makeTile(80, 60, false);
    const condition = makeDiamond(60, 40);
    const tile = new GtileRepeat(body, condition, null, bounder, theme);
    expect(tile.hasPointOut()).toBe(true);
  });
});

// FtileRepeat.java:767-786 -- `getLeft = max(repeat.left, d2.w / 2)`,
// `getRight = max(repeat.w - repeat.left, d2.w / 2)` (the `d1` entry-diamond
// term is absent: our tile has none); `:701-716` `width = left + right`;
// `:730-765` each child at `left - child.left`.
describe('GtileRepeat — merger left/right with asymmetric children', () => {
  it('body left 10 / width 40, condition width 50: left 25, right 30, contentWidth 55', () => {
    const body = makeTile(40, 60, true, 10);
    const condition = makeDiamond(50, 40);
    const tile = new GtileRepeat(body, condition, null, bounder, theme);
    expect(tile.left).toBe(25);
    expect(tile.width).toBe(55 + BACK_EDGE_MARGIN);
    expect(tile.bodyOffsetX).toBe(BACK_EDGE_MARGIN / 2 + 25 - 10);
    expect(tile.conditionOffsetX).toBe(BACK_EDGE_MARGIN / 2 + 25 - 25);
    expect(tile.backwardOffsetX).toBeNull();
    expect(tile.getCoord(NORTH_HOOK).x).toBe(BACK_EDGE_MARGIN / 2 + 25);
    expect(tile.getCoord(SOUTH_HOOK).x).toBe(BACK_EDGE_MARGIN / 2 + 25);
  });

  it('body left 20 px right of its centre: body.SOUTH -> condition.NORTH is vertical, width = left + right + margin', () => {
    const body = makeTile(80, 60, true, 60); // centre 40, left 60
    const condition = makeDiamond(60, 40); // left 30
    const tile = new GtileRepeat(body, condition, null, bounder, theme);
    expect(tile.left).toBe(60);
    // right = max(80 - 60, 60 - 30) = 30
    expect(tile.width).toBe(60 + 30 + BACK_EDGE_MARGIN);
    expect(tile.bodyOffsetX + body.getCoord(SOUTH_HOOK).x).toBe(tile.conditionOffsetX + condition.width / 2);
  });

  it('an asymmetric backward body joins the merge and its hooks align with the body', () => {
    const body = makeTile(80, 60); // left 40
    const condition = makeDiamond(60, 40); // left 30
    const backward = makeTile(70, 30, true, 50); // centre 35, left 50
    const tile = new GtileRepeat(body, condition, backward, bounder, theme);
    expect(tile.left).toBe(50);
    // right = max(80 - 40, 60 - 30, 70 - 50) = 40
    expect(tile.width).toBe(50 + 40 + BACK_EDGE_MARGIN);
    expect(tile.backwardOffsetX).toBe(BACK_EDGE_MARGIN / 2 + 50 - 50);
    expect(tile.backwardOffsetX! + backward.getCoord(NORTH_HOOK).x).toBe(
      tile.bodyOffsetX + body.getCoord(NORTH_HOOK).x,
    );
  });

  it('symmetric children: offsets equal the old centring and hooks equal width / 2', () => {
    const body = makeTile(80, 60);
    const condition = makeDiamond(60, 40);
    const backward = makeTile(70, 30);
    const tile = new GtileRepeat(body, condition, backward, bounder, theme);
    const cx = tile.width / 2;
    expect(tile.width).toBe(80 + BACK_EDGE_MARGIN);
    expect(tile.bodyOffsetX).toBe(cx - 80 / 2);
    expect(tile.conditionOffsetX).toBe(cx - 60 / 2);
    expect(tile.backwardOffsetX).toBe(cx - 70 / 2);
    expect(tile.getCoord(NORTH_HOOK).x).toBe(cx);
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
