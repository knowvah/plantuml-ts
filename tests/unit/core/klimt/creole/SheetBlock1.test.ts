/**
 * SheetBlock1.test.ts — T8: unit coverage for `SheetBlock1`
 * (klimt/creole/SheetBlock1.java), the real Creole "Sheet -> TextBlock"
 * assembly (word-wrap + `Sea`-based altitude stacking + width
 * normalization).
 *
 * `unitOps` below is a deterministic, character-counting `AtomOps` test
 * double (1 unit width per character, fixed height/altitude) -- enough to
 * verify SheetBlock1's OWN stacking/wrap/normalization algorithm without a
 * real font measurer (out of this task's scope; `SheetBlock1` never
 * measures atoms itself, it only calls the injected `AtomOps`, so a
 * deterministic double is a faithful way to test its OWN logic in
 * isolation -- see `Sea.ts`'s doc comment on why `AtomOps` exists).
 */
import { describe, expect, it } from 'vitest';
import { SheetBlock1 } from '../../../../../src/core/klimt/creole/SheetBlock1.js';
import type { AtomOps } from '../../../../../src/core/klimt/creole/Sea.js';
import { Sheet } from '../../../../../src/core/klimt/creole/Sheet.js';
import type { Stripe } from '../../../../../src/core/klimt/creole/Stripe.js';
import type { CreoleAtom } from '../../../../../src/core/klimt/creole/atom/Atom.js';
import { HorizontalAlignment } from '../../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { LineBreakStrategy } from '../../../../../src/core/klimt/LineBreakStrategy.js';
import { ClockwiseTopRightBottomLeft } from '../../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';

const CHAR_WIDTH = 2;
const LINE_HEIGHT = 10;

function textAtom(text: string): CreoleAtom {
  return { kind: 'text', text, font: { family: 'sans-serif', size: 12, color: '#000', styles: new Set() } };
}

function stripeOf(...atoms: CreoleAtom[]): Stripe {
  return { getLHeader: () => null, getAtoms: () => atoms };
}

/** 1-unit-per-character width, fixed height/altitude -- see module doc. */
function unitOps(): AtomOps & { calls: number } {
  const ops = {
    calls: 0,
    calculateDimension: (atom: CreoleAtom): XDimension2D => {
      ops.calls += 1;
      const text = atom.kind === 'text' ? atom.text : '';
      return new XDimension2D(text.length * CHAR_WIDTH, LINE_HEIGHT);
    },
    getStartingAltitude: (): number => 0,
    drawU: (): void => undefined,
  };
  return ops;
}

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}

const stubStringBounder: StringBounder = new FakeStringBounder();

/** Composes `apply(UTranslate)` calls so `getTranslate()` reports the
 *  accumulated (dx, dy) `Position#translate` applied -- everything else
 *  throws (unused by `drawU`'s call graph, which routes atom drawing
 *  through the injected `AtomOps.drawU`, not `ug.draw`). */
class RecordingUGraphic implements UGraphic {
  constructor(private readonly translate: UTranslate = UTranslate.none()) {}

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) return new RecordingUGraphic(this.translate.compose(change));
    return this;
  }

  draw(): void {
    throw new Error('not needed');
  }

  getParam(): never {
    throw new Error('not needed');
  }

  getTranslate(): UTranslate {
    return this.translate;
  }

  getStringBounder(): StringBounder {
    return stubStringBounder;
  }
}

describe('SheetBlock1.calculateDimension', () => {
  it('single line, single atom: width/height come straight from AtomOps + padding delta (Java:196-199)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom('AAAAA'))); // width 10, height 10
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps(), ClockwiseTopRightBottomLeft.same(3));
    // padding delta = top(3) + bottom(3) = 6, applied to BOTH width and height
    // (Java's own quirk -- XDimension2D#delta(single arg) widens both axes).
    expect(block.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(10 + 6, 10 + 6));
  });

  it('two stripes stack vertically: height sums, width is the max (Java: y += height per stripe)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom('AAAAA'))); // width 10, height 10
    sheet.add(stripeOf(textAtom('BB'))); // width 4, height 10
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps());
    expect(block.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(10, 20));
  });

  it('a stripe with zero atoms contributes nothing (Java:131-132, `continue`)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf()); // empty stripe -- skipped entirely
    sheet.add(stripeOf(textAtom('AAAAA'))); // width 10, height 10
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps());
    expect(block.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(10, 10));
  });

  it('memoizes across calls with the SAME StringBounder constructor (TextBlockMemoized)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom('AAAAA')));
    const ops = unitOps();
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, ops);
    block.calculateDimension(stubStringBounder);
    const callsAfterFirst = ops.calls;
    block.calculateDimension(stubStringBounder);
    expect(ops.calls).toBe(callsAfterFirst); // no re-measurement
  });

  it("initMap's OWN cache (Java:117-120) is reused across calculateDimension -> drawU with the same StringBounder", () => {
    // TextBlockMemoized's outer cache only gates calculateDimension; drawU
    // calls initMap directly, so this is the only path that exercises
    // initMap's own `lastWrapCaller` early-return branch.
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom('AAAAA')));
    const ops = unitOps();
    const drawn: unknown[] = [];
    const wrappedOps: AtomOps = {
      calculateDimension: (a, sb) => ops.calculateDimension(a, sb),
      getStartingAltitude: (a, sb) => ops.getStartingAltitude(a, sb),
      drawU: (a) => drawn.push(a),
    };
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, wrappedOps);
    block.calculateDimension(stubStringBounder);
    const callsAfterCalculate = ops.calls;
    block.drawU(new RecordingUGraphic());
    expect(ops.calls).toBe(callsAfterCalculate); // initMap's own cache hit, no re-measurement
    expect(drawn).toHaveLength(1);
  });
});

