import { describe, expect, it } from 'vitest';
import { RealMiddle2 } from '../../../../src/core/real/RealMiddle2.js';
import { UnsupportedOperationException } from '../../../../src/core/real/AbstractReal.js';
import { castRealMoveable } from '../../../../src/core/real/RealMoveable.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';

describe('RealMiddle2', () => {
  const build = () => {
    const origin = RealUtils.createOrigin();
    const p1 = castRealMoveable(origin.addAtLeast(10));
    const p2 = castRealMoveable(origin.addAtLeast(30));
    return { origin, p1, p2, middle: RealUtils.middle(p1, p2) as RealMiddle2 };
  };

  it('is the average of its ends (java:53-55)', () => {
    const { middle } = build();
    expect(middle).toBeInstanceOf(RealMiddle2);
    expect(middle.getName()).toBe('middle');
    expect(middle.getCurrentValue()).toBe(20);
  });

  it('moving it moves each end by half the delta (java:69-73)', () => {
    const { middle, p1, p2 } = build();
    middle.move(10);
    expect(p1.getCurrentValue()).toBe(15);
    expect(p2.getCurrentValue()).toBe(35);
    expect(middle.getCurrentValue()).toBe(25);
  });

  it('ensureBiggerThan adds a force that halves the shortfall per pass (java:65-67)', () => {
    const { origin, middle } = build();
    middle.ensureBiggerThan(origin.addFixed(40));
    origin.compileNow();
    // Each pass moves the middle by half the shortfall (move(-diff) -> ends
    // move -diff/2): shortfall 20, 10, 5, ... stops once <= 1e-6, i.e. 25
    // moves: 40 - 20 * 2^-25.
    expect(middle.getCurrentValue()).toBeCloseTo(40 - 20 / 2 ** 25, 9);
  });

  it('addAtLeast is refused (java:61-63)', () => {
    expect(() => build().middle.addAtLeast(1)).toThrow(UnsupportedOperationException);
  });
});
