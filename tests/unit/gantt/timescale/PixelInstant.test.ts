import { describe, expect, it } from 'vitest';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { PixelInstant } from '../../../../src/diagrams/gantt/timescale/PixelInstant.js';

describe('PixelInstant', () => {
  it('returns the constructor arguments (PixelInstant.java:45-56)', () => {
    const t = TimePoint.ofStartOfDay(2024, 3, 1);
    const p = new PixelInstant(t, 12.5);
    expect(p.getInstant()).toBe(t);
    expect(p.getPosition()).toBe(12.5);
  });
});
