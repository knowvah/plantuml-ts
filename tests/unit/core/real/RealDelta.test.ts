import { describe, expect, it } from 'vitest';
import { RealDelta } from '../../../../src/core/real/RealDelta.js';
import { ClassCastException } from '../../../../src/core/real/AbstractReal.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';
import type { Real } from '../../../../src/core/real/Real.js';

describe('RealDelta', () => {
  it('is delegated + diff, named without the ancestry (java:55,61-63)', () => {
    const origin = RealUtils.createOrigin();
    const shifted = origin.addFixed(3);
    expect(shifted).toBeInstanceOf(RealDelta);
    expect(shifted.getCurrentValue()).toBe(3);
    expect(shifted.getName()).toBe('[Delegated d=3.0]');
    expect(shifted.addFixed(0.5).getName()).toBe('[Delegated d=0.5]');
    expect(shifted.addFixed(0.5).getCurrentValue()).toBe(3.5);
  });

  it('addAtLeast wraps the delegate and keeps the diff (java:65-67)', () => {
    const origin = RealUtils.createOrigin();
    const wrapped = origin.addFixed(2).addAtLeast(10);
    // delegate = O.addAtLeast(10) = 10; + 2.
    expect(wrapped.getCurrentValue()).toBe(12);
  });

  it('ensureBiggerThan shifts the other by -diff and moves through (java:69-75)', () => {
    const origin = RealUtils.createOrigin();
    const base = origin.addAtLeast(1); // 1
    const shifted = base.addFixed(4); // 5
    shifted.ensureBiggerThan(origin.addFixed(30));
    origin.compileNow();
    // force(RealDelta(RealDelta(O,30), -4), base, 0): base >= 26.
    expect(base.getCurrentValue()).toBe(26);
    expect(shifted.getCurrentValue()).toBe(30);
  });

  it('move delegates to the underlying moveable (java:73-75)', () => {
    const origin = RealUtils.createOrigin();
    const base = origin.addAtLeast(1);
    const shifted = base.addFixed(4) as RealDelta;
    shifted.move(2);
    expect(base.getCurrentValue()).toBe(3);
  });

  it('refuses a delegate that is not an AbstractReal (the Java cast)', () => {
    const foreign: Real = {
      printCreationStackTrace: () => undefined,
      getName: () => 'foreign',
      getCurrentValue: () => 1,
      addFixed: () => foreign,
      addAtLeast: () => foreign,
      ensureBiggerThan: () => undefined,
    };
    expect(() => new RealDelta(foreign, 1)).toThrow(ClassCastException);
  });

  it('move refuses a delegate that is not a RealMoveable (java:74)', () => {
    const origin = RealUtils.createOrigin();
    const max = RealUtils.max([origin]);
    const delta = new RealDelta(max, 1);
    expect(() => delta.move(1)).toThrow(ClassCastException);
  });
});
