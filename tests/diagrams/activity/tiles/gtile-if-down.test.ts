import { describe, expect, it } from 'vitest';
import { GtileIfDown } from '../../../../src/diagrams/activity/tiles/gtile-if-down.js';
import { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';
import type { IfOwnNote } from '../../../../src/diagrams/activity/tiles/gtile-note.js';
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
  const tile = new GtileIfDown(diamond1, mainTile, null, { hasTwoBranches: true, useElse1: false });

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
  const tile = new GtileIfDown(diamond1, mainTile, null, { hasTwoBranches: true, useElse1: false });

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
  const tile = new GtileIfDown(diamond1, mainTile, optionalStop, { hasTwoBranches: false, useElse1: false });

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
    const noOut = new GtileIfDown(diamond1, stubTile(0, 0, false), optionalStop, {
      hasTwoBranches: false,
      useElse1: false,
    });
    expect(noOut.hasPointOut()).toBe(false);
  });
});

describe('GtileIfDown — main flow ends without a point out, no optionalStop (ElseNoDiamond)', () => {
  const diamond1 = new GtileDiamondInside('', {}, bounder, theme);
  const mainTile = stubTile(80, 60, false);
  const tile = new GtileIfDown(diamond1, mainTile, null, { hasTwoBranches: false, useElse1: false });

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
  const tile = new GtileIfDown(diamond1, stubTile(40, 20), null, { hasTwoBranches: true, useElse1: true });

  it('useElse1 is exposed for the walker to select Else1 over Else2', () => {
    expect(tile.useElse1).toBe(true);
  });
});

describe('GtileIfDown — T1p-a conditionEndStyle hline (no optionalStop, hasTwoBranches)', () => {
  // Same diamond1/mainTile as the merge-rhombus describe above, but
  // `conditionEndStyle: 'hline'`: `getShape2`'s own early return
  // (`ConditionalBuilder.java:287-288`) wins over `hasTwoBranches()`, so
  // `diamond2` is the `FtileEmpty(0, hexagonHalfSize)` placeholder
  // (left:0, width:0, height:12) regardless -- not the 24x24 rhombus.
  const diamond1 = new GtileDiamondInside('', { south: 'yes', east: 'no' }, bounder, theme);
  const mainTile = stubTile(100, 50);
  const tile = new GtileIfDown(diamond1, mainTile, null, {
    hasTwoBranches: true,
    useElse1: false,
    conditionEndStyle: 'hline',
  });

  // geoA=appendBottom(d1,then)={left:60,w:120,h:74}; d2{left:0,w:0,h:12}.
  // geo=appendBottom(geoA,d2)={left:60,w:120,h:86}. height=86+36+14=136;
  // width=120+12=132 (unaffected -- `hasOptionalStop` is false either way).
  it('width === 132, height === 136 (the 12px hline placeholder, not the 24px rhombus)', () => {
    expect(tile.width).toBe(132);
    expect(tile.height).toBe(136);
  });

  it('diamond2Size === 0 and hasMergeNode is false, even though hasTwoBranches is true', () => {
    expect(tile.offsets.diamond2Size).toBe(0);
    expect(tile.hasMergeNode).toBe(false);
  });

  it('diamond2PointInY is half the placeholder height (6), not 0', () => {
    expect(tile.offsets.diamond2PointInY).toBe(6);
  });

  it('conditionEndStyle is exposed for the walker to dispatch ElseHline/Hline', () => {
    expect(tile.conditionEndStyle).toBe('hline');
  });
});

