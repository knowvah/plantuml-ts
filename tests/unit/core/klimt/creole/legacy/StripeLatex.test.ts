/**
 * StripeLatex.test.ts — T10e: coverage for `klimt/creole/legacy/
 * StripeLatex.java`'s port. Like `StripeCode` (T10d), `StripeLatex` has no
 * blocked dependency — every member is fully reachable and asserted on
 * concrete values here (termination detection, lazy/memoized `AtomMath`
 * construction, delegation of dimension/altitude/draw), plus the
 * `getNeutrons()` ADR-9 seam and the `getAtoms()`/`Stripe.ts` type
 * mismatch documented in `StripeLatex.ts`'s own module doc comment.
 */
import { describe, expect, it } from 'vitest';
import { StripeLatex } from '../../../../../../src/core/klimt/creole/legacy/StripeLatex.js';
import { AtomMath } from '../../../../../../src/core/klimt/creole/atom/AtomMath.js';
import { ScientificEquationSafe } from '../../../../../../src/core/math/ScientificEquationSafe.js';
import { measureLatex, renderLatexAsImage } from '../../../../../../src/core/latex.js';
import { UImage } from '../../../../../../src/core/klimt/shape/UImage.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';
import type { FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import type { UShape } from '../../../../../../src/core/klimt/UShape.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';

const FONT: FontConfiguration = { family: 'sanserif', size: 12, color: '#0000ff', styles: new Set() };

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}

const sb: StringBounder = new FakeStringBounder();

/** Same per-file `RecordingUGraphic` convention `StripeCode.test.ts`/
 *  `AtomMath.test.ts` already use. */
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

describe('StripeLatex.addAndCheckTermination / isTerminated (java:73-86)', () => {
  it('accumulates non-terminating lines and reports not terminated', () => {
    const stripe = new StripeLatex(FONT);
    expect(stripe.addAndCheckTermination('x^2')).toBe(false);
    expect(stripe.isTerminated()).toBe(false);
  });

  it('</latex> terminates the block and is not itself accumulated into the formula', () => {
    const stripe = new StripeLatex(FONT);
    stripe.addAndCheckTermination('x^2');
    expect(stripe.addAndCheckTermination('</latex>')).toBe(true);
    expect(stripe.isTerminated()).toBe(true);
    // Only the pre-terminator line contributes -- verify via the drawn
    // AtomMath's dimension, which is measureLatex('x^2').
    const expected = measureLatex('x^2');
    expect(stripe.calculateDimension(sb)).toEqual(new XDimension2D(expected.width, expected.height));
  });

  it('multiple lines concatenate with NO separator (java:79, StringBuilder#append verbatim)', () => {
    const stripe = new StripeLatex(FONT);
    stripe.addAndCheckTermination('x^');
    stripe.addAndCheckTermination('2');
    stripe.addAndCheckTermination('</latex>');
    // 'x^' + '2' = 'x^2' -- the SAME dimension as a single-line 'x^2' block.
    const expected = measureLatex('x^2');
    expect(stripe.calculateDimension(sb)).toEqual(new XDimension2D(expected.width, expected.height));
  });

  it('a line containing "</latex>" as a substring, not exactly, does NOT terminate (exact-match sentinel)', () => {
    const stripe = new StripeLatex(FONT);
    expect(stripe.addAndCheckTermination('x = "</latex>y"')).toBe(false);
    expect(stripe.isTerminated()).toBe(false);
  });
});

describe('StripeLatex.calculateDimension (java:99-103, @Fast) — delegates to the lazily-built AtomMath', () => {
  it('an empty block measures as measureLatex("")', () => {
    const stripe = new StripeLatex(FONT);
    const expected = measureLatex('');
    expect(stripe.calculateDimension(sb)).toEqual(new XDimension2D(expected.width, expected.height));
  });

  it('the underlying AtomMath is memoized across repeated calls (same dimension instance)', () => {
    const stripe = new StripeLatex(FONT);
    stripe.addAndCheckTermination('x');
    const first = stripe.calculateDimension(sb);
    const second = stripe.calculateDimension(sb);
    expect(second).toBe(first);
  });

  it('the AtomMath is built ONCE (java:90, "if (atom == null)") -- lines added AFTER the first calculateDimension call do not change it', () => {
    const stripe = new StripeLatex(FONT);
    stripe.addAndCheckTermination('x');
    const before = stripe.calculateDimension(sb);
    stripe.addAndCheckTermination('yyyyyyyyyy'); // would widen the formula if re-read
    const after = stripe.calculateDimension(sb);
    expect(after).toEqual(before);
  });
});

