import { describe, expect, it } from 'vitest';
import type { Clock } from '../../../../src/core/clock.js';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import { Month } from '../../../../src/core/time/Month.js';
import { newLocale } from '../../../../src/core/utils/I18nTimeData.js';
import { PrintScale } from '../../../../src/diagrams/gantt/core/PrintScale.js';
import { MILLISECONDS_PER_DAY, TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { WeekNumberStrategy } from '../../../../src/diagrams/gantt/time/WeekNumberStrategy.js';

/** 2024-03-01T00:00Z (epoch seconds 1709251200). */
const MAR_1_2024_MS = 1_709_251_200_000;
const DAY = 86_400_000;

const mar1 = (): TimePoint => TimePoint.ofStartOfDay(2024, 3, 1);

describe('TimePoint', () => {
  it('MILLISECONDS_PER_DAY = 1000 * 3600 * 24 (TimePoint.java:53)', () => {
    expect(MILLISECONDS_PER_DAY).toBe(DAY);
    expect(TimePoint.MILLISECONDS_PER_DAY).toBe(DAY);
  });

  it('epoch() is 1970-01-01 (TimePoint.java:57-59)', () => {
    expect(TimePoint.epoch().toString()).toBe('1970-01-01');
  });

  describe('factories', () => {
    it('ofStartOfDay(int, int, int) (TimePoint.java:73-75)', () => {
      expect(mar1().toString()).toBe('2024-03-01T00:00');
      expect(mar1().getMillis()).toBe(MAR_1_2024_MS);
    });

    it('ofStartOfDay(int, String, int) goes through MonthUtils (TimePoint.java:61-63)', () => {
      expect(TimePoint.ofStartOfDay(2024, 'march', 1).toString()).toBe('2024-03-01T00:00');
      expect(TimePoint.ofStartOfDay(2024, 'Feb', 29).toString()).toBe('2024-02-29T00:00');
    });

    it('ofStartOfDay(LocalDate) (TimePoint.java:69-71)', () => {
      expect(TimePoint.ofStartOfDay(LocalDate.of(2024, 3, 1)).equals(mar1())).toBe(true);
    });

    it('of(LocalDateTime) keeps the time of day and toLocalDateTime returns it (:65-67, :102-104)', () => {
      const t = TimePoint.of(LocalDateTime.of(2024, 2, 29, 13, 5));
      expect(t.toString()).toBe('2024-02-29T13:05');
      expect(t.toLocalDateTime().getHour()).toBe(13);
    });

    it('ofEndOfDayMinusOneSecond (TimePoint.java:77-79)', () => {
      expect(TimePoint.ofEndOfDayMinusOneSecond(LocalDate.of(2024, 2, 29)).toString()).toBe('2024-02-29T23:59:59');
    });

    it('create(ms) is UTC (TimePoint.java:85-87)', () => {
      expect(TimePoint.create(MAR_1_2024_MS + 1500).toString()).toBe('2024-03-01T00:00:01.500');
      expect(TimePoint.create(-1).toString()).toBe('1969-12-31T23:59:59.999');
    });
  });

  describe('clock seam (D3a; upstream TimePoint.java:89-91, 93-95)', () => {
    // 2020-10-10T03:30:00Z = 2020-10-09T22:30 in Chicago (CDT, -5h).
    const instant = 1_602_300_600_000;
    const chicago: Clock = { nowMillis: () => instant, zone: 'America/Chicago' };
    const utc: Clock = { nowMillis: () => instant, zone: 'UTC' };

    it('todayAtMidnight uses the clock zone local date (LocalDate.now() semantics)', () => {
      expect(TimePoint.todayAtMidnight(chicago).toString()).toBe('2020-10-09T00:00');
      expect(TimePoint.todayAtMidnight(utc).toString()).toBe('2020-10-10T00:00');
    });

    it('todayAtMidnight defaults to DEFAULT_CLOCK (instant 0, UTC)', () => {
      expect(TimePoint.todayAtMidnight().toString()).toBe('1970-01-01T00:00');
    });

    it('nowUtc1 is the clock instant in UTC regardless of zone', () => {
      expect(TimePoint.nowUtc1(chicago).toString()).toBe('2020-10-10T03:30');
      expect(TimePoint.nowUtc1().toString()).toBe('1970-01-01T00:00');
    });
  });

  describe('week of year (TimePoint.java:110-113, weekOfYear, 0 before week 1)', () => {
    it.each([
      ['ISO', DayOfWeek.MONDAY, 4, [53, 0, 0, 1]],
      ['Sun,1', DayOfWeek.SUNDAY, 1, [53, 1, 2, 2]],
    ] as const)('%s across 2020/2021', (_l, first, min, expected) => {
      const s = new WeekNumberStrategy(first, min);
      const days = [
        TimePoint.ofStartOfDay(2020, 12, 31),
        TimePoint.ofStartOfDay(2021, 1, 1),
        TimePoint.ofStartOfDay(2021, 1, 3),
        TimePoint.ofStartOfDay(2021, 1, 4),
      ];
      expect(days.map((d) => d.getWeekOfYear(s))).toEqual(expected);
    });
  });

  describe('arithmetic', () => {
    it('increment/decrement/addDays (:115-125)', () => {
      expect(mar1().increment().toString()).toBe('2024-03-02T00:00');
      expect(mar1().decrement().toString()).toBe('2024-02-29T00:00');
      expect(mar1().addDays(31).toString()).toBe('2024-04-01T00:00');
    });

    it('increment(PrintScale): WEEKLY adds 7 days, others 1 (:197-201)', () => {
      expect(mar1().increment(PrintScale.WEEKLY).toString()).toBe('2024-03-08T00:00');
      expect(mar1().increment(PrintScale.DAILY).toString()).toBe('2024-03-02T00:00');
      expect(mar1().increment(PrintScale.MONTHLY).toString()).toBe('2024-03-02T00:00');
    });

    it('getAbsoluteDayNum is floorDiv of ms (:127-129)', () => {
      expect(mar1().getAbsoluteDayNum()).toBe(19_783);
      expect(TimePoint.create(-1).getAbsoluteDayNum()).toBe(-1);
      expect(TimePoint.create(MAR_1_2024_MS + DAY - 1).getAbsoluteDayNum()).toBe(19_783);
    });

    it('minusOneSecond/plusOneSecond/floorToDay (:217-227)', () => {
      expect(mar1().minusOneSecond().toString()).toBe('2024-02-29T23:59:59');
      expect(mar1().plusOneSecond().toString()).toBe('2024-03-01T00:00:01');
      const noon = TimePoint.of(LocalDateTime.of(2024, 3, 1, 12, 30));
      expect(noon.floorToDay().equals(mar1())).toBe(true);
    });

    it('roundDayDown/roundDayUp (:203-215)', () => {
      const noon = TimePoint.of(LocalDateTime.of(2024, 3, 1, 12, 30));
      expect(noon.roundDayDown().toString()).toBe('2024-03-01T00:00');
      expect(noon.roundDayUp().toString()).toBe('2024-03-02T00:00');
      expect(mar1().roundDayUp().toString()).toBe('2024-03-01T00:00');
      const before = TimePoint.create(-1);
      expect(before.roundDayDown().toString()).toBe('1969-12-31T00:00');
      expect(before.roundDayUp().toString()).toBe('1970-01-01T00:00');
    });
  });

  describe('accessors', () => {
    it('year/month/monthYear/day/dayOfWeek/toDay (:135-137, :169-187)', () => {
      const t = mar1();
      expect(t.year()).toBe(2024);
      expect(t.month()).toBe(Month.MARCH);
      expect(t.monthYear().getYear()).toBe(2024);
      expect(t.getDayOfMonth()).toBe(1);
      expect(t.toDayOfWeek()).toBe(DayOfWeek.FRIDAY);
      expect(t.toDay().toString()).toBe('2024-03-01');
    });

    it.each([
      [1, 'Q1'],
      [3, 'Q1'],
      [4, 'Q2'],
      [6, 'Q2'],
      [7, 'Q3'],
      [9, 'Q3'],
      [10, 'Q4'],
      [12, 'Q4'],
    ])('quarter of month %i is %s ((ordinal + 3) / 3, :139-141)', (month, expected) => {
      expect(TimePoint.ofStartOfDay(2024, month, 1).quarter()).toBe(expected);
    });

    it('toStringShort is MONTH_AND_DAY (:106-108)', () => {
      expect(TimePoint.ofStartOfDay(2024, 6, 17).toStringShort(newLocale('de'))).toBe('17. Jun');
      expect(TimePoint.ofStartOfDay(2024, 6, 17).toStringShort(newLocale('en'))).toBe('Jun 17');
    });
  });

  describe('comparison', () => {
    it('compareTo/min/max (:164-167, :189-195)', () => {
      const a = mar1();
      const b = a.addDays(1);
      expect(a.compareTo(b)).toBeLessThan(0);
      expect(b.compareTo(a)).toBeGreaterThan(0);
      expect(a.compareTo(mar1())).toBe(0);
      expect(TimePoint.min(a, b)).toBe(a);
      expect(TimePoint.max(a, b)).toBe(b);
      expect(TimePoint.min(a, mar1())).toBe(a);
      expect(TimePoint.max(a, mar1())).toBe(a);
    });

    it('equals: same value, identity, other type (:153-162)', () => {
      const a = mar1();
      expect(a.equals(a)).toBe(true);
      expect(a.equals(mar1())).toBe(true);
      expect(a.equals(a.addDays(1))).toBe(false);
      expect(a.equals(undefined)).toBe(false);
      expect(a.equals('2024-03-01T00:00')).toBe(false);
    });

    it('hashCode equals LocalDateTime.hashCode (:148-151; JDK value from the T1a test)', () => {
      const t = TimePoint.of(LocalDateTime.of(2024, 2, 29, 13, 5));
      expect(t.hashCode()).toBe(1_392_226_891);
      expect(t.hashCode()).toBe(LocalDateTime.of(2024, 2, 29, 13, 5).hashCode());
    });
  });
});
