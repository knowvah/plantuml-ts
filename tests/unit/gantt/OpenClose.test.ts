import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../src/core/time/LocalDate.js';
import { LocalDateTime } from '../../../src/core/time/LocalDateTime.js';
import { TimeRange } from '../../../src/diagrams/gantt/core/TimeRange.js';
import { PiecewiseConstantUtils } from '../../../src/diagrams/gantt/ngm/math/PiecewiseConstantUtils.js';
import { TimeDirection } from '../../../src/diagrams/gantt/ngm/math/TimeDirection.js';
import { LoadIntegrator } from '../../../src/diagrams/gantt/ngm/math/LoadIntegrator.js';
import { Load } from '../../../src/diagrams/gantt/ngm/Load.js';
import { Duration } from '../../../src/core/time/Duration.js';
import { OpenClose } from '../../../src/diagrams/gantt/OpenClose.js';

// 2024-01-01 is a Monday; 6/13 are Saturdays, 7/14 Sundays.
const date = (d: number): LocalDate => LocalDate.of(2024, 1, d);
const at = (day: number, hour = 0): LocalDateTime => LocalDateTime.of(2024, 1, day, hour, 0);
const valueAt = (c: OpenClose, t: LocalDateTime): string =>
  c.asPiecewiseConstant().segmentAt(t, TimeDirection.FORWARD).getValue().toString();

/** Weekends closed plus one open Saturday (2024-01-13). */
const weekendsWithOpenSaturday = (): OpenClose => {
  const c = new OpenClose();
  c.close(DayOfWeek.SATURDAY);
  c.close(DayOfWeek.SUNDAY);
  c.open(date(13));
  return c;
};

