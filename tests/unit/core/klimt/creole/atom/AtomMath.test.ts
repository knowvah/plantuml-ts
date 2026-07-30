/**
 * AtomMath.test.ts — T10e: coverage for `klimt/creole/atom/AtomMath.java`'s
 * port. `calculateDimensionSlow`/`drawU` bind to `core/latex.ts`
 * (`measureLatex`/`renderLatexAsImage`) instead of upstream's rasterized
 * `ScientificEquationSafe#getImage`/`getSvg` — see `AtomMath.ts`'s own
 * module doc comment. All dimension assertions are cross-checked directly
 * against `measureLatex`'s own output so this test does not hard-code a
 * second copy of its heuristic.
 */
import { describe, expect, it } from 'vitest';
import { AtomMath } from '../../../../../../src/core/klimt/creole/atom/AtomMath.js';
import { ScientificEquationSafe } from '../../../../../../src/core/math/ScientificEquationSafe.js';
import { measureLatex, renderLatexAsImage } from '../../../../../../src/core/latex.js';
import { UImage } from '../../../../../../src/core/klimt/shape/UImage.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';
import type { UShape } from '../../../../../../src/core/klimt/UShape.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}

const sb: StringBounder = new FakeStringBounder();

/** Same per-file `RecordingUGraphic` convention `StripeCode.test.ts`/
 *  `AtomWithMargin.test.ts` already use. */
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

describe('AtomMath.calculateDimensionSlow (java:64-71) — bound to measureLatex', () => {
  it('matches measureLatex(math.getSource()) exactly for a simple expression', () => {
    const math = ScientificEquationSafe.fromLatex('x^2');
    const atom = new AtomMath(math, '#000000', null);
    const expected = measureLatex('x^2');
    expect(atom.calculateDimension(sb)).toEqual(new XDimension2D(expected.width, expected.height));
  });

  it('a structural marker (\\frac) widens the height, matching measureLatex', () => {
    const math = ScientificEquationSafe.fromLatex('\\frac{a}{b}');
    const atom = new AtomMath(math, null, null);
    const expected = measureLatex('\\frac{a}{b}');
    expect(expected.height).toBeGreaterThan(measureLatex('x').height);
    expect(atom.calculateDimension(sb)).toEqual(new XDimension2D(expected.width, expected.height));
  });

  it('memoizes calculateDimension (inherited AbstractAtom/TextBlockMemoized)', () => {
    const math = ScientificEquationSafe.fromLatex('x');
    const atom = new AtomMath(math, null, null);
    const first = atom.calculateDimension(sb);
    const second = atom.calculateDimension(sb);
    expect(second).toBe(first);
  });
});

describe('AtomMath.getStartingAltitude (java:73-75)', () => {
  it('is always 0, regardless of the formula', () => {
    const math = ScientificEquationSafe.fromLatex('\\int_0^1 x\\,dx');
    const atom = new AtomMath(math, '#123456', null);
    expect(atom.getStartingAltitude(sb)).toBe(0);
  });
});

describe('AtomMath.drawU (java:77-98) — bound to renderLatexAsImage', () => {
  it('draws one UImage whose dims/href match renderLatexAsImage(source, foreground)', () => {
    const math = ScientificEquationSafe.fromLatex('x^2');
    const atom = new AtomMath(math, '#ff0000', null);
    const ug = new RecordingUGraphic();
    atom.drawU(ug);

    const drawn = ug.getDrawn();
    expect(drawn).toHaveLength(1);
    expect(drawn[0]!.shape).toBeInstanceOf(UImage);
    const expected = renderLatexAsImage('x^2', '#ff0000');
    const shape = drawn[0]!.shape as UImage;
    expect(shape.getWidth()).toBe(expected.width);
    expect(shape.getHeight()).toBe(expected.height);
    expect(shape.getHref()).toBe(expected.href);
  });

  it('draws at the incoming translate unchanged (no internal offset)', () => {
    const math = ScientificEquationSafe.fromLatex('y');
    const atom = new AtomMath(math, '#000000', null);
    const ug = new RecordingUGraphic(new UTranslate(7, 3));
    atom.drawU(ug);
    expect(ug.getDrawn()[0]!.translate).toEqual(new UTranslate(7, 3));
  });

  it('a null foreground falls back to black (#000000), matching upstream XColor.BLACK default', () => {
    const math = ScientificEquationSafe.fromLatex('z');
    const atom = new AtomMath(math, null, null);
    const ug = new RecordingUGraphic();
    atom.drawU(ug);
    const expected = renderLatexAsImage('z', '#000000');
    expect((ug.getDrawn()[0]!.shape as UImage).getHref()).toBe(expected.href);
  });

  it('a non-null background does not change the drawn output (no background operation in this port -- see module doc comment)', () => {
    const math = ScientificEquationSafe.fromLatex('w');
    const withBg = new AtomMath(math, '#00ff00', '#ffffff');
    const withoutBg = new AtomMath(math, '#00ff00', null);
    const ug1 = new RecordingUGraphic();
    const ug2 = new RecordingUGraphic();
    withBg.drawU(ug1);
    withoutBg.drawU(ug2);
    expect((ug1.getDrawn()[0]!.shape as UImage).getHref()).toBe((ug2.getDrawn()[0]!.shape as UImage).getHref());
  });
});
