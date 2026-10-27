import { describe, expect, it } from 'vitest';
import { RealMax } from '../../../../src/core/real/RealMax.js';
import { UnsupportedOperationException } from '../../../../src/core/real/AbstractReal.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';

describe('RealMax', () => {
  it('is the largest element, cached after the first read (java:92-116)', () => {
    const origin = RealUtils.createOrigin();
    const small = origin.addAtLeast(4);
    const big = origin.addAtLeast(9);
    const max = RealUtils.max([small, big, origin]);
    expect(max).toBeInstanceOf(RealMax);
    expect(max.getName()).toBe('max 3');
    expect(max.getCurrentValue()).toBe(9);
    // Cached: a later change of the elements is not seen (java:93-94).
    origin.addAtLeast(0);
    (big as unknown as { move(d: number): void }).move(100);
    expect(max.getCurrentValue()).toBe(9);
  });

  it('addFixed wraps in a RealDelta; the others refuse (java:118-128)', () => {
    const origin = RealUtils.createOrigin();
    const max = RealUtils.max([origin.addAtLeast(2)]);
    expect(max.addFixed(3).getCurrentValue()).toBe(5);
    expect(() => max.addAtLeast(1)).toThrow(UnsupportedOperationException);
    expect(() => max.ensureBiggerThan(origin)).toThrow(UnsupportedOperationException);
    expect(max.printCreationStackTrace()).toBeUndefined();
  });

  it('line() of an empty collection throws (java:82)', () => {
    expect(() => RealMax.line([])).toThrow('NoSuchElementException');
  });
});
