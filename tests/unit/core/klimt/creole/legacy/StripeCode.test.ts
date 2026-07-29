/**
 * StripeCode.test.ts — T10d: coverage for `klimt/creole/legacy/StripeCode
 * .java`'s port. Unlike `StripeTree`/`StripeTable` (concurrent siblings,
 * T10b/T10c), `StripeCode` has no blocked dependency — every member is
 * fully reachable and asserted on concrete values here (termination
 * detection, multi-line raw-text dimension summing, drawn shape/translate
 * geometry), plus the `getNeutrons()` ADR-9 seam and the `getAtoms()`/
 * `Stripe.ts` type-mismatch documented in `StripeCode.ts`'s own module
 * doc comment.
 */
import { describe, expect, it } from 'vitest';
import { StripeCode } from '../../../../../../src/core/klimt/creole/legacy/StripeCode.js';
import { UText } from '../../../../../../src/core/klimt/shape/UText.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';
import type { FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import type { UShape } from '../../../../../../src/core/klimt/UShape.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';

const FONT: FontConfiguration = { family: 'monospaced', size: 12, color: '#000000', styles: new Set() };

const LINE_HEIGHT = 10;
const DESCENT = 3;

/** Deterministic per-character-width, fixed-height/descent test double —
 *  makes `calculateDimensionSlow`'s max-width/summed-height arithmetic and
 *  `drawU`'s y-cursor/translate arithmetic independently checkable against
 *  concrete numbers. */
class FakeStringBounder implements StringBounder {
  calculateDimension(_font: { readonly family: string; readonly size: number }, text: string): XDimension2D {
    return new XDimension2D(text.length * 2, LINE_HEIGHT);
  }

  getDescent(_font: { readonly family: string; readonly size: number }, _text: string): number {
    return DESCENT;
  }
}

const sb: StringBounder = new FakeStringBounder();

/** Records every `draw(shape)` call together with the translate active at
 *  that point — this project's established per-file UGraphic-double
 *  convention (`CreoleHorizontalLine.test.ts`'s `RecordingUGraphic`). */
class RecordingUGraphic implements UGraphic {
  constructor(
    private readonly translate: UTranslate = UTranslate.none(),
    private readonly drawn: { shape: UShape; translate: UTranslate }[] = [],
  ) {}

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) return new RecordingUGraphic(this.translate.compose(change), this.drawn);
    return this;
  }

  draw(shape: UShape): void {
    this.drawn.push({ shape, translate: this.translate });
  }

  getParam(): never {
    throw new Error('not needed');
  }

  getTranslate(): UTranslate {
    return this.translate;
  }

  getStringBounder(): StringBounder {
    return sb;
  }

  getDrawn(): readonly { shape: UShape; translate: UTranslate }[] {
    return this.drawn;
  }
}

describe('StripeCode.addAndCheckTermination / isTerminated (java:74-86)', () => {
  it('accumulates non-terminating lines and reports not terminated', () => {
    const code = new StripeCode(FONT);
    expect(code.addAndCheckTermination('const x = 1;')).toBe(false);
    expect(code.isTerminated()).toBe(false);
  });

  it('</code> terminates the block and is not itself accumulated as raw content', () => {
    const code = new StripeCode(FONT);
    code.addAndCheckTermination('const x = 1;');
    expect(code.addAndCheckTermination('</code>')).toBe(true);
    expect(code.isTerminated()).toBe(true);
    // Only the pre-terminator line contributes to the measured dimension --
    // width = 'const x = 1;'.length(12) * 2 = 24, height = 10.
    expect(code.calculateDimension(sb)).toEqual(new XDimension2D(24, 10));
  });

  it('a line containing "</code>" as a substring, not exactly, does NOT terminate (exact-match sentinel)', () => {
    const code = new StripeCode(FONT);
    expect(code.addAndCheckTermination('x = "</code>y"')).toBe(false);
    expect(code.isTerminated()).toBe(false);
  });
});

describe('StripeCode.calculateDimensionSlow (java:89-98) — max width, summed height', () => {
  it('empty block: 0x0', () => {
    const code = new StripeCode(FONT);
    expect(code.calculateDimension(sb)).toEqual(new XDimension2D(0, 0));
  });

  it('one line: width = that line, height = one line height', () => {
    const code = new StripeCode(FONT);
    code.addAndCheckTermination('ab'); // len 2 -> width 4
    expect(code.calculateDimension(sb)).toEqual(new XDimension2D(4, LINE_HEIGHT));
  });

  it('multiple lines: width = MAX over lines, height = SUM over lines', () => {
    const code = new StripeCode(FONT);
    code.addAndCheckTermination('ab'); // len 2 -> width 4
    code.addAndCheckTermination('abcd'); // len 4 -> width 8 (max)
    code.addAndCheckTermination('a'); // len 1 -> width 2
    expect(code.calculateDimension(sb)).toEqual(new XDimension2D(8, 3 * LINE_HEIGHT));
  });

  it('memoizes calculateDimension (inherited TextBlockMemoized)', () => {
    const code = new StripeCode(FONT);
    code.addAndCheckTermination('x');
    const first = code.calculateDimension(sb);
    const second = code.calculateDimension(sb);
    expect(second).toBe(first); // same cached instance
  });
});

