import { describe, expect, it } from 'vitest';
import { RealImpl } from '../../../../src/core/real/RealImpl.js';
import { RealLine } from '../../../../src/core/real/RealLine.js';
import { RealMoveable } from '../../../../src/core/real/RealMoveable.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';
import type { Real } from '../../../../src/core/real/Real.js';
import type { RealOrigin } from '../../../../src/core/real/RealOrigin.js';

// Also covers the interface-only files Real.java and RealOrigin.java.
describe('RealImpl', () => {
  it('holds its value and moves by a delta (java:47-54)', () => {
    const impl = new RealImpl('x', new RealLine(), 4);
    expect(impl.getCurrentValue()).toBe(4);
    impl.move(2.5);
    expect(impl.getCurrentValue()).toBe(6.5);
    expect(impl.getName()).toBe('x');
    expect(impl.toString()).toMatch(/^#\d+_x$/);
  });

  it('addAtLeast builds a named point one force away (java:56-63)', () => {
    const origin = RealUtils.createOrigin();
    const next = origin.addAtLeast(12);
    expect(next.getCurrentValue()).toBe(12);
    expect(next.getName()).toBe('addAtLeast12.0');
  });

  it('is a RealOrigin whose compileNow solves the line (java:65-71)', () => {
    const origin: RealOrigin = RealUtils.createOrigin();
    const r: Real = origin.addAtLeast(1);
    r.ensureBiggerThan(origin.addFixed(9));
    origin.compileNow();
    expect(r.getCurrentValue()).toBe(9);
    expect(origin.getName()).toBe('O');
  });

  it('numbers RealMoveables from a shared counter (RealMoveable.java:42-43)', () => {
    const a = new RealImpl('a', new RealLine(), 0);
    const b = new RealImpl('b', new RealLine(), 0);
    const ia = Number(/^#(\d+)_a$/.exec(a.toString())?.[1]);
    const ib = Number(/^#(\d+)_b$/.exec(b.toString())?.[1]);
    expect(ib).toBe(ia + 1);
    expect(RealMoveable.CPT).toBeGreaterThanOrEqual(ib + 1);
  });

  it('printCreationStackTrace prints nothing when capture is off', () => {
    const impl = new RealImpl('x', new RealLine(), 0);
    expect(impl.printCreationStackTrace()).toBeUndefined();
  });
});
