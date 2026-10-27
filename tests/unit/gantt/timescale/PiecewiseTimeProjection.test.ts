import { describe, expect, it } from 'vitest';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { PiecewiseTimeProjection } from '../../../../src/diagrams/gantt/timescale/PiecewiseTimeProjection.js';
import { PixelInstant } from '../../../../src/diagrams/gantt/timescale/PixelInstant.js';

describe('PiecewiseTimeProjection', () => {
  const a = new PixelInstant(TimePoint.ofStartOfDay(2024, 3, 1), 0);
  const b = new PixelInstant(TimePoint.ofStartOfDay(2024, 3, 5), 40);
  const p = new PiecewiseTimeProjection(a, b);

  it('getStart/getEnd (PiecewiseTimeProjection.java:45-56)', () => {
    expect(p.getStart()).toBe(a);
    expect(p.getEnd()).toBe(b);
  });

  it.each([
    [2024, 2, 29, false],
    [2024, 3, 1, true],
    [2024, 3, 3, true],
    [2024, 3, 5, true],
    [2024, 3, 6, false],
  ])('contains(%i-%i-%i) is inclusive at both ends -> %s (:58-63)', (y, m, d, expected) => {
    expect(p.contains(TimePoint.ofStartOfDay(y, m, d))).toBe(expected);
  });
});
