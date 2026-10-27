import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { TimeScaleCompressed } from '../../../../src/diagrams/gantt/timescale/TimeScaleCompressed.js';

// Expected values: TimeScaleCompressed.java delegating to TimeScaleDaily.java (cell = size * scale,
// :47-49, :51-59) and isBreaking = Sunday (:61-64). 2024-03-03 is a Sunday.
const day = (d: number): TimePoint => TimePoint.ofStartOfDay(2024, 3, d);

describe('TimeScaleCompressed', () => {
  it('positions and widths are the daily scale (:51-59)', () => {
    const s = new TimeScaleCompressed(10, day(1), 0.5, undefined);
    expect([1, 2, 3].map((d) => s.getPosition(day(d)))).toEqual([0, 5, 10]);
    expect(s.getWidth(day(2))).toBe(5);
  });

  it('zeroDay moves x = 0 to that day (:47-49 -> TimeScaleDaily.java:53-54)', () => {
    const s = new TimeScaleCompressed(10, day(1), 1, LocalDate.of(2024, 3, 2));
    expect([1, 2, 3].map((d) => s.getPosition(day(d)))).toEqual([-10, 0, 10]);
  });

  it('isBreaking only on Sundays (:61-64)', () => {
    const s = new TimeScaleCompressed(10, day(1), 1, undefined);
    expect([1, 2, 3, 4].map((d) => s.isBreaking(day(d)))).toEqual([false, false, true, false]);
  });
});
