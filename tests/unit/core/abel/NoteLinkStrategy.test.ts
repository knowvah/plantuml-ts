/**
 * NoteLinkStrategy.test.ts — SI1/T2: the 3-value `NoteLinkStrategy`
 * enum (abel/NoteLinkStrategy.java:41) and `computeDimension` (:43-51).
 */
import { describe, expect, it } from 'vitest';
import { NoteLinkStrategy, computeDimension } from '../../../../src/core/abel/NoteLinkStrategy.js';

describe('NoteLinkStrategy values (java:41)', () => {
  it('has the 3 upstream values in declaration order', () => {
    expect(Object.keys(NoteLinkStrategy)).toEqual(['NORMAL', 'HALF_PRINTED_FULL', 'HALF_NOT_PRINTED']);
  });
});

describe('computeDimension (java:43-51)', () => {
  it('NORMAL keeps the full dimension', () => {
    const d = computeDimension(NoteLinkStrategy.NORMAL, 10, 4);
    expect(d.getWidth()).toBe(10);
    expect(d.getHeight()).toBe(4);
  });

  it('HALF_PRINTED_FULL halves the width only', () => {
    const d = computeDimension(NoteLinkStrategy.HALF_PRINTED_FULL, 10, 4);
    expect(d.getWidth()).toBe(5);
    expect(d.getHeight()).toBe(4);
  });

  it('HALF_NOT_PRINTED collapses to 0x0', () => {
    const d = computeDimension(NoteLinkStrategy.HALF_NOT_PRINTED, 10, 4);
    expect(d.getWidth()).toBe(0);
    expect(d.getHeight()).toBe(0);
  });
});
