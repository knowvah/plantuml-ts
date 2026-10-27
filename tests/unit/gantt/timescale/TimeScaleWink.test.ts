import { describe, expect, it } from 'vitest';
import { PrintScale } from '../../../../src/diagrams/gantt/core/PrintScale.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { TimeScaleWink } from '../../../../src/diagrams/gantt/timescale/TimeScaleWink.js';

describe('TimeScaleWink', () => {
  it('cellWidth = size * scale; width ignores the instant (TimeScaleWink.java:46-49, 57-60)', () => {
    const s = new TimeScaleWink(30, 0.25, PrintScale.DAILY);
    expect(s.getWidth(TimePoint.ofStartOfDay(2024, 3, 1))).toBe(7.5);
  });

  it('getPosition = millis * cellWidth / MILLISECONDS_PER_DAY (:51-55)', () => {
    const s = new TimeScaleWink(10, 1, PrintScale.DAILY);
    // 2024-03-01 is epoch day 19783 (1709251200000 ms).
    expect(s.getPosition(TimePoint.ofStartOfDay(2024, 3, 1))).toBe(197_830);
    expect(s.getPosition(TimePoint.ofStartOfDay(2024, 3, 2))).toBe(197_840);
    expect(s.getPosition(TimePoint.create(43_200_000))).toBe(5);
    expect(s.getPosition(TimePoint.create(-86_400_000))).toBe(-10);
  });

  it('isBreaking is true for non-WEEKLY scales (:62-70)', () => {
    const d = TimePoint.ofStartOfDay(2024, 3, 1);
    expect(new TimeScaleWink(10, 1, PrintScale.DAILY).isBreaking(d)).toBe(true);
    expect(new TimeScaleWink(10, 1, PrintScale.MONTHLY).isBreaking(d)).toBe(true);
  });

  it('WEEKLY breaks when epoch day % 7 == 6, i.e. on Wednesdays (:64-67)', () => {
    const s = new TimeScaleWink(10, 1, PrintScale.WEEKLY);
    // epoch day 19783 = 7 * 2826 + 1 -> remainder 1; 19788 -> 6 (Wednesday 2024-03-06).
    expect(s.isBreaking(TimePoint.ofStartOfDay(2024, 3, 1))).toBe(false);
    expect(s.isBreaking(TimePoint.ofStartOfDay(2024, 3, 6))).toBe(true);
    expect(s.isBreaking(TimePoint.ofStartOfDay(2024, 3, 7))).toBe(false);
    // 1970-01-07 = epoch day 6.
    expect(s.isBreaking(TimePoint.ofStartOfDay(1970, 1, 7))).toBe(true);
  });

  it('WEEKLY on a negative epoch day: long division truncates, % keeps the sign (:66-67)', () => {
    const s = new TimeScaleWink(10, 1, PrintScale.WEEKLY);
    // epoch day -1 -> num = 0 (truncated), 0 % 7 = 0; epoch day -1 is never a break in Java.
    expect(s.isBreaking(TimePoint.create(-86_400_000))).toBe(false);
    // epoch day -8 -> num -8 % 7 = -1, not 6.
    expect(s.isBreaking(TimePoint.create(-8 * 86_400_000))).toBe(false);
  });
});
