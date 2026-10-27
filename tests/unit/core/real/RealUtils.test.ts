import { describe, expect, it } from 'vitest';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';
import { ClassCastException } from '../../../../src/core/real/AbstractReal.js';
import type { Real } from '../../../../src/core/real/Real.js';

describe('RealUtils', () => {
  it('createOrigin builds the "O" point at 0 (java:44-48)', () => {
    const origin = RealUtils.createOrigin();
    expect(origin.getName()).toBe('O');
    expect(origin.getCurrentValue()).toBe(0);
  });

  it('max and min of solved chains (java:65-79)', () => {
    const origin = RealUtils.createOrigin();
    const c = origin.addAtLeast(10);
    const d = c.addAtLeast(7);
    c.ensureBiggerThan(origin.addFixed(20));
    origin.compileNow();
    // Traced in RealLine.test.ts: c = 20, d = 27.
    expect(RealUtils.max([c, d]).getCurrentValue()).toBe(27);
    expect(RealUtils.min([c, d]).getCurrentValue()).toBe(20);
  });

  it('middle casts both arguments to RealMoveable (java:61-63)', () => {
    const origin = RealUtils.createOrigin();
    const max = RealUtils.max([origin]);
    expect(() => RealUtils.middle(origin, max)).toThrow(ClassCastException);
    expect(RealUtils.middle(origin.addAtLeast(2), origin.addAtLeast(4)).getCurrentValue()).toBe(3);
  });

  it('withLiveOffset reads the supplier lazily (java:57-59)', () => {
    const origin = RealUtils.createOrigin();
    let offset = 1;
    const live: Real = RealUtils.withLiveOffset(origin, () => offset);
    offset = 4;
    expect(live.getCurrentValue()).toBe(4);
  });
});
