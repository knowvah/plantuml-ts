import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { TimeScaleDaily } from '../../../../src/diagrams/gantt/timescale/TimeScaleDaily.js';

const MAR_1 = TimePoint.ofStartOfDay(2024, 3, 1);

describe('TimeScaleDaily', () => {
  it('without zeroDay the starting day is x = 0 (TimeScaleDaily.java:49-56)', () => {
    const s = new TimeScaleDaily(10, MAR_1, 1, undefined);
    expect([1, 2, 3].map((d) => s.getPosition(TimePoint.ofStartOfDay(2024, 3, d)))).toEqual([0, 10, 20]);
  });

  it('with zeroDay that day is x = 0 (:53-54)', () => {
    const s = new TimeScaleDaily(10, MAR_1, 0.5, LocalDate.of(2024, 3, 2));
    expect([1, 2, 3].map((d) => s.getPosition(TimePoint.ofStartOfDay(2024, 3, d)))).toEqual([-5, 0, 5]);
  });

  it('getWidth = size * scale and isBreaking is always true (:63-71)', () => {
    const s = new TimeScaleDaily(30, MAR_1, 0.25, undefined);
    expect(s.getWidth(MAR_1)).toBe(7.5);
    expect(s.isBreaking(MAR_1)).toBe(true);
    expect(s.isBreaking(TimePoint.ofStartOfDay(2024, 3, 6))).toBe(true);
  });
});
