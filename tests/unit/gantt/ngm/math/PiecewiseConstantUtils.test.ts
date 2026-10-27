import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../../src/core/time/LocalDate.js';
import { TimeRange } from '../../../../../src/diagrams/gantt/core/TimeRange.js';
import { Fraction } from '../../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import { PiecewiseConstantHours } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantHours.js';
import { PiecewiseConstantUtils } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantUtils.js';
import { PiecewiseConstantWeekday } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantWeekday.js';

// 2024-01-06 is a Saturday, 2024-01-08 a Monday.
const day = (d: number): LocalDate => LocalDate.of(2024, 1, d);
const weekend = PiecewiseConstantWeekday.of(Fraction.ONE)
  .with(DayOfWeek.SATURDAY, Fraction.ZERO)
  .with(DayOfWeek.SUNDAY, Fraction.ZERO);

describe('PiecewiseConstantUtils.isZeroOnDay (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantUtils.java:44)', () => {
  it('is true on a zero day and false on a worked day (:52-62)', () => {
    expect(PiecewiseConstantUtils.isZeroOnDay(weekend, day(6))).toBe(true);
    expect(PiecewiseConstantUtils.isZeroOnDay(weekend, day(7))).toBe(true);
    expect(PiecewiseConstantUtils.isZeroOnDay(weekend, day(8))).toBe(false);
  });

  it('stops at the start of the next day: a zero Friday before a worked Saturday (:54-55)', () => {
    const fridayOff = PiecewiseConstantWeekday.of(Fraction.ONE).with(DayOfWeek.FRIDAY, Fraction.ZERO);
    expect(PiecewiseConstantUtils.isZeroOnDay(fridayOff, day(5))).toBe(true);
  });

  it('is false when any segment inside the day is nonzero (:57-58)', () => {
    const hours = PiecewiseConstantHours.fromWorkingHours([new TimeRange('08:00', '12:00')]);
    expect(PiecewiseConstantUtils.isZeroOnDay(hours, day(8))).toBe(false);
  });

  it('is true for a profile with no working hours (:50-62)', () => {
    expect(PiecewiseConstantUtils.isZeroOnDay(PiecewiseConstantHours.fromWorkingHours([]), day(8))).toBe(true);
  });
});
