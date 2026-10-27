import { describe, expect, it } from 'vitest';
import { RealMin } from '../../../../src/core/real/RealMin.js';
import { UnsupportedOperationException } from '../../../../src/core/real/AbstractReal.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';

describe('RealMin', () => {
  it('is the smallest element, cached after the first read (java:58-71)', () => {
    const origin = RealUtils.createOrigin();
    const a = origin.addAtLeast(4);
    const b = origin.addAtLeast(9);
    const min = RealUtils.min([b, a]) as RealMin;
    expect(min).toBeInstanceOf(RealMin);
    expect(min.getName()).toBe('min 2');
    expect(min.size()).toBe(2);
    expect(min.getCurrentValue()).toBe(4);
    (a as unknown as { move(d: number): void }).move(-50);
    expect(min.getCurrentValue()).toBe(4);
  });

  it('ensureBiggerThan forwards to every element (java:81-85)', () => {
    const origin = RealUtils.createOrigin();
    const x = origin.addAtLeast(10);
    const y = origin.addAtLeast(30);
    const min = RealUtils.min([x, y]);
    min.ensureBiggerThan(origin.addFixed(50));
    origin.compileNow();
    expect(x.getCurrentValue()).toBe(50);
    expect(y.getCurrentValue()).toBe(50);
    expect(min.getCurrentValue()).toBe(50);
  });

  it('addFixed wraps in a RealDelta; the others refuse (java:73-79,91-93)', () => {
    const origin = RealUtils.createOrigin();
    const min = RealUtils.min([origin.addAtLeast(2)]);
    expect(min.addFixed(3).getCurrentValue()).toBe(5);
    expect(() => min.addAtLeast(1)).toThrow(UnsupportedOperationException);
    expect(() => min.printCreationStackTrace()).toThrow(UnsupportedOperationException);
  });
});
