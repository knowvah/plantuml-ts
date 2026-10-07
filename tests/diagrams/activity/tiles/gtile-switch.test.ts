import { describe, expect, it } from 'vitest';
import { GtileSwitch } from '../../../../src/diagrams/activity/tiles/gtile-switch.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import type { GPoint, HookName } from '../../../../src/diagrams/activity/tiles/points.js';

// `FtileSwitchNude.xSeparation` / `FtileSwitchWithDiamonds.SUPP15` /
// `#getYdelta1b` -- see `gtile-switch-geometry.ts`'s own citations.
const SWITCH_X_SEPARATION = 20;
const SWITCH_SUPP15 = 15;
const SWITCH_YDELTA1B = 10;
// `FtileSwitchNude#calculateDimensionInternalSlow`'s fixed `100` pad.
const NUDE_HEIGHT_PAD = 100;
// `FtileSwitchWithManyLinks#getYdelta1a`'s `max(10, ...) + 10` floor/tail,
// with no case labels measured (every stub label is `undefined`).
const YDELTA1A_NO_LABELS = 20;

const bounder: StringBounder = {
  getDimension: (_text: string, _size: number) => ({ width: 0, height: 0 }),
};

// A REAL resolved theme, not a `{ fontSize, fontFamily } as unknown as
// Theme` stub -- the tiles resolve per-element style through
// `activityFontSize` (`activity-style-defaults.ts`), which reads
// `theme.colors.elements`.
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

// A symmetric leaf: `NORTH_HOOK`/`SOUTH_HOOK` sit at `width/2` (every
// production leaf's own invariant, `gtile-switch-geometry.ts#leftOf`'s
// own doc), `EAST_HOOK`/`WEST_HOOK` at mid-height.
function makeTile(width: number, height: number, hasPointOut = true): Tile {
  return {
    kind: 'stub',
    width,
    height,
    getCoord: (hook: HookName): GPoint => {
      switch (hook) {
        case EAST_HOOK:
          return { x: width, y: height / 2 };
        case WEST_HOOK:
          return { x: 0, y: height / 2 };
        case SOUTH_HOOK:
          return { x: width / 2, y: height };
        default:
          return { x: width / 2, y: 0 };
      }
    },
    hasPointOut: () => hasPointOut,
  };
}

// `GtileDiamondInside` stub -- same symmetric-leaf shape as `makeTile`,
// since only width/height/getCoord matter for `GtileSwitch` geometry.
function makeDiamond(width: number, height: number) {
  return { ...makeTile(width, height), kind: 'gtile-diamond-inside' as const, label: '' };
}

describe('GtileSwitch — SMALL_DIAMOND, 2 cases, no merge diamond', () => {
  // w13 = 60 - 40 - 40 = -20 <= w9(0) -> SMALL_DIAMOND.
  const diamond = makeDiamond(60, 40);
  const case0 = makeTile(80, 100);
  const case1 = makeTile(80, 60);
  const tile = new GtileSwitch(diamond, [{ tile: case0 }, { tile: case1 }], null, bounder, theme);
  const nudeWidth = 80 + 80 + SWITCH_X_SEPARATION;
  const nudeHeight = 100 + NUDE_HEIGHT_PAD;
  const caseOffsetY = diamond.height + YDELTA1A_NO_LABELS;

  it('isBigDiamond is false', () => {
    expect(tile.isBigDiamond).toBe(false);
  });

  it('width === max(diamond.width, nudeWidth)', () => {
    expect(tile.width).toBe(nudeWidth);
  });

  it('caseOffsets are left-to-right, xSeparation apart, same Y', () => {
    expect(tile.caseOffsets[0]).toEqual({ x: 0, y: caseOffsetY });
    expect(tile.caseOffsets[1]).toEqual({ x: 80 + SWITCH_X_SEPARATION, y: caseOffsetY });
  });

  it('mergeOffset is null', () => {
    expect(tile.mergeOffset).toBeNull();
  });

  it('height === diamond.height + nudeHeight + Ydelta1a (no merge)', () => {
    expect(tile.height).toBe(diamond.height + nudeHeight + YDELTA1A_NO_LABELS);
  });

  it('diamondOffset centers diamond1 within the total width', () => {
    expect(tile.diamondOffset).toEqual({ x: (tile.width - diamond.width) / 2, y: 0 });
  });

  it('children has diamond and 2 case tiles', () => {
    expect(tile.children).toHaveLength(3);
    expect(tile.children[0]).toBe(diamond);
    expect(tile.children[1]).toBe(case0);
    expect(tile.children[2]).toBe(case1);
  });
});

