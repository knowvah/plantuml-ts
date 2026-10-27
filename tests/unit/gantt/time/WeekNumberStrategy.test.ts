import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { WeekFields } from '../../../../src/core/time/WeekFields.js';
import { WeekNumberStrategy } from '../../../../src/diagrams/gantt/time/WeekNumberStrategy.js';

/** Gantt reads LocalDate#get(WeekFields.of(first, min).weekOfYear()) (JDK WeekFields semantics). */
function weekOfYear(s: WeekNumberStrategy, y: number, m: number, d: number): number {
  const wf = WeekFields.of(s.getFirstDayOfWeek(), s.getMinimalDaysInFirstWeek());
  return LocalDate.of(y, m, d).get(wf.weekOfYear());
}

describe('WeekNumberStrategy', () => {
  it('returns the constructor arguments (WeekNumberStrategy.java:41-58)', () => {
    const s = new WeekNumberStrategy(DayOfWeek.SUNDAY, 1);
    expect(s.getFirstDayOfWeek()).toBe(DayOfWeek.SUNDAY);
    expect(s.getMinimalDaysInFirstWeek()).toBe(1);
  });

  // JDK WeekFields.weekOfYear around 2020-12-31 (Thu), 2021-01-01 (Fri), 01-03 (Sun), 01-04 (Mon)
  it.each([
    ['ISO (Mon,4)', DayOfWeek.MONDAY, 4, [53, 0, 0, 1]],
    ['(Sun,1)', DayOfWeek.SUNDAY, 1, [53, 1, 2, 2]],
    ['(Mon,1)', DayOfWeek.MONDAY, 1, [53, 1, 1, 2]],
    ['(Sun,4)', DayOfWeek.SUNDAY, 4, [53, 0, 1, 1]],
  ] as const)('%s across the 2020/2021 boundary', (_label, first, min, expected) => {
    const s = new WeekNumberStrategy(first, min);
    expect([
      weekOfYear(s, 2020, 12, 31),
      weekOfYear(s, 2021, 1, 1),
      weekOfYear(s, 2021, 1, 3),
      weekOfYear(s, 2021, 1, 4),
    ]).toEqual(expected);
  });
});
