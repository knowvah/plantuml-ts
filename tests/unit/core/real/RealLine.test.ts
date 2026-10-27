import { describe, expect, it } from 'vitest';
import { RealLine } from '../../../../src/core/real/RealLine.js';
import { IllegalStateException, UnsupportedOperationException } from '../../../../src/core/real/AbstractReal.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';
import { castAbstractReal } from '../../../../src/core/real/AbstractReal.js';

describe('RealLine', () => {
  it('compile settles a chain of forces and records the extremes (java:77-117)', () => {
    const origin = RealUtils.createOrigin();
    // addAtLeast(10): value 10, force F1(O,c,10)   (RealImpl.java:60-61)
    const c = origin.addAtLeast(10);
    // d: value 10+7 = 17, force F2(c,d,7)
    const d = c.addAtLeast(7);
    // F3(RealDelta(O,20), c, 0)   (RealImpl.java:65-67)
    c.ensureBiggerThan(origin.addFixed(20));
    origin.compileNow();
    // Pass 1: F1 ok, F2 ok (17-10=7), F3 moves c by 10 -> 20.
    // Pass 2: F2: 17-20-7 = -10 -> d = 27. Pass 3: nothing changes.
    expect(c.getCurrentValue()).toBe(20);
    expect(d.getCurrentValue()).toBe(27);
    const line = castAbstractReal(origin).getLine();
    expect(line.getAbsoluteMax()).toBe(27);
    expect(line.getAbsoluteMin()).toBe(0);
  });

  it('keeps a negative extreme in min (java:103-104)', () => {
    const origin = RealUtils.createOrigin();
    const below = origin.addFixed(-4);
    origin.compileNow();
    expect(below.getCurrentValue()).toBe(-4);
    expect(castAbstractReal(origin).getLine().getAbsoluteMin()).toBe(-4);
    expect(castAbstractReal(origin).getLine().getAbsoluteMax()).toBe(0);
  });

  it('throws "Infinite Loop?" when forces never settle (java:110-114)', () => {
    const origin = RealUtils.createOrigin();
    const a = origin.addAtLeast(10);
    const b = a.addAtLeast(10);
    // F(b,a,0) asks a >= b while F(a,b,10) asks b >= a + 10: each pass moves
    // a by 10 then b by 10 and never converges; cpt reaches 100000.
    a.ensureBiggerThan(b);
    const before = RealLine.CPT;
    let error: unknown;
    try {
      origin.compileNow();
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(IllegalStateException);
    expect((error as Error).message).toBe('Infinite Loop?');
    expect(RealLine.CPT).toBe(before);
    expect(a.getCurrentValue()).toBe(10 + 10 * 100000);
  });

  it('adds the pass count to CPT when it settles (java:93)', () => {
    const origin = RealUtils.createOrigin();
    origin.addAtLeast(5).ensureBiggerThan(origin.addFixed(8));
    const before = RealLine.CPT;
    origin.compileNow();
    // Pass 0 moves (cpt -> 1), pass 1 settles: CPT += 1.
    expect(RealLine.CPT).toBe(before + 1);
  });

  it('register is a no-op and exposes the absolute reals (java:53-57,133-139)', () => {
    const line = castAbstractReal(RealUtils.createOrigin()).getLine();
    expect(line.register(5)).toBeUndefined();
    const max = line.asMaxAbsolute();
    const min = line.asMinAbsolute();
    expect(max.getName()).toBe('net.sourceforge.plantuml.real.RealLine$MaxAbsolute');
    expect(min.getName()).toBe('net.sourceforge.plantuml.real.RealLine$MinAbsolute');
    expect(max.getCurrentValue()).toBe(0);
    expect(min.getCurrentValue()).toBe(0);
    expect(() => max.addFixed(1)).toThrow(UnsupportedOperationException);
    expect(() => max.addAtLeast(1)).toThrow(UnsupportedOperationException);
    expect(() => min.ensureBiggerThan(max)).toThrow(UnsupportedOperationException);
    expect(max.printCreationStackTrace()).toBeUndefined();
    const abstractMax = max as unknown as { getMaxAbsolute(): unknown; getMinAbsolute(): unknown };
    expect((abstractMax.getMaxAbsolute() as { getName(): string }).getName()).toBe(max.getName());
    expect((abstractMax.getMinAbsolute() as { getName(): string }).getName()).toBe(min.getName());
  });
});