describe('StripeCode.getStartingAltitude (java:100-102)', () => {
  it('is always 0, regardless of accumulated content', () => {
    const code = new StripeCode(FONT);
    code.addAndCheckTermination('anything');
    expect(code.getStartingAltitude(sb)).toBe(0);
  });
});

describe('StripeCode.drawU (java:104-117)', () => {
  it('draws one UText per raw line, y-cursor accumulated, baseline-adjusted by descent', () => {
    const code = new StripeCode(FONT);
    code.addAndCheckTermination('one'); // height 10
    code.addAndCheckTermination('two'); // height 10
    const ug = new RecordingUGraphic();
    code.drawU(ug);

    const drawn = ug.getDrawn();
    expect(drawn).toHaveLength(2);
    expect(drawn[0]!.shape).toBeInstanceOf(UText);
    expect((drawn[0]!.shape as UText).getText()).toBe('one');
    expect(drawn[0]!.translate).toEqual(new UTranslate(0, LINE_HEIGHT - DESCENT)); // y=10, dy=10-3=7
    expect((drawn[1]!.shape as UText).getText()).toBe('two');
    expect(drawn[1]!.translate).toEqual(new UTranslate(0, 2 * LINE_HEIGHT - DESCENT)); // y=20, dy=20-3=17
  });

  it('draws nothing for an empty block', () => {
    const code = new StripeCode(FONT);
    const ug = new RecordingUGraphic();
    code.drawU(ug);
    expect(ug.getDrawn()).toHaveLength(0);
  });

  it('the drawn UText carries the stripe\'s own FontConfiguration unchanged (no adjustColorForBackground call)', () => {
    const code = new StripeCode(FONT);
    code.addAndCheckTermination('x');
    const ug = new RecordingUGraphic();
    code.drawU(ug);
    expect((ug.getDrawn()[0]!.shape as UText).getFontConfiguration()).toBe(FONT);
  });

  it('falls back to font.size/4.5 when the StringBounder has no getDescent (measureLine\'s established fallback)', () => {
    class NoDescentStringBounder implements StringBounder {
      calculateDimension(_font: { readonly family: string; readonly size: number }, text: string): XDimension2D {
        return new XDimension2D(text.length * 2, LINE_HEIGHT);
      }
    }
    const code = new StripeCode(FONT);
    code.addAndCheckTermination('x');
    class NoDescentUGraphic extends RecordingUGraphic {
      override getStringBounder(): StringBounder {
        return new NoDescentStringBounder();
      }
    }
    const ug = new NoDescentUGraphic();
    code.drawU(ug);
    // y=10, descent fallback = 12/4.5 = 2.6666...
    expect(ug.getDrawn()[0]!.translate).toEqual(new UTranslate(0, LINE_HEIGHT - FONT.size / 4.5));
  });
});

describe('StripeCode.getAtoms / getLHeader (java:65-71) — Atom-typed, not Stripe.ts\'s CreoleAtom', () => {
  it('getAtoms returns a single-element list containing itself, matching Collections.singletonList(this)', () => {
    const code = new StripeCode(FONT);
    expect(code.getAtoms()).toEqual([code]);
  });

  it('getLHeader always returns null', () => {
    const code = new StripeCode(FONT);
    expect(code.getLHeader()).toBeNull();
  });
});

describe('StripeCode.getNeutrons — ADR-9 adaptation (Neutron NOT ported, see module doc comment)', () => {
  it('always throws UnsupportedOperationException, matching AbstractAtom/SheetBlock1/SheetBlock2 precedent', () => {
    const code = new StripeCode(FONT);
    expect(() => code.getNeutrons()).toThrow('UnsupportedOperationException');
  });

  it('throws regardless of accumulated raw content', () => {
    const code = new StripeCode(FONT);
    code.addAndCheckTermination('some code');
    code.addAndCheckTermination('</code>');
    expect(() => code.getNeutrons()).toThrow('UnsupportedOperationException');
  });
});
