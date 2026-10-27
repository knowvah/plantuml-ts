import { describe, expect, it } from 'vitest';
import { PositiveForce } from '../../../../src/core/real/PositiveForce.js';
import { IllegalArgumentException, IllegalStateException } from '../../../../src/core/real/AbstractReal.js';
import { RealImpl } from '../../../../src/core/real/RealImpl.js';
import { RealLine } from '../../../../src/core/real/RealLine.js';
import type { Real } from '../../../../src/core/real/Real.js';

const newPoint = (line: RealLine, value: number): RealImpl => new RealImpl('p', line, value);

describe('PositiveForce', () => {
  it('rejects a force from a point to itself (PositiveForce.java:47-49)', () => {
    const p = newPoint(new RealLine(), 1);
    expect(() => new PositiveForce(p, p, 0)).toThrow(IllegalArgumentException);
  });

  it('moves the moving point when the distance is short (java:80-81,102-103)', () => {
    const line = new RealLine();
    const fixed = newPoint(line, 0);
    const moving = newPoint(line, 5);
    // distance 5 - 0 = 5, diff = 5 - 10 = -5 < -epsilon -> move(5).
    expect(new PositiveForce(fixed, moving, 10).apply()).toBe(true);
    expect(moving.getCurrentValue()).toBe(10);
  });

  it('leaves a satisfied force alone (java:93-97)', () => {
    const line = new RealLine();
    const fixed = newPoint(line, 0);
    const moving = newPoint(line, 12);
    expect(new PositiveForce(fixed, moving, 10).apply()).toBe(false);
    expect(moving.getCurrentValue()).toBe(12);
  });

  it('absorbs a shortfall below the 1e-6 floor (java:91-93)', () => {
    const line = new RealLine();
    const fixed = newPoint(line, 0);
    const moving = newPoint(line, 10 - 1e-7);
    expect(new PositiveForce(fixed, moving, 10).apply()).toBe(false);
    expect(moving.getCurrentValue()).toBe(10 - 1e-7);
  });

  it('scales the tolerance with the ULP of large operands (java:91-92)', () => {
    // ulp(1e12) = 2^-13, so epsilon = 1000 * 2^-13 = 0.1220703125 > 1e-4.
    const line = new RealLine();
    const fixed = newPoint(line, 0);
    const moving = newPoint(line, 1e12);
    expect(new PositiveForce(fixed, moving, 1e12 + 1e-4).apply()).toBe(false);
    // A shortfall of 1 is above that epsilon: it moves.
    const moving2 = newPoint(line, 1e12);
    expect(new PositiveForce(fixed, moving2, 1e12 + 1).apply()).toBe(true);
    expect(moving2.getCurrentValue()).toBe(1e12 + 1);
  });

  it('uses the epsilon floor for huge, tiny and non-finite operands', () => {
    const line = new RealLine();
    // MAX_VALUE operand: ulp = 2^971, still finite.
    const huge = newPoint(line, Number.MAX_VALUE);
    expect(new PositiveForce(newPoint(line, 0), huge, 1).apply()).toBe(false);
    // Infinite operand: ulp(Infinity) = Infinity, diff = Infinity >= -Infinity.
    const inf = newPoint(line, Number.POSITIVE_INFINITY);
    expect(new PositiveForce(newPoint(line, 0), inf, 1).apply()).toBe(false);
    // NaN operand: epsilon is NaN, `NaN >= -NaN` is false, so it "moves".
    const nan = newPoint(line, Number.NaN);
    expect(new PositiveForce(newPoint(line, 0), nan, 1).apply()).toBe(true);
  });

  it('rethrows an IllegalStateException from the fixed point (java:72-78)', () => {
    const line = new RealLine();
    const moving = newPoint(line, 0);
    let created = 0;
    const faulty: Real = {
      printCreationStackTrace: () => {
        created++;
      },
      getName: () => 'faulty',
      getCurrentValue: () => {
        throw new IllegalStateException('Infinite recursion?');
      },
      addFixed: () => faulty,
      addAtLeast: () => faulty,
      ensureBiggerThan: () => undefined,
    };
    const force = new PositiveForce(faulty, moving, 0);
    expect(() => force.apply()).toThrow('Infinite recursion?');
    expect(created).toBe(1);
  });

  it('does not intercept other errors from the fixed point', () => {
    const line = new RealLine();
    const moving = newPoint(line, 0);
    let created = 0;
    const broken: Real = {
      printCreationStackTrace: () => {
        created++;
      },
      getName: () => 'broken',
      getCurrentValue: () => {
        throw new TypeError('boom');
      },
      addFixed: () => broken,
      addAtLeast: () => broken,
      ensureBiggerThan: () => undefined,
    };
    expect(() => new PositiveForce(broken, moving, 0).apply()).toThrow(TypeError);
    expect(created).toBe(0);
  });

  it('prints as upstream concatenates it (java:60-62)', () => {
    const line = new RealLine();
    const fixed = newPoint(line, 0);
    const moving = newPoint(line, 0);
    const text = new PositiveForce(fixed, moving, 10).toString();
    expect(text).toBe(`PositiveForce fixed=${String(fixed)} moving=${String(moving)} min=10.0`);
    expect(text).toMatch(/^PositiveForce fixed=#\d+_p moving=#\d+_p min=10\.0$/);
  });
});