describe('SheetBlock1 word-wrap (reuses Fission.ts#getSplitted, Java:121-123)', () => {
  it('a LineBreakStrategy(0) (NONE) never wraps: one stripe in, one stripe out', () => {
    const text = 'a long single line with several words';
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom(text)));
    const ops = unitOps();
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, ops);
    const dim = block.calculateDimension(stubStringBounder);
    // single physical line -> height stays 10 (never doubled by a spurious wrap).
    expect(dim.getHeight()).toBe(10);
    expect(dim.getWidth()).toBe(text.length * CHAR_WIDTH);
  });

  it('a set maxWidth wraps into multiple physical lines, each contributing its own height', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom('aaaaa bbbbb ccccc')));
    // Each word is 5 chars = 10 units wide; "aaaaa bbbbb" = 11 chars = 22
    // units, over a maxWidth of 20 -> wraps after "aaaaa".
    const block = new SheetBlock1(sheet, new LineBreakStrategy('20'), unitOps());
    const dim = block.calculateDimension(stubStringBounder);
    expect(dim.getHeight()).toBe(30); // 3 wrapped lines * 10 each
  });
});

describe('SheetBlock1.drawU', () => {
  it('applies the padding translate before drawing atoms (Java:209-210)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    const atom = textAtom('AAAAA');
    sheet.add(stripeOf(atom));
    const drawnAt: UTranslate[] = [];
    const ops: AtomOps = {
      calculateDimension: (a) => new XDimension2D((a.kind === 'text' ? a.text.length : 0) * CHAR_WIDTH, LINE_HEIGHT),
      getStartingAltitude: () => 0,
      drawU: (_a, ug) => drawnAt.push(ug.getTranslate()),
    };
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, ops, ClockwiseTopRightBottomLeft.topRightBottomLeft(2, 0, 0, 3));
    block.drawU(new RecordingUGraphic());
    expect(drawnAt).toHaveLength(1);
    // padding.left=3, padding.top=2; the atom's own Sea position is (0,0)
    // (single atom, no altitude offset after translateMinYto(0)).
    expect(drawnAt[0]).toEqual(new UTranslate(3, 2));
  });

  it('does NOT apply a translate when padding is all-zero (Java: left>0 || top>0 guard)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom('A')));
    const drawnAt: UTranslate[] = [];
    const ops: AtomOps = {
      calculateDimension: () => new XDimension2D(2, LINE_HEIGHT),
      getStartingAltitude: () => 0,
      drawU: (_a, ug) => drawnAt.push(ug.getTranslate()),
    };
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, ops);
    block.drawU(new RecordingUGraphic());
    expect(drawnAt[0]).toEqual(UTranslate.none());
  });

  it('CENTER alignment shifts the narrower line by diff/2 (Java:160-171, getCoef CENTER -> 2)', () => {
    const sheet = new Sheet(HorizontalAlignment.CENTER);
    sheet.add(stripeOf(textAtom('AAAAA'))); // width 10 (widest)
    sheet.add(stripeOf(textAtom('BB'))); // width 4 -> diff 6, coef 2 -> shift 3
    const drawnAt: UTranslate[] = [];
    const ops = unitOps();
    const wrappedOps: AtomOps = {
      calculateDimension: (a, sb) => ops.calculateDimension(a, sb),
      getStartingAltitude: (a, sb) => ops.getStartingAltitude(a, sb),
      drawU: (a, ug) => drawnAt.push(ug.getTranslate()),
    };
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, wrappedOps);
    block.drawU(new RecordingUGraphic());
    expect(drawnAt).toHaveLength(2);
    expect(drawnAt[0]?.getDx()).toBe(0); // widest line: no shift
    expect(drawnAt[1]?.getDx()).toBe(3); // (10 - 4) / 2
  });

  it('RIGHT alignment shifts the narrower line by the full diff (getCoef RIGHT -> 1)', () => {
    const sheet = new Sheet(HorizontalAlignment.RIGHT);
    sheet.add(stripeOf(textAtom('AAAAA'))); // width 10
    sheet.add(stripeOf(textAtom('BB'))); // width 4 -> diff 6, coef 1 -> shift 6
    const drawnAt: UTranslate[] = [];
    const ops = unitOps();
    const wrappedOps: AtomOps = {
      calculateDimension: (a, sb) => ops.calculateDimension(a, sb),
      getStartingAltitude: (a, sb) => ops.getStartingAltitude(a, sb),
      drawU: (a, ug) => drawnAt.push(ug.getTranslate()),
    };
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, wrappedOps);
    block.drawU(new RecordingUGraphic());
    expect(drawnAt[1]?.getDx()).toBe(6);
  });

  it("a stripe's own duck-typed getCellAlignment overrides the sheet's alignment during normalization (Java:174-176)", () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT); // sheet itself is LEFT (coef 0)
    sheet.add(stripeOf(textAtom('AAAAA'))); // width 10 (widest)
    const cellAligned: Stripe = {
      getLHeader: () => null,
      getAtoms: () => [textAtom('BB')], // width 4 -> diff 6
      getCellAlignment: () => HorizontalAlignment.RIGHT, // coef 1 -> shift 6, NOT the sheet's LEFT (coef 0)
    } as unknown as Stripe;
    sheet.add(cellAligned);
    const drawnAt: UTranslate[] = [];
    const ops = unitOps();
    const wrappedOps: AtomOps = {
      calculateDimension: (a, sb) => ops.calculateDimension(a, sb),
      getStartingAltitude: (a, sb) => ops.getStartingAltitude(a, sb),
      drawU: (_a, ug) => drawnAt.push(ug.getTranslate()),
    };
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, wrappedOps);
    block.drawU(new RecordingUGraphic());
    expect(drawnAt[1]?.getDx()).toBe(6); // (10 - 4) / coef(RIGHT=1) = 6, not 0
  });

  it('LEFT alignment never shifts (getCoef LEFT -> 0)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom('AAAAA')));
    sheet.add(stripeOf(textAtom('BB')));
    const drawnAt: UTranslate[] = [];
    const ops = unitOps();
    const wrappedOps: AtomOps = {
      calculateDimension: (a, sb) => ops.calculateDimension(a, sb),
      getStartingAltitude: (a, sb) => ops.getStartingAltitude(a, sb),
      drawU: (a, ug) => drawnAt.push(ug.getTranslate()),
    };
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, wrappedOps);
    block.drawU(new RecordingUGraphic());
    expect(drawnAt[1]?.getDx()).toBe(0);
  });
});