describe('OpenClose (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:56)', () => {
  it('isClosed is false everywhere on an empty calendar (:90-96)', () => {
    expect(new OpenClose().isClosed(date(6))).toBe(false);
  });

  it('weekends closed + one open Saturday: isClosed per day (:90-114)', () => {
    const c = weekendsWithOpenSaturday();
    const closed = [1, 2, 3, 4, 5, 6, 7, 8, 12, 13, 14].map((d) => c.isClosed(date(d)));
    expect(closed).toEqual([false, false, false, false, false, true, true, false, false, false, true]);
  });

  it('the date status wins over the weekday status, in both directions (:106-113)', () => {
    const c = new OpenClose();
    c.close(date(3));
    c.open(DayOfWeek.WEDNESDAY);
    expect(c.isClosed(date(3))).toBe(true);
    expect(c.isClosed(date(10))).toBe(false);
  });

  it('the piecewise form agrees with isClosed on every day of two weeks (:161-216)', () => {
    const c = weekendsWithOpenSaturday();
    for (let d = 1; d <= 14; d++)
      expect(PiecewiseConstantUtils.isZeroOnDay(c.asPiecewiseConstant(), date(d))).toBe(c.isClosed(date(d)));
    expect(valueAt(c, at(13, 9))).toBe('1');
    expect(valueAt(c, at(6, 9))).toBe('0');
    expect(valueAt(c, at(8, 9))).toBe('1');
  });

  it('10 working days integrate over a weekday-only calendar (acceptance, :165-169)', () => {
    const c = new OpenClose();
    c.close(DayOfWeek.SATURDAY);
    c.close(DayOfWeek.SUNDAY);
    const end = new LoadIntegrator(c.asPiecewiseConstant(), Load.of(Duration.ofDays(10))).computeEnd(at(1));
    expect(end.toString()).toBe('2024-01-13T00:00');
  });

  it('daysInWeek counts the closed weekdays out of 7 (:82-88)', () => {
    const c = new OpenClose();
    expect(c.daysInWeek()).toBe(7);
    c.close(DayOfWeek.SATURDAY);
    c.close(DayOfWeek.SUNDAY);
    c.open(DayOfWeek.MONDAY);
    expect(c.daysInWeek()).toBe(5);
  });

  it('getLoadAtDUMMY is 100 when open, 0 when closed (:136-155)', () => {
    const c = weekendsWithOpenSaturday();
    expect(c.getLoadAtDUMMY(date(8))).toBe(100);
    expect(c.getLoadAtDUMMY(date(6))).toBe(0);
  });

  it('offBefore / offAfter close the days outside [offBefore, offAfter] (:98-103)', () => {
    const c = new OpenClose();
    c.setOffBeforeDate(date(3));
    c.setOffAfterDate(date(5));
    expect([2, 3, 4, 5, 6].map((d) => c.isClosed(date(d)))).toEqual([true, false, false, false, true]);
    expect(c.getLastDayIfAny()?.toString()).toBe('2024-01-05');
    c.setOffAfterDate(undefined);
    expect(c.getLastDayIfAny()).toBeUndefined();
  });

  it('asPiecewiseConstant is cached until a mutator runs (:161-163, :116-148)', () => {
    const c = new OpenClose();
    const first = c.asPiecewiseConstant();
    expect(c.asPiecewiseConstant()).toBe(first);
    c.close(DayOfWeek.SATURDAY);
    const second = c.asPiecewiseConstant();
    expect(second).not.toBe(first);
    c.open(date(13));
    expect(c.asPiecewiseConstant()).not.toBe(second);
    const third = c.asPiecewiseConstant();
    c.close(date(14));
    expect(c.asPiecewiseConstant()).not.toBe(third);
    const fourth = c.asPiecewiseConstant();
    c.open(DayOfWeek.SATURDAY);
    expect(c.asPiecewiseConstant()).not.toBe(fourth);
    const fifth = c.asPiecewiseConstant();
    c.setOffBeforeDate(date(1));
    expect(c.asPiecewiseConstant()).not.toBe(fifth);
    const sixth = c.asPiecewiseConstant();
    c.setOffAfterDate(date(9));
    expect(c.asPiecewiseConstant()).not.toBe(sixth);
  });

  it('working time ranges multiply the day pattern by the intra-day profile (:194-195,219)', () => {
    const c = new OpenClose();
    c.close(DayOfWeek.SATURDAY);
    c.addWorkingTimeRange(new TimeRange('08:00', '12:00'));
    const s = c.asPiecewiseConstant().segmentAt(at(1, 10), TimeDirection.FORWARD);
    expect([s.startExclusive().toString(), s.endExclusive().toString(), s.getValue().toString()]).toEqual([
      '2024-01-01T08:00',
      '2024-01-01T12:00',
      '1',
    ]);
    expect(valueAt(c, at(1, 14))).toBe('0');
    expect(valueAt(c, at(6, 10))).toBe('0');
  });

  it('offBefore only: zero before it, one-day segments after (:208-211)', () => {
    const c = new OpenClose();
    c.setOffBeforeDate(date(3));
    expect(valueAt(c, at(1, 9))).toBe('0');
    expect(valueAt(c, at(3, 9))).toBe('1');
    const s = c.asPiecewiseConstant().segmentAt(at(1, 10), TimeDirection.FORWARD);
    expect(s.startExclusive().toString()).toBe('2024-01-01T10:00');
    expect(s.endExclusive().toString()).toBe('2024-01-02T00:00');
  });

  it('offAfter only: zero from the day after it (:202-205)', () => {
    const c = new OpenClose();
    c.setOffAfterDate(date(5));
    expect(valueAt(c, at(5, 9))).toBe('1');
    expect(valueAt(c, at(6, 9))).toBe('0');
    expect(valueAt(c, at(1, 9))).toBe('1');
  });

  it('offBefore and offAfter together (:214-216)', () => {
    const c = new OpenClose();
    c.setOffBeforeDate(date(3));
    c.setOffAfterDate(date(5));
    expect([2, 3, 5, 6].map((d) => valueAt(c, at(d, 9)))).toEqual(['0', '1', '1', '0']);
  });

  it('date statuses compose with weekdays: an open day beats a closed weekday, a closed day an open one (:173-191)', () => {
    const c = new OpenClose();
    c.close(DayOfWeek.MONDAY);
    c.open(date(1));
    c.close(date(2));
    expect([1, 2, 3, 8].map((d) => valueAt(c, at(d, 9)))).toEqual(['1', '0', '1', '0']);
  });

  it('mutateMe copies the calendar; except overrides weekday and date statuses (:67-80)', () => {
    const base = new OpenClose();
    base.close(DayOfWeek.SATURDAY);
    base.close(date(3));
    base.setOffBeforeDate(date(1));
    base.setOffAfterDate(date(20));
    base.addWorkingTimeRange(new TimeRange('08:00', '12:00'));
    const except = new OpenClose();
    except.open(DayOfWeek.SATURDAY);
    except.open(date(3));
    except.close(date(4));

    const plain = base.mutateMe(undefined);
    expect([plain.isClosed(date(6)), plain.isClosed(date(3)), plain.isClosed(date(4))]).toEqual([true, true, false]);
    expect(plain.getLastDayIfAny()?.toString()).toBe('2024-01-20');
    expect(valueAt(plain, at(1, 10))).toBe('1');
    expect(valueAt(plain, at(1, 14))).toBe('0');

    const mutated = base.mutateMe(except);
    expect([mutated.isClosed(date(6)), mutated.isClosed(date(3)), mutated.isClosed(date(4))]).toEqual([
      false,
      false,
      true,
    ]);
    // the receiver and the argument are untouched
    expect(base.isClosed(date(6))).toBe(true);
    expect(except.isClosed(date(6))).toBe(false);
  });
});
