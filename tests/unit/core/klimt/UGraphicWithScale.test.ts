import { describe, expect, it } from 'vitest';
import { UGraphicWithScale, XAffineTransform } from '../../../../src/core/klimt/UGraphicWithScale.js';
import type { ColorResolver } from '../../../../src/core/klimt/UGraphicWithScale.js';
import type { UChange } from '../../../../src/core/klimt/UChange.js';
import type { UShape } from '../../../../src/core/klimt/UShape.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../../src/core/klimt/UParam.js';
import type { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { Paint } from '../../../../src/core/paint.js';
import { Fore } from '../../../../src/core/klimt/Fore.js';
import { Back } from '../../../../src/core/klimt/Back.js';

/** A minimal concrete shape — UShape is an empty marker interface. */
class TestShape implements UShape {
  constructor(public readonly label: string) {}
}

const DUMMY_PARAM: UParam = {
  getStroke: () => {
    throw new Error('not used in these tests');
  },
  getColor: () => '#000000',
  getBackcolor: () => '#FFFFFF',
  getTranslate: () => {
    throw new Error('not used in these tests');
  },
};

const DUMMY_BOUNDER: StringBounder = {
  calculateDimension: () => {
    throw new Error('not used in these tests');
  },
};

/**
 * A minimal, immutable `UGraphic` test double: `apply` returns a NEW
 * instance carrying the accumulated change log, so tests can assert
 * exactly which `UChange`s were applied and in what order — the same
 * property `UGraphicWithScale.apply` itself must preserve.
 */
class FakeUGraphic implements UGraphic {
  readonly applied: readonly UChange[];
  readonly drawn: UShape[] = [];

  constructor(applied: readonly UChange[] = []) {
    this.applied = applied;
  }

  apply(change: UChange): UGraphic {
    return new FakeUGraphic([...this.applied, change]);
  }

  draw(shape: UShape): void {
    this.drawn.push(shape);
  }

  getParam(): UParam {
    return DUMMY_PARAM;
  }

  getTranslate(): UTranslate {
    throw new Error('not used in these tests');
  }

  getStringBounder(): StringBounder {
    return DUMMY_BOUNDER;
  }
}

/** A `ColorResolver` whose default/true colors are fixed, recorded test values. */
class FakeColorResolver implements ColorResolver {
  readonly trueColorCalls: string[] = [];

  constructor(
    private readonly defaultColor: Paint,
    private readonly trueColor: Paint,
  ) {}

  getDefaultColor(): Paint {
    return this.defaultColor;
  }

  getTrueColor(code: string): Paint {
    this.trueColorCalls.push(code);
    return this.trueColor;
  }
}

describe('XAffineTransform', () => {
  it('getScaleInstance produces a pure scale matrix', () => {
    const at = XAffineTransform.getScaleInstance(3, 3);
    expect(at.getScaleX()).toBe(3);
    expect(at.getScaleY()).toBe(3);
    expect(at.getTranslateX()).toBe(0);
    expect(at.getTranslateY()).toBe(0);
  });

  it('copyOf produces an independent instance (mutating the copy leaves the source untouched)', () => {
    const source = XAffineTransform.getScaleInstance(2, 2);
    const copy = XAffineTransform.copyOf(source);
    copy.scale(5, 5);
    expect(copy.getScaleX()).toBe(10);
    expect(source.getScaleX()).toBe(2);
  });

  it('translate composes through the current scale, matching upstream matrix multiplication', () => {
    const at = XAffineTransform.getScaleInstance(2, 2);
    at.translate(10, 4);
    // m02 += m00*tx + m01*ty = 0 + 2*10 + 0*4 = 20
    expect(at.getTranslateX()).toBe(20);
    // m12 += m10*tx + m11*ty = 0 + 0*10 + 2*4 = 8
    expect(at.getTranslateY()).toBe(8);
  });

  it('rotate by 90 degrees around the origin swaps the axes (cos=0, sin=1)', () => {
    const at = new XAffineTransform(1, 0, 0, 1, 0, 0);
    at.rotate(Math.PI / 2, 0, 0);
    expect(at.toString()).toBe(
      `XAffineTransform[[${Math.cos(Math.PI / 2)}, ${-Math.sin(Math.PI / 2)}, 0], [${Math.sin(Math.PI / 2)}, ${Math.cos(Math.PI / 2)}, 0]]`,
    );
  });

  it('concatenate composes this = this * other', () => {
    const at = XAffineTransform.getScaleInstance(2, 2);
    at.concatenate(XAffineTransform.fromFlatMatrix([1, 0, 0, 1, 5, 5]));
    // scale(2,2) * translate(5,5): translation scales through -> (10, 10)
    expect(at.getTranslateX()).toBe(10);
    expect(at.getTranslateY()).toBe(10);
    expect(at.getScaleX()).toBe(2);
    expect(at.getScaleY()).toBe(2);
  });
});

describe('UGraphicWithScale', () => {
  describe('create', () => {
    it('applies the resolver default color as foreground then background before scaling', () => {
      const resolver = new FakeColorResolver('#111111', '#222222');
      const ugs = UGraphicWithScale.create(new FakeUGraphic(), resolver, 2);

      const applied = (ugs.getUg() as FakeUGraphic).applied;
      expect(applied).toHaveLength(2);
      expect(applied[0]).toBeInstanceOf(Fore);
      expect((applied[0] as Fore).getColor()).toBe('#111111');
      expect(applied[1]).toBeInstanceOf(Back);
      expect((applied[1] as Back).getBackColor()).toBe('#111111');
    });

    it('seeds a pure scale matrix, angle 0, and the initial scale', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const ugs = UGraphicWithScale.create(new FakeUGraphic(), resolver, 4);

      expect(ugs.getAngle()).toBe(0);
      expect(ugs.getInitialScale()).toBe(4);
      expect(ugs.getAffineTransform().getScaleX()).toBe(4);
      expect(ugs.getAffineTransform().getScaleY()).toBe(4);
    });
  });

  describe('immutability — apply/applyScale/applyRotate/applyTranslate/applyMatrix all return new instances', () => {
    it('apply(change) leaves the receiver untouched and delegates to the wrapped UGraphic', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const root = UGraphicWithScale.create(new FakeUGraphic(), resolver, 1);
      const rootAppliedCountBefore = (root.getUg() as FakeUGraphic).applied.length;

      const marker: UChange = new Fore('#abcdef');
      const child = root.apply(marker);

      expect(child).not.toBe(root);
      expect((root.getUg() as FakeUGraphic).applied).toHaveLength(rootAppliedCountBefore);
      const childApplied = (child.getUg() as FakeUGraphic).applied;
      expect(childApplied[childApplied.length - 1]).toBe(marker);
    });

    it('applyTranslate returns a new instance; the pushed parent keeps its own untouched transform', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const root = UGraphicWithScale.create(new FakeUGraphic(), resolver, 1);
      const rootTranslateX = root.getAffineTransform().getTranslateX();

      const child = root.applyTranslate(10, 20);

      expect(child).not.toBe(root);
      expect(root.getAffineTransform().getTranslateX()).toBe(rootTranslateX);
      expect(child.getAffineTransform().getTranslateX()).toBe(10);
      expect(child.getAffineTransform().getTranslateY()).toBe(20);
    });

    it('applyRotate accumulates the angle on the returned instance only', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const root = UGraphicWithScale.create(new FakeUGraphic(), resolver, 1);

      const child = root.applyRotate(30, 0, 0);

      expect(root.getAngle()).toBe(0);
      expect(child.getAngle()).toBe(30);
    });

    it('applyMatrix returns a new instance, preserving angle/scale and composing the matrix', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const root = UGraphicWithScale.create(new FakeUGraphic(), resolver, 3);

      const child = root.applyMatrix(1, 0, 0, 1, 7, 9);

      expect(child).not.toBe(root);
      expect(child.getAngle()).toBe(0);
      expect(child.getInitialScale()).toBe(3);
      // concatenate: this(scale 3) * other(translate 7,9) ->
      // n02 = m00*7 + m01*9 + m02 = 3*7 + 0 + 0 = 21
      // n12 = m10*7 + m11*9 + m12 = 0 + 3*9 + 0 = 27
      expect(child.getAffineTransform().getTranslateX()).toBe(21);
      expect(child.getAffineTransform().getTranslateY()).toBe(27);
      // The receiver's own matrix is untouched by the concatenation.
      expect(root.getAffineTransform().getTranslateX()).toBe(0);
    });

    it('applyMatrix leaves a preceding applyRotate\'s angle untouched on the returned instance', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const rotated = UGraphicWithScale.create(new FakeUGraphic(), resolver, 1).applyRotate(15, 0, 0);

      const child = rotated.applyMatrix(1, 0, 0, 1, 0, 0);

      expect(child.getAngle()).toBe(15);
      expect(rotated.getAngle()).toBe(15);
    });
  });

  describe('applyScale — preserved upstream quirk: scale does NOT compound', () => {
    it('throws when changex !== changey (non-uniform scale is unsupported, matching upstream)', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const root = UGraphicWithScale.create(new FakeUGraphic(), resolver, 1);

      expect(() => root.applyScale(2, 3)).toThrow(/non-uniform scale/);
    });

    it('getInitialScale reflects only the LAST applyScale argument, not a cumulative product', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const root = UGraphicWithScale.create(new FakeUGraphic(), resolver, 5);

      const once = root.applyScale(2, 2);
      const twice = once.applyScale(3, 3);

      // Upstream: `1 * changex`, not `this.scale * changex` — 3, not 5*2*3=30.
      expect(twice.getInitialScale()).toBe(3);
    });

    it('the underlying affine matrix DOES compound across nested applyScale calls', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const root = UGraphicWithScale.create(new FakeUGraphic(), resolver, 1);

      const once = root.applyScale(2, 2);
      const twice = once.applyScale(3, 3);

      // Matrix compounds: 1 (initial getScaleInstance(1,1)) * 2 * 3 = 6.
      expect(twice.getAffineTransform().getScaleX()).toBe(6);
      // The intermediate instance is untouched by the later applyScale.
      expect(once.getAffineTransform().getScaleX()).toBe(2);
    });
  });

  describe('stack push/pop discipline (SvgNanoParser.drawU simulation)', () => {
    it('nested <g> pushes each retain their OWN transform/angle/scale, restored exactly on pop', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const depth0 = UGraphicWithScale.create(new FakeUGraphic(), resolver, 1);

      // Simulate SvgNanoParser's `stack.add(0, ugs)` push discipline.
      const stack: UGraphicWithScale[] = [];
      stack.unshift(depth0);
      const depth1 = depth0.applyTranslate(5, 0);
      stack.unshift(depth1);
      const depth2 = depth1.applyScale(2, 2);
      stack.unshift(depth2);

      // Pop back to depth1 (`</g>`): the popped-off top is discarded, and
      // the instance restored is the exact one pushed at that depth.
      const poppedTop = stack.shift();
      const restored = stack[0];

      expect(poppedTop).toBe(depth2);
      expect(restored).toBe(depth1);
      expect(restored?.getAffineTransform().getTranslateX()).toBe(5);
      expect(restored?.getInitialScale()).toBe(1);

      // depth0, still at the bottom of the stack, is untouched by either push.
      expect(stack[1]).toBe(depth0);
      expect(stack[1]?.getAffineTransform().getTranslateX()).toBe(0);
    });
  });

  describe('color and drawing delegation', () => {
    it('getDefaultColor/getTrueColor delegate to the injected ColorResolver', () => {
      const resolver = new FakeColorResolver('#101010', '#202020');
      const ugs = UGraphicWithScale.create(new FakeUGraphic(), resolver, 1);

      expect(ugs.getDefaultColor()).toBe('#101010');
      expect(ugs.getTrueColor('none')).toBe('#202020');
      expect(resolver.trueColorCalls).toEqual(['none']);
    });

    it('draw(shape) delegates to the wrapped UGraphic', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const fake = new FakeUGraphic();
      const ugs = UGraphicWithScale.create(fake, resolver, 1);
      const shape = new TestShape('circle');

      // draw() is delegated straight through getUg()'s current backing
      // FakeUGraphic instance, which `create` already replaced via
      // updateColor's two `apply` calls.
      const backing = ugs.getUg() as FakeUGraphic;
      ugs.draw(shape);

      expect(backing.drawn).toEqual([shape]);
    });

    it('getUg exposes the current wrapped UGraphic, reflecting prior apply() calls', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const root = UGraphicWithScale.create(new FakeUGraphic(), resolver, 1);
      const marker: UChange = new Fore('#ff00ff');

      const child = root.apply(marker);

      const rootLastApplied = (root.getUg() as FakeUGraphic).applied;
      const childApplied = (child.getUg() as FakeUGraphic).applied;
      expect(childApplied).toHaveLength(rootLastApplied.length + 1);
    });
  });

  describe('stroke-width scaling seam (AC3 — consumed by SvgNanoParser.applyFillAndStroke, T6/T8)', () => {
    it('getInitialScale is exactly the multiplier a caller applies to a raw stroke-width', () => {
      const resolver = new FakeColorResolver('#000000', '#000000');
      const ugs = UGraphicWithScale.create(new FakeUGraphic(), resolver, 1.5);

      const rawStrokeWidth = 2;
      const scaledStrokeWidth = rawStrokeWidth * ugs.getInitialScale();

      expect(scaledStrokeWidth).toBe(3);
    });
  });
});
