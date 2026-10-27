import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { OpenClose } from '../../../../src/diagrams/gantt/OpenClose.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { TimeScaleDailyHideClosed } from '../../../../src/diagrams/gantt/timescale/TimeScaleDailyHideClosed.js';

// Expected values: TimeScaleDailyHideClosed.java. 2024-03-01 is a Friday; weekends are closed.
const day = (d: number): TimePoint => TimePoint.ofStartOfDay(2024, 3, d);
const weekendsClosed = (): OpenClose => {
  const c = new OpenClose();
  c.close(DayOfWeek.SATURDAY);
  c.close(DayOfWeek.SUNDAY);
  return c;
};
const scale = (): TimeScaleDailyHideClosed => new TimeScaleDailyHideClosed(10, day(1), 2, weekendsClosed());

describe('TimeScaleDailyHideClosed', () => {
  it('closed days add no pixels: Fri 0, Sat 20, Sun 20, Mon 20, Tue 40 (:71-83, cellWidth = size * scale :54)', () => {
    const s = scale();
    expect([1, 2, 3, 4, 5].map((d) => s.getPosition(day(d)))).toEqual([0, 20, 20, 20, 40]);
  });

  it('positions are stable across calls in any order (:61-69)', () => {
    const s = scale();
    expect(s.getPosition(day(8))).toBe(100);
    expect(s.getPosition(day(2))).toBe(20);
    expect(s.getPosition(day(8))).toBe(100);
  });

  it('the starting day is x = 0 without computing (:58, :72-73)', () => {
    expect(scale().getPosition(day(1))).toBe(0);
  });

  it('an instant before the starting day is an IllegalArgumentException (:62-63)', () => {
    expect(() => scale().getPosition(TimePoint.ofStartOfDay(2024, 2, 29))).toThrow(RangeError);
  });

  it('an intra-day instant has no entry: NullPointerException on unboxing (:68)', () => {
    const s = scale();
    const sixAm = TimePoint.of(
      day(4)
        .toLocalDateTime()
        .plusSeconds(6 * 3600),
    );
    expect(() => s.getPosition(sixAm)).toThrow('NullPointerException');
  });

  it('getWidth is cellWidth on open days and 0 on closed days (:85-90)', () => {
    const s = scale();
    expect([1, 2, 3, 4].map((d) => s.getWidth(day(d)))).toEqual([20, 0, 0, 20]);
  });

  it('isBreaking is always true (:92-95)', () => {
    expect(scale().isBreaking(day(2))).toBe(true);
    expect(scale().isBreaking(day(4))).toBe(true);
  });
});
