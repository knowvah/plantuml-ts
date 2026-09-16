import { describe, expect, it } from 'vitest';
import { GtileWhile } from '../../../../src/diagrams/activity/tiles/gtile-while.js';
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
// `pointIn = (left, inY)`) defaults to `width / 2`, i.e. symmetric, which is
// what every real tile was before `activity-if-tile-port`; pass `left` to
// model an asymmetric child such as an `if`.
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
// while header is a `GtileDiamondInside`, never a `GtileDiamond`) --
// width/height and its `left` (`width / 2`, D3) matter for GtileWhile
// geometry. Duck-typed and cast through `unknown`, the same idiom
// `tile-coordinates.ts` already uses for its own `Gtile*` casts: the real
// class has private fields (`north`/`south`/`west`/`east`/`hexHeight`), so
// no plain object literal can satisfy it structurally, and `GtileWhile`'s
// constructor never calls `labelAt`/`swapEastWest` -- only `width`,
// `height`, `getCoord`, `hasPointOut` are read.
function makeDiamond(width: number, height: number, left = width / 2) {
  return {
    kind: 'gtile-diamond-inside' as const,
    label: '',
    width,
    height,
    getCoord: (_hook: HookName): GPoint => ({ x: left, y: 0 }),
    hasPointOut: () => true,
  } as unknown as GtileDiamondInside;
}

describe('GtileWhile — geometry (header h=40, body h=80)', () => {
  const header = makeDiamond(60, 40);
  const body = makeTile(80, 80);
  const tile = new GtileWhile(header, body, bounder, theme);

  it('height === header.height + NODE_MARGIN_Y + body.height + NODE_MARGIN_Y', () => {
    expect(tile.height).toBe(40 + NODE_MARGIN_Y + 80 + NODE_MARGIN_Y);
  });

  it('height === 160', () => {
    expect(tile.height).toBe(160);
  });

  it('width === max(header.width, body.width) + BACK_EDGE_MARGIN', () => {
    const expectedContentWidth = Math.max(header.width, body.width);
    expect(tile.width).toBe(expectedContentWidth + BACK_EDGE_MARGIN);
  });

  it('bodyOffsetY === header.height + NODE_MARGIN_Y', () => {
    expect(tile.bodyOffsetY).toBe(40 + NODE_MARGIN_Y);
  });

  it('bodyOffsetY === 60', () => {
    expect(tile.bodyOffsetY).toBe(60);
  });

  it('headerOffsetY === 0', () => {
    expect(tile.headerOffsetY).toBe(0);
  });

  it('backEdgeRightX === width', () => {
    expect(tile.backEdgeRightX).toBe(tile.width);
  });

  it('children contains header and body', () => {
    expect(tile.children).toHaveLength(2);
    expect(tile.children[0]).toBe(header);
    expect(tile.children[1]).toBe(body);
  });
});

describe('GtileWhile — width: body wider than header', () => {
  const header = makeDiamond(40, 40);
  const body = makeTile(100, 80);
  const tile = new GtileWhile(header, body, bounder, theme);

  it('width driven by body.width', () => {
    expect(tile.width).toBe(100 + BACK_EDGE_MARGIN);
  });
});

describe('GtileWhile — width: header wider than body', () => {
  const header = makeDiamond(120, 40);
  const body = makeTile(60, 80);
  const tile = new GtileWhile(header, body, bounder, theme);

  it('width driven by header.width', () => {
    expect(tile.width).toBe(120 + BACK_EDGE_MARGIN);
  });
});

describe('GtileWhile — hooks', () => {
  const header = makeDiamond(60, 40);
  const body = makeTile(80, 80);
  const tile = new GtileWhile(header, body, bounder, theme);
  const cx = (tile.width - BACK_EDGE_MARGIN) / 2;

  it('NORTH_HOOK.y === 0', () => {
    expect(tile.getCoord(NORTH_HOOK).y).toBe(0);
  });

  // FtileWhile.java:593 -- `left = geo.getLeft() + dx` (gutter unported,
  // D2); for symmetric children the merged `left` (`FtileGeometryMerger
  // .java:44`, `max(left1, left2)`) is the content centre.
  it('NORTH_HOOK.x === content centre === contentLeft', () => {
    expect(tile.getCoord(NORTH_HOOK).x).toBe(cx);
    expect(tile.contentLeft).toBe(cx);
  });

  it('SOUTH_HOOK.y === height', () => {
    expect(tile.getCoord(SOUTH_HOOK).y).toBe(tile.height);
  });

  it('SOUTH_HOOK.x === content centre', () => {
    expect(tile.getCoord(SOUTH_HOOK).x).toBe(cx);
  });

  it('EAST_HOOK.x === width', () => {
    expect(tile.getCoord(EAST_HOOK).x).toBe(tile.width);
  });

  it('WEST_HOOK.x === 0', () => {
    expect(tile.getCoord(WEST_HOOK).x).toBe(0);
  });
});