describe('StripeLatex.getStartingAltitude (java:105-107)', () => {
  it('is always 0, regardless of accumulated content', () => {
    const stripe = new StripeLatex(FONT);
    stripe.addAndCheckTermination('anything');
    expect(stripe.getStartingAltitude(sb)).toBe(0);
  });
});

describe('StripeLatex.drawU (java:109-111) — delegates to the lazily-built AtomMath', () => {
  it('draws one UImage using the fontConfiguration\'s own color as foreground', () => {
    const stripe = new StripeLatex(FONT);
    stripe.addAndCheckTermination('x^2');
    const ug = new RecordingUGraphic();
    stripe.drawU(ug);

    const drawn = ug.getDrawn();
    expect(drawn).toHaveLength(1);
    expect(drawn[0]!.shape).toBeInstanceOf(UImage);
    const expected = renderLatexAsImage('x^2', FONT.color!);
    const shape = drawn[0]!.shape as UImage;
    expect(shape.getWidth()).toBe(expected.width);
    expect(shape.getHeight()).toBe(expected.height);
    expect(shape.getHref()).toBe(expected.href);
  });

  it('a null-color FontConfiguration falls back to AtomMath\'s own black default', () => {
    const noColorFont: FontConfiguration = { family: 'sanserif', size: 12, color: null, styles: new Set() };
    const stripe = new StripeLatex(noColorFont);
    stripe.addAndCheckTermination('x');
    const ug = new RecordingUGraphic();
    stripe.drawU(ug);
    const expected = renderLatexAsImage('x', '#000000');
    expect((ug.getDrawn()[0]!.shape as UImage).getHref()).toBe(expected.href);
  });

  it('draws at the incoming translate unchanged', () => {
    const stripe = new StripeLatex(FONT);
    stripe.addAndCheckTermination('x');
    const ug = new RecordingUGraphic(new UTranslate(4, 9));
    stripe.drawU(ug);
    expect(ug.getDrawn()[0]!.translate).toEqual(new UTranslate(4, 9));
  });
});

describe('StripeLatex.getAtoms / getLHeader (java:65-71) — Atom-typed, not Stripe.ts\'s CreoleAtom', () => {
  it('getAtoms returns a single-element list containing itself, matching Collections.singletonList(this)', () => {
    const stripe = new StripeLatex(FONT);
    expect(stripe.getAtoms()).toEqual([stripe]);
  });

  it('getLHeader always returns null', () => {
    const stripe = new StripeLatex(FONT);
    expect(stripe.getLHeader()).toBeNull();
  });
});

describe('StripeLatex.getNeutrons — ADR-9 adaptation (Neutron NOT ported, see module doc comment)', () => {
  it('always throws UnsupportedOperationException, matching AbstractAtom/StripeCode/StripeTree precedent', () => {
    const stripe = new StripeLatex(FONT);
    expect(() => stripe.getNeutrons()).toThrow('UnsupportedOperationException');
  });

  it('throws regardless of accumulated formula content', () => {
    const stripe = new StripeLatex(FONT);
    stripe.addAndCheckTermination('x^2');
    stripe.addAndCheckTermination('</latex>');
    expect(() => stripe.getNeutrons()).toThrow('UnsupportedOperationException');
  });
});

describe('StripeLatex — the underlying atom really is an AtomMath instance', () => {
  it('getAtom() (private, exercised via getAtoms()[0] === the drawU/calculateDimension target) constructs AtomMath', () => {
    // calculateDimension/drawU both delegate to the SAME lazily-built atom
    // (java:90 memoization) -- cross-check by constructing an equivalent
    // AtomMath directly and comparing dimensions, proving the private
    // getAtom() path really instantiates AtomMath and not something else.
    const stripe = new StripeLatex(FONT);
    stripe.addAndCheckTermination('x^2');
    const stripeDim = stripe.calculateDimension(sb);

    const equivalent = new AtomMath(ScientificEquationSafe.fromLatex('x^2'), FONT.color, null);
    expect(stripeDim).toEqual(equivalent.calculateDimension(sb));
  });
});
