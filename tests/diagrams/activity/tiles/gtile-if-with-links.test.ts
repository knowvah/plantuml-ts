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

// condition '' -> 24x24 hexagon, no west/east label -> diff1/diff2/suppHeight all 0.
const diamond = () => new GtileDiamondInside('', {}, bounder, theme);

describe('GtileIfWithLinks — both branches non-empty, both have a point out', () => {
  const branch1: IfWithLinksBranch = { tile: stubTile(100, 50), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const tile = GtileIfWithLinks.create(diamond(), branch1, branch2, 0);

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

describe('GtileIfWithLinks — branch 1 is asymmetric (nested if, left != width/2)', () => {
  // branch1: raw=100, its own left=70 (20px right of width/2=50); branch2:
  // raw=60, left=30 (symmetric). paddedLeft = branch.left + contentDx
  // (`FtileMinWidthCentered.java:99-106`, `FtileMarged.java:93-97`):
  // b1: contentDx=10, paddedLeft=80, outer=120, paddedRight=40.
  // b2: contentDx=10, paddedLeft=40, outer=80, paddedRight=40.
  // innerMargin = max(b1.paddedRight(40)+b2.paddedLeft(40), 24+20) = 80.
  // nude.left = b1.paddedLeft(80) + 80/2 = 120; nude.width = 80+80+40 = 200.
  // geoA = appendBottom(diamond{12,24,24}, nude{120,200,50}) = {120,200,74}.
  // geoTotal = appendBottom(geoA, merge{12,24,24}) = {120,200,98}.
  // ydelta1a=10, ydelta1b=6 -> totalHeight=114. No labels -> diffs/supp=0.
  const branch1: IfWithLinksBranch = { tile: stubTileAsym(100, 50, 70), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const tile = GtileIfWithLinks.create(diamond(), branch1, branch2, 0);

  it('width === 200, height === 114, left === 120 (not 110, the symmetric value)', () => {
    expect(tile.width).toBe(200);
    expect(tile.height).toBe(114);
    expect(tile.left).toBe(120);
  });

  it('diamond1X === 108 (total.left(120) - diamond1.left(12))', () => {
    expect(tile.diamond1X).toBe(108);
  });

  it('tile1X === 10 (padded box left 0 + contentDx 10) -- contentDx unaffected by asymmetry', () => {
    expect(tile.tile1X).toBe(10);
  });

  it('tile2X === 130 (total.w(200) - w2.outer(80) + contentDx(10))', () => {
    expect(tile.tile2X).toBe(130);
  });

  it('in1To (walker"s absolute target, tile1X + tile1.getCoord(NORTH_HOOK).x) reaches branch1"s own real hook at x=80', () => {
    // `walk-if-with-links.ts#pushInConnectors`'s `in1To` formula, unchanged
    // (D5) -- it already reads `tile1.getCoord(NORTH_HOOK)` directly, so it
    // was never the source of the diagonal; `tile1X` itself (contentDx-only,
    // unaffected by this fix, since branch1 always sits at local x=0) was
    // already correct too. The bug was `diamond1X`/`left`/`mergeX` chasing
    // the WRONG value for where branch1's padded box starts (asserted above).
    const in1ToX = tile.tile1X + branch1.tile.getCoord(NORTH_HOOK).x;
    expect(in1ToX).toBe(80);
  });

  it('mergeX === 108, mergeY === 90 (unaffected -- merge geo never depends on branch left)', () => {
    expect(tile.mergeX).toBe(108);
    expect(tile.mergeY).toBe(90);
  });

  it('getCoord reports the corrected asymmetric left', () => {
    expect(tile.getCoord(NORTH_HOOK)).toEqual({ x: 120, y: 0 });
    expect(tile.getCoord(SOUTH_HOOK)).toEqual({ x: 120, y: 114 });
  });
});

describe('GtileIfWithLinks — one branch lacks a point out (no merge rhombus)', () => {
  const branch1: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40, false), isEmpty: false };
  const tile = GtileIfWithLinks.create(diamond(), branch1, branch2, 0);

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
  const tile = GtileIfWithLinks.create(diamond(), branch1, branch2, 0);

  it('hasPointOut() is false', () => {
    expect(tile.hasPointOut()).toBe(false);
  });
});

describe('GtileIfWithLinks — laned (getSwimlanes().size() > 1) widens ydelta', () => {
  const branch1: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const unlaned = GtileIfWithLinks.create(diamond(), branch1, branch2, 0);
  const laned = GtileIfWithLinks.create(diamond(), branch1, branch2, 2);

  it('ydelta1a goes from 10 to 20, ydelta1b from 6 to 10 (net +14 height)', () => {
    expect(laned.height - unlaned.height).toBe(14);
  });

  it('branchY0 grows by the same 10px as ydelta1a', () => {
    expect(laned.branchY - unlaned.branchY).toBe(10);
  });
});

describe('GtileIfWithLinks — T1p-a conditionEndStyle hline, both branches have a point out', () => {
  // Same branches as the first describe block above, but `conditionEndStyle:
  // 'hline'`: `getShape2`'s own early return wins over `hasTwoBranches()`,
  // so the merge geometry is the `FtileEmpty(0, hexagonHalfSize)`
  // placeholder (height 12) rather than the 24x24 rhombus, REGARDLESS of
  // `hasTwoBranches` -- but `ydelta1b` (the shared base class's own
  // `getYdelta1b`) still reads `hasTwoBranches` directly and is unaffected.
  const branch1: IfWithLinksBranch = { tile: stubTile(100, 50), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const tile = GtileIfWithLinks.create(diamond(), branch1, branch2, 0, { conditionEndStyle: 'hline' });

  // geoTotal = appendBottom(geoA{left:110,w:200,h:74}, merge{left:0,w:0,h:12})
  //          = {left:110,w:200,h:86}. ydelta1a=10, ydelta1b=6 (hasTwoBranches
  // still true) -> totalHeight=102.
  it('width === 200, height === 102 (12px placeholder + ydelta1b(6), not the 24px rhombus)', () => {
    expect(tile.width).toBe(200);
    expect(tile.height).toBe(102);
  });

  it('hasMerge is false even though both branches have a point out', () => {
    expect(tile.hasMerge).toBe(false);
  });

  it('conditionEndStyle is exposed for the walker to dispatch ConnectionVerticalOut/Hline', () => {
    expect(tile.conditionEndStyle).toBe('hline');
  });
});

describe('GtileIfWithLinks — conditionEndStyle defaults to diamond when omitted', () => {
  const branch1: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const tile = GtileIfWithLinks.create(diamond(), branch1, branch2, 0);

  it('defaults conditionEndStyle to diamond', () => {
    expect(tile.conditionEndStyle).toBe('diamond');
  });
});

// Baseline (no notes) for this same branch1/branch2 pair: width=200, height=114,
// left=110, diamond1X=98, diamond1Y=0, tile1X=10, tile2X=130, branchY=34 --
// see the file's own first `describe` block for the full derivation.
// `FtileIfWithDiamonds.java:79-111` (add3-T2a-2, IFNOTE for `with-links`).
describe('GtileIfWithLinks — own LEFT note (add3-T2a-2 IFNOTE)', () => {
  const branch1: IfWithLinksBranch = { tile: stubTile(100, 50), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  // Baseline diamond1X0 = 98; a 150-wide note overhangs it by 52 ->
  // xDeltaNote = 52. yDeltaNote = 30 (the note's own height).
  const note = { text: 'left note', position: 'left' as const, box: { width: 150, height: 30 } };
  const tile = GtileIfWithLinks.create(diamond(), branch1, branch2, 0, { notes: [note] });

  it('widens by xDeltaNote(52) + suppWidthNode(0): 200 -> 252', () => {
    expect(tile.width).toBe(252);
  });

  it('grows by yDeltaNote(30), baked into the nude section once: 114 -> 144', () => {
    expect(tile.height).toBe(144);
  });

  it('diamond1X shifts right by xDeltaNote: 98 -> 150', () => {
    expect(tile.diamond1X).toBe(150);
  });

  it('diamond1Y drops by yDeltaNote to make room for the note above it: 0 -> 30', () => {
    expect(tile.diamond1Y).toBe(30);
  });

  it('tile1X shifts right by xDeltaNote: 10 -> 62', () => {
    expect(tile.tile1X).toBe(62);
  });

  it('tile2X shifts right by xDeltaNote too -- the whole composite widened, branch2 stays anchored to the (new) right edge: 130 -> 182', () => {
    expect(tile.tile2X).toBe(182);
  });

  it('branchY drops by yDeltaNote too, same as diamond1Y: 34 -> 64', () => {
    expect(tile.branchY).toBe(64);
  });

  it("noteY sits at the composite's own top, 0 -- the room `diamond1Y`/`branchY` dropped into", () => {
    expect(tile.noteY).toBe(0);
  });

  it('exposes the note on opaleLeft, opaleRight stays null', () => {
    expect(tile.opaleLeft).toEqual(note);
    expect(tile.opaleRight).toBeNull();
  });
});

describe('GtileIfWithLinks — own RIGHT note (add3-T2a-2 IFNOTE)', () => {
  const branch1: IfWithLinksBranch = { tile: stubTile(100, 50), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  // pos1 = diamond1X0(98) + diamond1.width(24) + 90 = 212; pos2 = baseline
  // totalWidth(200); suppWidthNode = 212 - 200 = 12. yDeltaNote = 20.
  const note = { text: 'right note', position: 'right' as const, box: { width: 90, height: 20 } };
  const tile = GtileIfWithLinks.create(diamond(), branch1, branch2, 0, { notes: [note] });

  it('widens by suppWidthNode(12): 200 -> 212', () => {
    expect(tile.width).toBe(212);
  });

  it('grows by yDeltaNote(20): 114 -> 134', () => {
    expect(tile.height).toBe(134);
  });

  it('diamond1X is UNCHANGED by a right note (98)', () => {
    expect(tile.diamond1X).toBe(98);
  });

  it('diamond1Y drops by yDeltaNote: 0 -> 20', () => {
    expect(tile.diamond1Y).toBe(20);
  });

  it('tile2X is UNCHANGED -- suppWidthNode cancels out of its own formula (branch2 stays put; only the right edge grows)', () => {
    expect(tile.tile2X).toBe(130);
  });

  it('exposes the note on opaleRight, opaleLeft stays null', () => {
    expect(tile.opaleRight).toEqual(note);
    expect(tile.opaleLeft).toBeNull();
  });
});

describe('GtileIfWithLinks — a second same-side note is silently dropped (FtileIfWithDiamonds.java:85-86,96-97)', () => {
  const branch1: IfWithLinksBranch = { tile: stubTile(100, 50), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const first = { text: 'first', position: 'left' as const, box: { width: 150, height: 30 } };
  const second = { text: 'second', position: 'left' as const, box: { width: 300, height: 99 } };
  const tile = GtileIfWithLinks.create(diamond(), branch1, branch2, 0, { notes: [first, second] });

  it('keeps only the FIRST left note (encounter order)', () => {
    expect(tile.opaleLeft).toEqual(first);
  });

  it('the dropped second note never widens/heightens the composite (same geometry as the single-note case)', () => {
    expect(tile.width).toBe(252);
    expect(tile.height).toBe(144);
  });
});

describe('GtileIfWithLinks — both LEFT and RIGHT notes together', () => {
  const branch1: IfWithLinksBranch = { tile: stubTile(100, 50), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const left = { text: 'left', position: 'left' as const, box: { width: 150, height: 30 } };
  const right = { text: 'right', position: 'right' as const, box: { width: 90, height: 20 } };
  const tile = GtileIfWithLinks.create(diamond(), branch1, branch2, 0, { notes: [left, right] });

  it('yDeltaNote is the TALLER of the two notes (30, not 20)', () => {
    expect(tile.diamond1Y).toBe(30);
  });

  it('carries both xDeltaNote (from LEFT) and suppWidthNode (from RIGHT, read with xDeltaNote already applied)', () => {
    // pos1(right) now reads diamond1X AFTER the left note's own xDeltaNote
    // (150) + diamond1.width(24) + 90 = 264; pos2 = geoTotal.width at that
    // point (xDeltaNote=52, suppWidthNode=0) = 252 + 0 = 252 (same nude
    // width as the LEFT-only case, since suppWidthNode is still 0 here).
    // suppWidthNode = 264 - 252 = 12.
    expect(tile.width).toBe(252 + 12);
  });

  it('exposes both notes', () => {
    expect(tile.opaleLeft).toEqual(left);
    expect(tile.opaleRight).toEqual(right);
  });
});