// FtileWhile.java:576-591 `calculateDimensionFtile` unconditionally builds
// the 5-arg `FtileGeometry` with `outY = height` -- the exit edge is the
// diamond's own "false" path, independent of whether the loop body
// continues, so a while always has an out point.
describe('GtileWhile — hasPointOut() is unconditionally true', () => {
  it('is true even when the body has no out point (ends in a stop)', () => {
    const header = makeDiamond(60, 40);
    const body = makeTile(80, 80, false);
    const tile = new GtileWhile(header, body, bounder, theme);
    expect(tile.hasPointOut()).toBe(true);
  });
});

// FtileGeometryMerger.java:44-56 -- `appendBottom`: `left = max(left1,
// left2)`, `width = max(w1 + (left - left1), w2 + (left - left2))`;
// FtileWhile.java:621-641 -- each child at `x = total.left - child.left`.
describe('GtileWhile — merger left/width with asymmetric children (D1)', () => {
  it('header left 30 (w 60), body left 10 (w 40): contentLeft 30, contentWidth 60', () => {
    const header = makeDiamond(60, 40, 30);
    const body = makeTile(40, 80, true, 10);
    const tile = new GtileWhile(header, body, bounder, theme);
    expect(tile.contentLeft).toBe(30);
    expect(tile.headerOffsetX).toBe(0);
    expect(tile.bodyOffsetX).toBe(20);
    // max(60 + 0, 40 + 20) = 60
    expect(tile.width).toBe(60 + BACK_EDGE_MARGIN);
    expect(tile.getCoord(NORTH_HOOK).x).toBe(30);
    expect(tile.getCoord(SOUTH_HOOK).x).toBe(30);
  });

  it('body left 20 px right of its centre: width = contentLeft - body.left + body.width + margin', () => {
    const header = makeDiamond(60, 40); // left 30
    const body = makeTile(120, 80, true, 80); // centre 60, left 80
    const tile = new GtileWhile(header, body, bounder, theme);
    expect(tile.contentLeft).toBe(80);
    expect(tile.headerOffsetX).toBe(50);
    expect(tile.bodyOffsetX).toBe(0);
    // merger: max(50 + 60, 0 + 120) = 120 -- the body term wins here
    expect(tile.width).toBe(80 - 80 + 120 + BACK_EDGE_MARGIN);
    // both hooks sit on the merged left, so header.SOUTH -> body.NORTH is
    // vertical: header at x=50 puts its left at 80, body at x=0 its left at 80.
    expect(tile.headerOffsetX + header.getCoord(SOUTH_HOOK).x).toBe(tile.bodyOffsetX + body.getCoord(NORTH_HOOK).x);
  });

  it('body left LEFT of its centre widens the tile on the right', () => {
    const header = makeDiamond(60, 40); // left 30
    const body = makeTile(80, 80, true, 20); // left 20
    const tile = new GtileWhile(header, body, bounder, theme);
    expect(tile.contentLeft).toBe(30);
    expect(tile.bodyOffsetX).toBe(10);
    // max(60 + 0, 80 + 10) = 90
    expect(tile.width).toBe(90 + BACK_EDGE_MARGIN);
    expect(tile.backEdgeRightX).toBe(tile.width);
  });

  it('symmetric children: offsets equal the old centring and hooks equal (width - margin) / 2', () => {
    const header = makeDiamond(60, 40);
    const body = makeTile(80, 80);
    const tile = new GtileWhile(header, body, bounder, theme);
    const cx = (tile.width - BACK_EDGE_MARGIN) / 2;
    expect(tile.headerOffsetX).toBe(cx - 60 / 2);
    expect(tile.bodyOffsetX).toBe(cx - 80 / 2);
    expect(tile.getCoord(NORTH_HOOK).x).toBe(cx);
  });
});

// mission `activity-loop-tile-port` T2 (prior observation, D3): a REAL
// `GtileDiamondInside` (not the stub above) must still have `left ===
// width / 2`, the invariant `GtileWhile`'s own centring math relies on.
describe('GtileWhile — a real GtileDiamondInside header keeps left === width / 2', () => {
  it('holds with a labelled condition (north/west set, non-trivial width)', () => {
    const labelBounder: StringBounder = {
      getDimension: (text: string, _size: number) => ({ width: text.length * 7, height: 13 }),
    };
    const header = new GtileDiamondInside('cond', { north: 'yes', west: 'no' }, labelBounder, theme);
    // gtile-diamond-inside.ts:92-99 -- NORTH_HOOK is unconditionally
    // `{ x: this.width / 2, y: 0 }`.
    expect(header.getCoord(NORTH_HOOK).x).toBe(header.width / 2);
  });
});