describe('GtileIfDown — conditionEndStyle defaults to diamond when omitted', () => {
  const diamond1 = new GtileDiamondInside('', {}, bounder, theme);
  const tile = new GtileIfDown(diamond1, stubTile(40, 20), null, { hasTwoBranches: true, useElse1: false });

  it('defaults conditionEndStyle and diamond2PointInY to the pre-T1p-a values', () => {
    expect(tile.conditionEndStyle).toBe('diamond');
    expect(tile.offsets.diamond2PointInY).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// IFNOTE (mission `activity-divergence-drive-3` T2a): `FtileIfDown.java:
// 116-120,523-529` -- this file's own former D8 placeholder ("opale ... is
// out of scope") is now wired. Same base scenario as the file's own first
// describe block (diamond1 24x24, mainTile 100x50, no optionalStop,
// hasTwoBranches=true -- pre-note: left=60, width=132, height=148) so the
// delta each note width introduces is isolated and easy to hand-verify.
// ---------------------------------------------------------------------------

function note(text: string, position: 'left' | 'right'): IfOwnNote {
  // Mirrors `measureIfOwnNote`/`measureOpaleText`'s own formula
  // (`Opale.java:89-96`) against this file's stub bounder (7px/char width,
  // 14px line height, both independent of fontSize): width = text.length*7
  // + marginX1(6) + marginX2(15); height = 14 + 2*marginY(5).
  return { text, position, box: { width: text.length * 7 + 21, height: 14 + 10 } };
}

describe('GtileIfDown — IFNOTE, note narrower than the natural left margin (supp === 0)', () => {
  // note.width = 1*7+21 = 28, less than geo.left (60) -> supp = 0: only
  // height grows (opaleHeight = 24), left/width are UNCHANGED from the
  // no-note case above.
  const diamond1 = new GtileDiamondInside('', { south: 'yes', east: 'no' }, bounder, theme);
  const mainTile = stubTile(100, 50);
  const opale = note('n', 'right');
  const tile = new GtileIfDown(diamond1, mainTile, null, { hasTwoBranches: true, useElse1: false, opale });

  it('width/left unchanged (132/60), height grows by exactly opaleHeight (148 -> 172)', () => {
    expect(tile.width).toBe(132);
    expect(tile.left).toBe(60);
    expect(tile.height).toBe(172);
  });

  it('diamond1Y === opale.box.height (24), pushing diamond1 down to reserve room above it', () => {
    expect(tile.diamond1Y).toBe(24);
  });

  it('getCoord(NORTH_HOOK).y tracks diamond1Y, not a hardcoded 0', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 60, y: 24 });
  });

  it('stores the note for the walker to draw', () => {
    expect(tile.opale).toBe(opale);
  });

  // add3-T3c: `getTranslateForThen` (`FtileIfDown.java:624-637`) leads
  // with `opaleHeight` AND subtracts it again inside the centering
  // remainder -- the original IFNOTE landing updated `diamond1Y` but left
  // `mainTileY` at the pre-note formula (missing both `opaleHeight` terms),
  // which shifted every then-branch action up by exactly `opaleHeight/2`
  // (12 here) whenever an if-down owned a note. Caught on the jar-rendered
  // corpus (`zakuke-30-sobi867`/`jisema-42-rapa121`/`nijipa-25-pede639`/
  // `rucuga-83-tosu408`/`jipapo-14-kevu587`/`vexula-75-noko098`): mainTileY
  // = opaleHeight(24) + d1Height(24) + (height(172) - opaleHeight(24) -
  // d1Height(24) - d2Height(24) - thenHeight(50)) / 2 = 48 + 25 = 73.
  it('offsets.mainTileY leads with opaleHeight, not just d1Height (73, not 61)', () => {
    expect(tile.offsets.mainTileY).toBe(73);
  });
});

describe('GtileIfDown — IFNOTE, note wider than the natural left margin (supp > 0)', () => {
  // note.width = 20*7+21 = 161, wider than geo.left (60) -> supp = 161-60
  // = 101: width widens by supp, left becomes opaleWidth + diamond1.width/2
  // = 161 + 12 = 173 (FtileIfDown.java:567-571's own `supp > 0` branch).
  const diamond1 = new GtileDiamondInside('', { south: 'yes', east: 'no' }, bounder, theme);
  const mainTile = stubTile(100, 50);
  const opale = note('a'.repeat(20), 'left');
  const tile = new GtileIfDown(diamond1, mainTile, null, { hasTwoBranches: true, useElse1: false, opale });

  it('left === 173, width === 233 (132 + supp 101)', () => {
    expect(tile.left).toBe(173);
    expect(tile.width).toBe(233);
  });

  it('diamond1X shifts right to make room: offsets.diamond1X === left - diamond1.width/2', () => {
    expect(tile.offsets.diamond1X).toBe(173 - 12);
  });
});

describe('GtileIfDown — IFNOTE, no note is the pre-T2a geometry exactly (opale omitted)', () => {
  const diamond1 = new GtileDiamondInside('', { south: 'yes', east: 'no' }, bounder, theme);
  const mainTile = stubTile(100, 50);
  const tile = new GtileIfDown(diamond1, mainTile, null, { hasTwoBranches: true, useElse1: false });

  it('opale is null; diamond1Y is 0; width/height match the no-note case', () => {
    expect(tile.opale).toBeNull();
    expect(tile.diamond1Y).toBe(0);
    expect(tile.width).toBe(132);
    expect(tile.height).toBe(148);
  });
});

describe('GtileIfDown — skinparam padding pads the merge rhombus north label (add4-T3e)', () => {
  // `withNorth(tbout1)` with `tbout1` = `Display.NULL` -> an empty padded
  // Sheet 2p tall (`ConditionalBuilder.java:292-303`, `SheetBlock1.java:196-199`);
  // `FtileDiamond#calculateDimensionFtile` adds it to height and inY
  // (`FtileDiamond.java:108-112`). Same geometry as the first describe, p = 5.
  const diamond1 = new GtileDiamondInside('', { south: 'yes', east: 'no' }, bounder, theme);
  const tile = new GtileIfDown(diamond1, stubTile(100, 50), null, {
    hasTwoBranches: true,
    useElse1: false,
    padding: 5,
  });

  it('height grows by 2p (148 -> 158); the rhombus node sits 2p below its tile top', () => {
    expect(tile.height).toBe(158);
    expect(tile.offsets.diamond2Y).toBe(134);
    expect(tile.offsets.diamond2Size).toBe(24);
    expect(tile.offsets.diamond2Y + tile.offsets.diamond2Size).toBe(tile.height);
  });

  it('the main flow keeps its place above the taller merge (mainTileY 49)', () => {
    // (158 - 24 - (24 + 10) - 50) / 2 + 24 = 49
    expect(tile.offsets.mainTileY).toBe(49);
  });

  it('an optionalStop or hline diamond2 carries no north label', () => {
    const stop = new GtileIfDown(diamond1, stubTile(100, 50), stubTile(20, 20), {
      hasTwoBranches: true,
      useElse1: false,
      padding: 5,
    });
    const hline = new GtileIfDown(diamond1, stubTile(100, 50), null, {
      hasTwoBranches: true,
      useElse1: false,
      conditionEndStyle: 'hline',
      padding: 5,
    });
    const unpaddedStop = new GtileIfDown(diamond1, stubTile(100, 50), stubTile(20, 20), {
      hasTwoBranches: true,
      useElse1: false,
    });
    expect(stop.height).toBe(unpaddedStop.height);
    expect(stop.offsets.diamond2Y).toBe(unpaddedStop.offsets.diamond2Y);
    expect(hline.height).toBe(136);
  });
});