describe('SheetBlock1 — remaining Atom/Stencil surface', () => {
  it('toString delegates to the wrapped Sheet (Java:97-99)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom('x')));
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps());
    expect(block.toString()).toBe(sheet.toString());
  });

  it('getHorizontalAlignment delegates to the Sheet (Java:112-114)', () => {
    const sheet = new Sheet(HorizontalAlignment.RIGHT);
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps());
    expect(block.getHorizontalAlignment()).toBe(HorizontalAlignment.RIGHT);
  });

  it('getCellAlignment: LEFT when more than one stripe (Java:101-104)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom('a')));
    sheet.add(stripeOf(textAtom('b')));
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps());
    block.calculateDimension(stubStringBounder); // populate `stripes` (Java reads the field directly)
    expect(block.getCellAlignment()).toBe(HorizontalAlignment.LEFT);
  });

  it('getCellAlignment: LEFT for a single stripe with no getCellAlignment capability', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom('a')));
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps());
    block.calculateDimension(stubStringBounder);
    expect(block.getCellAlignment()).toBe(HorizontalAlignment.LEFT);
  });

  it('getCellAlignment: delegates to a single stripe carrying getCellAlignment (duck-typed instanceof StripeSimple)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    const cellAligned: Stripe & { getCellAlignment(): typeof HorizontalAlignment.RIGHT } = {
      getLHeader: () => null,
      getAtoms: () => [textAtom('a')],
      getCellAlignment: () => HorizontalAlignment.RIGHT,
    };
    sheet.add(cellAligned);
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps());
    block.calculateDimension(stubStringBounder);
    expect(block.getCellAlignment()).toBe(HorizontalAlignment.RIGHT);
  });

  it('getInnerPosition always returns undefined (Java:202-204, `return null;`)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps());
    expect(block.getInnerPosition('member', stubStringBounder)).toBeUndefined();
  });

  it('getStartingAltitude is always 0 (Java:220-222)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps());
    expect(block.getStartingAltitude(stubStringBounder)).toBe(0);
  });

  it('getStartingX is -marginX1, getEndingX is width + marginX2 (Java:224-230)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom('AAAAA'))); // width 10
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps(), ClockwiseTopRightBottomLeft.none(), 5, 7);
    expect(block.getStartingX(stubStringBounder, 0)).toBe(-5);
    expect(block.getEndingX(stubStringBounder, 0)).toBe(10 + 7);
  });

  it('getMinimumWidth is always 0 (Style-overload not ported; see class doc comment)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps());
    expect(block.getMinimumWidth()).toBe(0);
  });

  it('getNeutrons always throws (Java:236-239)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps());
    expect(() => block.getNeutrons()).toThrow('UnsupportedOperationException');
  });

  it('accepts a bare numeric padding (the (Sheet, LineBreakStrategy, double, double, double) overload)', () => {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(stripeOf(textAtom('A'))); // width 2, height 10
    const block = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps(), 4, 0, 0);
    // padding.same(4) -> top=4,bottom=4 -> delta widens both axes by 8
    expect(block.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(2 + 8, 10 + 8));
  });
});
