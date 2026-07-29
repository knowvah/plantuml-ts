/**
 * AbstractAtom.test.ts — T10a: unit coverage for `AbstractAtom`
 * (klimt/creole/atom/AbstractAtom.java): the `TextBlockMemoized`
 * memoization it inherits stays wired through a concrete subclass, and
 * the ADR-9 `getNeutrons()` adaptation (throws instead of building a real
 * `Neutron`, matching `SheetBlock1`/`SheetBlock2`'s established
 * precedent).
 */
import { describe, expect, it } from 'vitest';
import { AbstractAtom } from '../../../../../../src/core/klimt/creole/atom/AbstractAtom.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}

/** Minimal concrete subclass — a fixed-size, zero-altitude atom that
 *  counts how many times `calculateDimensionSlow`/`drawU` actually ran. */
class CountingAtom extends AbstractAtom {
  slowCalls = 0;
  drawCalls = 0;

  protected calculateDimensionSlow(_stringBounder: StringBounder): XDimension2D {
    this.slowCalls += 1;
    return new XDimension2D(7, 9);
  }

  getStartingAltitude(_stringBounder: StringBounder): number {
    return -3;
  }

  drawU(_ug: UGraphic): void {
    this.drawCalls += 1;
  }
}

const sb: StringBounder = new FakeStringBounder();

describe('AbstractAtom — TextBlockMemoized wiring survives through a subclass', () => {
  it('calculateDimension delegates to calculateDimensionSlow and returns its value', () => {
    const atom = new CountingAtom();
    expect(atom.calculateDimension(sb)).toEqual(new XDimension2D(7, 9));
  });

  it('memoizes: a second call with the SAME StringBounder constructor does not re-invoke calculateDimensionSlow', () => {
    const atom = new CountingAtom();
    atom.calculateDimension(sb);
    atom.calculateDimension(sb);
    expect(atom.slowCalls).toBe(1);
  });

  it('a DIFFERENT StringBounder constructor invalidates the cache', () => {
    class OtherStringBounder implements StringBounder {
      calculateDimension(): XDimension2D {
        return new XDimension2D(0, 0);
      }
    }
    const atom = new CountingAtom();
    atom.calculateDimension(sb);
    atom.calculateDimension(new OtherStringBounder());
    expect(atom.slowCalls).toBe(2);
  });

  it('getStartingAltitude is left to the subclass (Java: abstract in this port too)', () => {
    const atom = new CountingAtom();
    expect(atom.getStartingAltitude(sb)).toBe(-3);
  });
});

describe('AbstractAtom.getNeutrons — ADR-9 adaptation', () => {
  it('always throws UnsupportedOperationException, matching SheetBlock1/SheetBlock2 precedent', () => {
    const atom = new CountingAtom();
    expect(() => atom.getNeutrons()).toThrow('UnsupportedOperationException');
  });
});
