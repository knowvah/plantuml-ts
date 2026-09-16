import { describe, expect, it } from 'vitest';
import { GtileIfDown } from '../../../../src/diagrams/activity/tiles/gtile-if-down.js';
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

/** A branch whose own reported `left` differs from `width / 2` -- stands in
 *  for a nested `if`/`GtileTopDown` merged subtree (T6c). */
function stubTileAsym(width: number, height: number, left: number, hasPointOut = true): Tile {
  return {
    kind: 'stub-asym',
    width,
    height,
    getCoord: (hook) =>
      hook === NORTH_HOOK || hook === SOUTH_HOOK ? { x: left, y: hook === NORTH_HOOK ? 0 : height } : { x: 0, y: 0 },
    hasPointOut: () => hasPointOut,
  };
}

describe('GtileIfDown — merge rhombus case (no optionalStop, both branches have a point out)', () => {
  // condition '' -> 24x24 hexagon; south "yes" (21x14), east "no" (14x14) -- neither
  // affects diamond1.height (north unset).
  const diamond1 = new GtileDiamondInside('', { south: 'yes', east: 'no' }, bounder, theme);
  const mainTile = stubTile(100, 50);
  const tile = new GtileIfDown(diamond1, mainTile, null, true, false);

  // d1Geo{left:12,w:24,h:24}; thenPadded outer=120,contentDx=10; thenGeo{left:60,w:120,h:50};
  // d2{left:12,w:24,h:24} (hasTwoBranches, no optionalStop).
  // geoA=appendBottom(d1,then)={left:60,w:120,h:74}; geo=appendBottom(geoA,d2)={left:60,w:120,h:98}.
  // southLabelHeight=14 -> height=98+36+14=148; width=120+12=132.
  it('width === 132, height === 148, left === 60', () => {
    expect(tile.width).toBe(132);
    expect(tile.height).toBe(148);
    expect(tile.left).toBe(60);
  });

  it('diamond1X === 48 and diamond2X === 48 (both 24-wide, centered on the same left)', () => {
    expect(tile.offsets.diamond1X).toBe(48);
    expect(tile.offsets.diamond2X).toBe(48);
  });

  it('mainTileX === 10 (wrapX 0 + contentDx 10), mainTileY === 49', () => {
    expect(tile.offsets.mainTileX).toBe(10);
    expect(tile.offsets.mainTileY).toBe(49);
  });

  it('diamond2Y === 124 (height 148 - merge height 24) and reaches the tile bottom', () => {
    expect(tile.offsets.diamond2Y).toBe(124);
    expect(tile.offsets.diamond2Y + tile.offsets.diamond2Size).toBe(tile.height);
  });

  it('hasMergeNode is true; hasPointOut() is true', () => {
    expect(tile.hasMergeNode).toBe(true);
    expect(tile.hasPointOut()).toBe(true);
  });

  it('getCoord reports the asymmetric left, not width/2', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 60, y: 0 });
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 60, y: 148 });
  });
});

describe('GtileIfDown — main flow is asymmetric (nested if, left != width/2)', () => {
  // condition '' -> d1Geo{left:12,w:24,h:24}. mainTile: raw=100, own
  // left=70 (20px right of width/2=50). thenPadded: min=100,outer=120,
  // contentDx=10, paddedLeft = 70+10 = 80 (`FtileMinWidthCentered.java:
  // 99-106`, `FtileMarged.java:93-97` -- NOT outer/2=60).
  // thenGeo{left:80,w:120,h:50}. geoA=appendBottom(d1,then)={80,120,74}.
  // d2 (hasTwoBranches, no optionalStop) = {left:12,w:24,h:24}.
  // geo=appendBottom(geoA,d2)={80,120,98}. height=98+36+12=146; width=132.
  const diamond1 = new GtileDiamondInside('', {}, bounder, theme);
  const mainTile = stubTileAsym(100, 50, 70);
  const tile = new GtileIfDown(diamond1, mainTile, null, true, false);

  it('width === 132, height === 146, left === 80 (not 60, the symmetric value)', () => {
    expect(tile.width).toBe(132);
    expect(tile.height).toBe(146);
    expect(tile.left).toBe(80);
  });

  it('diamond1X === 68 and diamond2X === 68 (both follow the corrected left)', () => {
    expect(tile.offsets.diamond1X).toBe(68);
    expect(tile.offsets.diamond2X).toBe(68);
  });

  it('wrapX === 0 (thenGeo.left already equals core.left) and mainTileX === 10', () => {
    expect(tile.offsets.wrapX).toBe(0);
    expect(tile.offsets.mainTileX).toBe(10);
  });

  it('ConnectionIn/ConnectionOut are single vertical segments: diamond1"s centre and mainTile"s own real hook land on the SAME absolute x', () => {
    const diamond1CentreX = tile.offsets.diamond1X + diamond1.width / 2;
    const mainHookX = tile.offsets.mainTileX + mainTile.getCoord(NORTH_HOOK).x;
    expect(diamond1CentreX).toBe(80);
    expect(mainHookX).toBe(80);
    expect(diamond1CentreX).toBe(mainHookX);
  });

  it('getCoord reports the corrected asymmetric left', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 80, y: 0 });
  });
});