describe('GtileSwitch — SMALL_DIAMOND, 2 cases with merge diamond', () => {
  const diamond = makeDiamond(60, 40);
  const case0 = makeTile(80, 100);
  const case1 = makeTile(80, 60);
  const merge = makeDiamond(60, 40);
  const tile = new GtileSwitch(diamond, [{ tile: case0 }, { tile: case1 }], merge, bounder, theme);
  const nudeHeight = 100 + NUDE_HEIGHT_PAD;

  it('mergeOffset is non-null', () => {
    expect(tile.mergeOffset).not.toBeNull();
  });

  it('height === diamond.height + nudeHeight + merge.height + Ydelta1a + Ydelta1b', () => {
    expect(tile.height).toBe(diamond.height + nudeHeight + merge.height + YDELTA1A_NO_LABELS + SWITCH_YDELTA1B);
  });

  it('mergeOffset sits flush at the bottom, centered on pivotLeft', () => {
    expect(tile.mergeOffset).toEqual({ x: tile.width / 2 - merge.width / 2, y: tile.height - merge.height });
  });

  it('children includes merge diamond', () => {
    expect(tile.children).toHaveLength(4);
    expect(tile.children[3]).toBe(merge);
  });
});

describe('GtileSwitch — BIG_DIAMOND, 2 cases', () => {
  // w13 = 300 - 40 - 40 = 220 > w9(0) -> BIG_DIAMOND.
  const diamond = makeDiamond(300, 40);
  const case0 = makeTile(80, 100);
  const case1 = makeTile(80, 60);
  const tile = new GtileSwitch(diamond, [{ tile: case0 }, { tile: case1 }], null, bounder, theme);
  const w13 = 300 - 40 - 40;

  it('isBigDiamond is true', () => {
    expect(tile.isBigDiamond).toBe(true);
  });

  it('width === tile0.width + SUPP15 + w13 + SUPP15 + tileLast.width', () => {
    expect(tile.width).toBe(80 + SWITCH_SUPP15 + w13 + SWITCH_SUPP15 + 80);
  });

  it('caseOffsets[0] === 0 (first case flush at the left edge)', () => {
    expect(tile.caseOffsets[0]!.x).toBe(0);
  });

  it('caseOffsets[last].x + caseLast.width === total width (flush right edge)', () => {
    expect(tile.caseOffsets[1]!.x + case1.width).toBe(tile.width);
  });

  it('both cases share the same Y (the top hline)', () => {
    expect(tile.caseOffsets[0]!.y).toBe(tile.caseOffsets[1]!.y);
  });
});

describe('GtileSwitch — hooks', () => {
  const diamond = makeDiamond(60, 40);
  const case0 = makeTile(80, 100);
  const case1 = makeTile(80, 60);
  const tile = new GtileSwitch(diamond, [{ tile: case0 }, { tile: case1 }], null, bounder, theme);

  it('NORTH_HOOK.y === 0', () => {
    expect(tile.getCoord(NORTH_HOOK).y).toBe(0);
  });

  it('SOUTH_HOOK.y === height', () => {
    expect(tile.getCoord(SOUTH_HOOK).y).toBe(tile.height);
  });

  it('EAST_HOOK.x === width', () => {
    expect(tile.getCoord(EAST_HOOK).x).toBe(tile.width);
  });

  it('WEST_HOOK.x === 0', () => {
    expect(tile.getCoord(WEST_HOOK).x).toBe(0);
  });
});

// `FtileSwitchNude#calculateDimensionFtile` (`:116-124`): iterates every
// CASE tile and returns WITH an out point as soon as one `hasPointOut()`;
// otherwise without.
describe('GtileSwitch — hasPointOut() is true iff any case has one', () => {
  const diamond = makeDiamond(60, 40);

  it('is true when only one case continues', () => {
    const tile = new GtileSwitch(
      diamond,
      [{ tile: makeTile(80, 100, false) }, { tile: makeTile(80, 60, true) }],
      null,
      bounder,
      theme,
    );
    expect(tile.hasPointOut()).toBe(true);
  });

  it('is false when every case ends in a stop', () => {
    const tile = new GtileSwitch(
      diamond,
      [{ tile: makeTile(80, 100, false) }, { tile: makeTile(80, 60, false) }],
      null,
      bounder,
      theme,
    );
    expect(tile.hasPointOut()).toBe(false);
  });
});

// `isBigDiamond` ports `FtileSwitchWithDiamonds`'s constructor
// (`vcompact/cond/FtileSwitchWithDiamonds.java:73-90`). Every stub tile
// here is a SYMMETRIC leaf (`makeTile`'s own doc), so `leftOf == rightOf
// == width/2` throughout.
describe('GtileSwitch — isBigDiamond (w13 > w9)', () => {
  it('is true for 2 cases when the diamond is wider than the first case (w9 is 0)', () => {
    const tile = new GtileSwitch(
      makeDiamond(300, 40),
      [{ tile: makeTile(80, 100) }, { tile: makeTile(80, 60) }],
      null,
      bounder,
      theme,
    );
    expect(tile.isBigDiamond).toBe(true);
  });

  it('is false for 2 cases when the diamond is narrower than the first case', () => {
    const tile = new GtileSwitch(
      makeDiamond(60, 40),
      [{ tile: makeTile(80, 100) }, { tile: makeTile(80, 60) }],
      null,
      bounder,
      theme,
    );
    expect(tile.isBigDiamond).toBe(false);
  });

  it('is true for 3 cases when w13 exceeds the middle case width (w9)', () => {
    const tile = new GtileSwitch(
      makeDiamond(200, 40),
      [{ tile: makeTile(50, 60) }, { tile: makeTile(30, 60) }, { tile: makeTile(50, 60) }],
      null,
      bounder,
      theme,
    );
    // w13 = 200 - 25 - 25 = 150; w9 = 30 (the one middle case).
    expect(tile.isBigDiamond).toBe(true);
  });

  it('is false for 3 cases when w13 does not exceed the middle case width (w9)', () => {
    const tile = new GtileSwitch(
      makeDiamond(50, 40),
      [{ tile: makeTile(50, 60) }, { tile: makeTile(30, 60) }, { tile: makeTile(50, 60) }],
      null,
      bounder,
      theme,
    );
    // w13 = 50 - 25 - 25 = 0; w9 = 30. 0 > 30 is false.
    expect(tile.isBigDiamond).toBe(false);
  });

  it('is false for an empty case list (defensive -- no upstream switch has zero cases)', () => {
    const tile = new GtileSwitch(makeDiamond(300, 40), [], null, bounder, theme);
    expect(tile.isBigDiamond).toBe(false);
  });
});

