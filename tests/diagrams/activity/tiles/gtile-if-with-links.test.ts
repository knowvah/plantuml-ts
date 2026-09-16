import { describe, expect, it } from 'vitest';
import { GtileIfWithLinks } from '../../../../src/diagrams/activity/tiles/gtile-if-with-links.js';
import type { IfWithLinksBranch } from '../../../../src/diagrams/activity/tiles/gtile-if-with-links.js';
import { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

const bounder: StringBounder = {
  getDimension: (text: string, _size: number) => ({ width: text.length * 7, height: 14 }),
};
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

function stubTile(width: number, height: number, hasPointOut = true): Tile {
  return {
    kind: 'stub',
    width,
    height,
    getCoord: (hook) =>
      hook === NORTH_HOOK || hook === SOUTH_HOOK
        ? { x: width / 2, y: hook === NORTH_HOOK ? 0 : height }
        : { x: 0, y: 0 },
    hasPointOut: () => hasPointOut,
  };
}

// condition '' -> 24x24 hexagon, no west/east label -> diff1/diff2/suppHeight all 0.
const diamond = () => new GtileDiamondInside('', {}, bounder, theme);

describe('GtileIfWithLinks — both branches non-empty, both have a point out', () => {
  const branch1: IfWithLinksBranch = { tile: stubTile(100, 50), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const tile = new GtileIfWithLinks(diamond(), branch1, branch2, 0);

  // innerMargin = max(120/2+80/2, 24+20) = 100; nude = {left:110,width:200,height:50}
  // geoA = appendBottom(diamond{left:12,w:24,h:24}, nude) = {left:110,width:200,height:74}
  // geoTotal = appendBottom(geoA, merge{left:12,w:24,h:24}) = {left:110,width:200,height:98}
  // ydelta1a=10, ydelta1b=6 (unlaned, hasTwoBranches) -> totalHeight=114

  it('width === 200 (the nude section, unaffected by the merge rhombus)', () => {
    expect(tile.width).toBe(200);
  });

  it('height === 114 (98 + ydelta1a(10) + ydelta1b(6))', () => {
    expect(tile.height).toBe(114);
  });

  it('diamond1X === 98 (total.left - diamond1.left)', () => {
    expect(tile.diamond1X).toBe(98);
  });

  it('diamond1Y === 0 (no branch label taller than the hexagon)', () => {
    expect(tile.diamond1Y).toBe(0);
  });

  it('tile1X === 10 (padded box left 0 + contentDx 10)', () => {
    expect(tile.tile1X).toBe(10);
  });

  it('tile2X === 130 (total.w(200) - w2.outer(80) + contentDx(10))', () => {
    expect(tile.tile2X).toBe(130);
  });

  it('branchY === 34 (diamond1.height(24) + ydelta1a(10))', () => {
    expect(tile.branchY).toBe(34);
  });

  it('hasMerge is true and the merge rhombus reaches the tile bottom', () => {
    expect(tile.hasMerge).toBe(true);
    expect(tile.mergeX).toBe(98);
    expect(tile.mergeY).toBe(90);
    expect(tile.mergeY + tile.mergeSize).toBe(tile.height);
  });

  it('hasPointOut() is true (OR of both branches)', () => {
    expect(tile.hasPointOut()).toBe(true);
  });

  it('getCoord uses the tile"s own asymmetric left, not width/2', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 110, y: 0 });
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 110, y: 114 });
  });
});

describe('GtileIfWithLinks — one branch lacks a point out (no merge rhombus)', () => {
  const branch1: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40, false), isEmpty: false };
  const tile = new GtileIfWithLinks(diamond(), branch1, branch2, 0);

  it('hasMerge is false (hasTwoBranches requires BOTH to have a point out)', () => {
    expect(tile.hasMerge).toBe(false);
  });

  it('hasPointOut() is still true (branch1 alone has one)', () => {
    expect(tile.hasPointOut()).toBe(true);
  });
});

describe('GtileIfWithLinks — neither branch has a point out', () => {
  const branch1: IfWithLinksBranch = { tile: stubTile(60, 40, false), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40, false), isEmpty: false };
  const tile = new GtileIfWithLinks(diamond(), branch1, branch2, 0);

  it('hasPointOut() is false', () => {
    expect(tile.hasPointOut()).toBe(false);
  });
});

describe('GtileIfWithLinks — laned (getSwimlanes().size() > 1) widens ydelta', () => {
  const branch1: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const unlaned = new GtileIfWithLinks(diamond(), branch1, branch2, 0);
  const laned = new GtileIfWithLinks(diamond(), branch1, branch2, 2);

  it('ydelta1a goes from 10 to 20, ydelta1b from 6 to 10 (net +14 height)', () => {
    expect(laned.height - unlaned.height).toBe(14);
  });

  it('branchY0 grows by the same 10px as ydelta1a', () => {
    expect(laned.branchY - unlaned.branchY).toBe(10);
  });
});