describe('GtileIfDown — optionalStop case (empty main flow, side box east of the hexagon)', () => {
  // condition 'dummy' (35x14) -> hexagonAlone {width:59,height:24}; diamond1.height=24.
  const diamond1 = new GtileDiamondInside('dummy', { east: 'foo' }, bounder, theme);
  const mainTile = stubTile(0, 0); // an empty pass-through branch
  const optionalStop = stubTile(40, 30);
  const tile = new GtileIfDown(diamond1, mainTile, optionalStop, false, false);

  // d1Geo{left:29.5,w:59,h:24}; thenPadded(0): outer=50,contentDx=25; thenGeo{left:25,w:50,h:0};
  // d2 (optionalStop) = {left:0,w:0,h:0}.
  // geo = appendBottom(appendBottom(d1,then),d2) = {left:29.5,w:59,h:24}.
  // height=24+36+max(12,0)=72. additionalWidth=max(40,21+20)=41; width=59+12+40+41=152.
  it('width === 152, height === 72, left === 29.5', () => {
    expect(tile.width).toBe(152);
    expect(tile.height).toBe(72);
    expect(tile.left).toBe(29.5);
  });

  it('no if-merge node: diamond2Size === 0', () => {
    expect(tile.hasMergeNode).toBe(false);
    expect(tile.offsets.diamond2Size).toBe(0);
  });

  it('the stop sits east of the hexagon: stopX === 100, stopY === -3', () => {
    expect(tile.stop.stopX).toBe(100);
    expect(tile.stop.stopY).toBe(-3);
  });

  it('hasPointOut() is true (the main flow itself still has a point out)', () => {
    expect(tile.hasPointOut()).toBe(true);
  });

  it('withoutPointOut fires when the main flow itself lacks a point out', () => {
    const noOut = new GtileIfDown(diamond1, stubTile(0, 0, false), optionalStop, false, false);
    expect(noOut.hasPointOut()).toBe(false);
  });
});

describe('GtileIfDown — main flow ends without a point out, no optionalStop (ElseNoDiamond)', () => {
  const diamond1 = new GtileDiamondInside('', {}, bounder, theme);
  const mainTile = stubTile(80, 60, false);
  const tile = new GtileIfDown(diamond1, mainTile, null, false, false);

  // d1Geo{left:12,w:24,h:24}; thenPadded(80): outer=100,contentDx=10; thenGeo{left:50,w:100,h:60};
  // d2 (no optionalStop, !hasTwoBranches) = {left:0,w:0,h:6}.
  // geo = {left:50,w:100,h:90}; height=90+36+12=138; width=100+12=112.
  it('width === 112, height === 138 (diamond2 the 6px invisible placeholder)', () => {
    expect(tile.width).toBe(112);
    expect(tile.height).toBe(138);
  });

  it('no if-merge node even though optionalStop is null', () => {
    expect(tile.hasMergeNode).toBe(false);
  });

  it('hasThenPointOut is false, but the whole tile still reports a point out', () => {
    expect(tile.hasThenPointOut).toBe(false);
    expect(tile.hasPointOut()).toBe(true);
  });
});

describe('GtileIfDown — useElse1 is threaded through unchanged', () => {
  const diamond1 = new GtileDiamondInside('', {}, bounder, theme);
  const tile = new GtileIfDown(diamond1, stubTile(40, 20), null, true, true);

  it('useElse1 is exposed for the walker to select Else1 over Else2', () => {
    expect(tile.useElse1).toBe(true);
  });
});