// `FtileSwitchWithDiamonds#getYdelta1a` (`:100-102`, flat `20`) --
// `FtileSwitchWithOneLink` never overrides it, unlike `WithManyLinks`.
describe('GtileSwitch — single case (OneLink) Ydelta1a is flat 20', () => {
  it('caseOffsetY === diamond.height + 20 regardless of mode', () => {
    const diamond = makeDiamond(300, 40);
    const case0 = makeTile(80, 60);
    const tile = new GtileSwitch(diamond, [{ tile: case0 }], null, bounder, theme);
    expect(tile.caseOffsets[0]!.y).toBe(diamond.height + 20);
  });
});

// `FtileFactoryDelegatorSwitch#createWithLinks` (`:109-113`) wraps every
// case as `FtileDecorateOutLabel(FtileDecorateInLabel(body, dimIn), dimOut)`.
// A bounder whose every line is `LABEL_W` x `LABEL_H` makes each label's
// own dimension exact: `n` lines -> `LABEL_W` x `n * LABEL_H`.
describe('GtileSwitch — FtileDecorateInLabel/OutLabel case decoration', () => {
  const LABEL_W = 30;
  const LABEL_H = 11;
  const labelBounder: StringBounder = { getDimension: () => ({ width: LABEL_W, height: LABEL_H }) };
  const diamond = makeDiamond(60, 24);
  // Ydelta1a with a tallest label of `h`: `max(10, h) + 10`
  // (`FtileSwitchWithManyLinks.java:412-423`, SMALL_DIAMOND).
  const ydelta1a = (h: number): number => Math.max(10, h) + 10;

  it('places each case body its OWN in-label height below the row (drawU dy(yl))', () => {
    const tile = new GtileSwitch(
      diamond,
      [
        { tile: makeTile(80, 40), label: 'one' },
        { tile: makeTile(80, 40), label: 'two\nlines' },
      ],
      null,
      labelBounder,
      theme,
    );
    const row = diamond.height + ydelta1a(2 * LABEL_H);
    expect(tile.caseOffsets[0]!.y).toBe(row + LABEL_H);
    expect(tile.caseOffsets[1]!.y).toBe(row + 2 * LABEL_H);
  });

  it('adds the in-label height to the decorated case height (addTop) -> nude height', () => {
    const tile = new GtileSwitch(diamond, [{ tile: makeTile(80, 40), label: 'a' }, { tile: makeTile(80, 40) }], null, labelBounder, theme);
    expect(tile.height).toBe(diamond.height + 40 + LABEL_H + NUDE_HEIGHT_PAD + ydelta1a(LABEL_H));
  });

  it('adds the out-label height to the decorated case height (addBottom), not to its body offset', () => {
    const body = { ...makeTile(80, 40), outLabel: { label: 'exit' } };
    const tile = new GtileSwitch(diamond, [{ tile: body }, { tile: makeTile(80, 40) }], null, labelBounder, theme);
    expect(tile.caseOffsets[0]!.y).toBe(diamond.height + ydelta1a(0));
    expect(tile.height).toBe(diamond.height + 40 + LABEL_H + NUDE_HEIGHT_PAD + ydelta1a(0));
  });

  it('widens a case on the right when its label overhangs the body right (incRight)', () => {
    // body 20 wide, left 10 -> right 10; label 30 -> missing 20 -> width 40.
    const tile = new GtileSwitch(diamond, [{ tile: makeTile(20, 40), label: 'wide' }, { tile: makeTile(80, 40) }], null, labelBounder, theme);
    expect(tile.caseOffsets[1]!.x).toBe(40 + SWITCH_X_SEPARATION);
  });

  it('does not widen when the label fits inside the body right', () => {
    const tile = new GtileSwitch(diamond, [{ tile: makeTile(80, 40), label: 'fits' }, { tile: makeTile(80, 40) }], null, labelBounder, theme);
    expect(tile.caseOffsets[1]!.x).toBe(80 + SWITCH_X_SEPARATION);
  });
});
