import { describe, expect, it } from 'vitest';
import { RealMiddle } from '../../../../src/core/real/RealMiddle.js';
import { UnsupportedOperationException } from '../../../../src/core/real/AbstractReal.js';
import { castRealMoveable } from '../../../../src/core/real/RealMoveable.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';

describe('RealMiddle', () => {
  const build = (): RealMiddle => {
    const origin = RealUtils.createOrigin();
    const p1 = castRealMoveable(origin.addAtLeast(10));
    const p2 = castRealMoveable(origin.addAtLeast(30));
    return RealMiddle.create(p1, p2);
  };

  it('is the midpoint plus a delta that addFixed accumulates (java:57-63)', () => {
    const middle = build();
    expect(middle.getCurrentValue()).toBe(20);
    expect(middle.addFixed(2).addFixed(0.5).getCurrentValue()).toBe(22.5);
  });

  it('names its ends and refuses the movable operations (java:65-79)', () => {
    const middle = build();
    expect(middle.getName()).toBe('[Middle addAtLeast10.0 and addAtLeast30.0]');
    expect(() => middle.addAtLeast(1)).toThrow(UnsupportedOperationException);
    expect(() => middle.ensureBiggerThan(middle)).toThrow(UnsupportedOperationException);
    expect(() => middle.printCreationStackTrace()).toThrow(UnsupportedOperationException);
  });
});
