import { describe, expect, it } from 'vitest';
import { GtileWhile } from '../../../../src/diagrams/activity/tiles/gtile-while.js';
import { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import type { GPoint, HookName } from '../../../../src/diagrams/activity/tiles/points.js';

/** `Hexagon.hexagonHalfSize`. @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46 */
const HEXAGON_HALF_SIZE = 12;

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

// altp-T3 acceptance case: header 60x40 (left 30), body 80x80 (left 40), no
// label. `FtileWhile.java:575-596,621-641` -- see `gtile-while.ts`'s own
// constructor cite for the full derivation.
describe('GtileWhile — geometry (header h=40, body h=80)', () => {
  const header = makeDiamond(60, 40);
  const body = makeTile(80, 80);
  const tile = new GtileWhile(header, body, bounder, theme);

  // geo = diamond1.appendBottom(whileBlock): geo.h = header.h + body.h
  // (`FtileGeometryMerger.java:47`); height = geo.h + 4*12 + labelHeight
  // (`FtileWhile.java:585`, labelHeight 0 -- no `back1` capture, see
  // `gtile-while.ts`'s `labelHeight` field doc).
  it('height === header.height + body.height + 4 * HEXAGON_HALF_SIZE + labelHeight', () => {
    expect(tile.height).toBe(40 + 80 + 4 * HEXAGON_HALF_SIZE + tile.labelHeight);
  });

  it('height === 168', () => {
    expect(tile.height).toBe(168);
  });

  it('labelHeight === 0 (no back1 captured today)', () => {
    expect(tile.labelHeight).toBe(0);
  });

  // width = geo.w + 2*12 + 12 (`FtileWhile.java:586,591`); geo.w here ==
  // max(header.width, body.width) since both children are centred on their
  // own `left`.
  it('width === max(header.width, body.width) + 3 * HEXAGON_HALF_SIZE', () => {
    const geoWidth = Math.max(header.width, body.width);
    expect(tile.width).toBe(geoWidth + 3 * HEXAGON_HALF_SIZE);
  });

  it('width === 116', () => {
    expect(tile.width).toBe(116);
  });

  // getTranslateForWhile: y = d1.h + (total.h - d1.h - body.h - labelHeight)
  // / 2 (`FtileWhile.java:627-628`) -- the label term cancels against
  // `height`'s own `+ labelHeight`, leaving `header.h + 2 * hexagonHalfSize`.
  it('bodyOffsetY === header.height + 2 * HEXAGON_HALF_SIZE', () => {
    expect(tile.bodyOffsetY).toBe(40 + 2 * HEXAGON_HALF_SIZE);
  });

  it('bodyOffsetY === 64', () => {
    expect(tile.bodyOffsetY).toBe(64);
  });

  it('headerOffsetX === 34, bodyOffsetX === 24', () => {
    expect(tile.headerOffsetX).toBe(34);
    expect(tile.bodyOffsetX).toBe(24);
  });

  it('headerOffsetY === 0', () => {
    expect(tile.headerOffsetY).toBe(0);
  });

  // `backEdgeRightX` was retired by altp-T4 (D8): the back edge's own
  // point list now reads `x + t.width` directly (`walk-while-branch.ts`'s
  // `buildWhileFrame`'s `xx`), and `grep` shows no reader of the field left
  // outside `layout.old.ts`.

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

  // FtileWhile.java:586,591 -- `width = geo.w + dx + hexagonHalfSize`, `dx =
  // 2 * hexagonHalfSize`.
  it('width driven by body.width', () => {
    expect(tile.width).toBe(100 + 3 * HEXAGON_HALF_SIZE);
  });
});

describe('GtileWhile — width: header wider than body', () => {
  const header = makeDiamond(120, 40);
  const body = makeTile(60, 80);
  const tile = new GtileWhile(header, body, bounder, theme);

  it('width driven by header.width', () => {
    expect(tile.width).toBe(120 + 3 * HEXAGON_HALF_SIZE);
  });
});

describe('GtileWhile — hooks', () => {
  const header = makeDiamond(60, 40);
  const body = makeTile(80, 80);
  const tile = new GtileWhile(header, body, bounder, theme);

  it('NORTH_HOOK.y === 0', () => {
    expect(tile.getCoord(NORTH_HOOK).y).toBe(0);
  });

  // FtileWhile.java:593 -- `left = geo.getLeft() + dx`; for this symmetric
  // pair `geo.getLeft() = max(30, 40) = 40`, so `left = 64`.
  it('NORTH_HOOK.x === tile.left === 64', () => {
    expect(tile.getCoord(NORTH_HOOK).x).toBe(tile.left);
    expect(tile.left).toBe(64);
  });

  it('SOUTH_HOOK.y === height', () => {
    expect(tile.getCoord(SOUTH_HOOK).y).toBe(tile.height);
  });

  it('SOUTH_HOOK.x === tile.left', () => {
    expect(tile.getCoord(SOUTH_HOOK).x).toBe(tile.left);
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

// FtileGeometryMerger.java:42-56 -- `appendBottom`: `left = max(left1,
// left2)`, `width = max(w1 + (left - left1), w2 + (left - left2))`;
// FtileWhile.java:621-641 -- each child at `x = total.left - child.left`,
// where `total.left = geo.left + 2 * hexagonHalfSize`.
describe('GtileWhile — merger left/width with asymmetric children (D1)', () => {
  it('header left 30 (w 60), body left 10 (w 40): tile.left 54, width 96', () => {
    const header = makeDiamond(60, 40, 30);
    const body = makeTile(40, 80, true, 10);
    const tile = new GtileWhile(header, body, bounder, theme);
    // geo.left = max(30, 10) = 30; tile.left = 30 + 24 = 54.
    expect(tile.left).toBe(54);
    expect(tile.headerOffsetX).toBe(24);
    expect(tile.bodyOffsetX).toBe(44);
    // geo.width = max(60 + 0, 40 + 20) = 60; tile.width = 60 + 36 = 96.
    expect(tile.width).toBe(60 + 3 * HEXAGON_HALF_SIZE);
    expect(tile.getCoord(NORTH_HOOK).x).toBe(54);
    expect(tile.getCoord(SOUTH_HOOK).x).toBe(54);
  });

  it('body left 20 px right of its centre: width = geo.width + 3 * HEXAGON_HALF_SIZE', () => {
    const header = makeDiamond(60, 40); // left 30
    const body = makeTile(120, 80, true, 80); // centre 60, left 80
    const tile = new GtileWhile(header, body, bounder, theme);
    // geo.left = max(30, 80) = 80; tile.left = 80 + 24 = 104.
    expect(tile.left).toBe(104);
    expect(tile.headerOffsetX).toBe(74);
    expect(tile.bodyOffsetX).toBe(24);
    // geo.width = max(50 + 60, 0 + 120) = 120 -- the body term wins here.
    expect(tile.width).toBe(120 + 3 * HEXAGON_HALF_SIZE);
    // both hooks sit on the merged left, so header.SOUTH -> body.NORTH is
    // vertical: header at offsetX=74 puts its own left (30) at 104, body at
    // offsetX=24 puts its own left (80) at 104.
    expect(tile.headerOffsetX + header.getCoord(SOUTH_HOOK).x).toBe(tile.bodyOffsetX + body.getCoord(NORTH_HOOK).x);
  });

  it('body left LEFT of its centre widens the tile on the right', () => {
    const header = makeDiamond(60, 40); // left 30
    const body = makeTile(80, 80, true, 20); // left 20
    const tile = new GtileWhile(header, body, bounder, theme);
    // geo.left = max(30, 20) = 30; tile.left = 30 + 24 = 54.
    expect(tile.left).toBe(54);
    expect(tile.bodyOffsetX).toBe(34);
    // geo.width = max(60 + 0, 80 + 10) = 90; tile.width = 90 + 36 = 126.
    expect(tile.width).toBe(90 + 3 * HEXAGON_HALF_SIZE);
  });

  it('symmetric children: offsets land the composite at tile.left, not width / 2', () => {
    const header = makeDiamond(60, 40);
    const body = makeTile(80, 80);
    const tile = new GtileWhile(header, body, bounder, theme);
    expect(tile.headerOffsetX).toBe(tile.left - 30);
    expect(tile.bodyOffsetX).toBe(tile.left - 40);
    expect(tile.getCoord(NORTH_HOOK).x).toBe(tile.left);
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
