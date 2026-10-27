import { describe, expect, it } from 'vitest';
import { HColors } from '../../../../src/core/klimt/color/HColors.js';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { Duration } from '../../../../src/core/time/Duration.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import { TimeRange } from '../../../../src/diagrams/gantt/core/TimeRange.js';
import { DayCalendarData } from '../../../../src/diagrams/gantt/data/DayCalendarData.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';

// Expected values: DayCalendarData.java (gantt/data). HashMap iteration orders were printed by
// a JDK 21.0.1 program (scratch /private/tmp/claude-501/gep-T4c/Order.java) that does
// `Map<LocalDateTime,String> m = new HashMap<>(); m.put(k, "v")` for each key in insertion
// order and prints `m.keySet()`; TimePoint#hashCode/equals delegate to LocalDateTime
// (time/TimePoint.java:148-162), so the HashMap order of TimePoint keys is that order.
const day = (y: number, m: number, d: number): TimePoint => TimePoint.ofStartOfDay(y, m, d);
const noon = (y: number, m: number, d: number): TimePoint => TimePoint.of(LocalDateTime.of(y, m, d, 12, 0));
const iso = (points: Iterable<TimePoint>): string[] => [...points].map((p) => p.toString());

/** JDK 21 `Order.java` case A: 2024-03-01..2024-03-20 at 00:00, ascending insertion. */
const JDK_ORDER_A = Array.from({ length: 20 }, (_, i) => `2024-03-${String(20 - i).padStart(2, '0')}T00:00`);
/** JDK 21 `Order.java` case B: 11 scattered dates at 12:00 plus a repeated 2024-01-01. */
const B_INPUT: [number, number, number][] = [
  [2025, 12, 25],
  [2024, 1, 1],
  [2023, 7, 4],
  [2024, 2, 29],
  [2026, 10, 31],
  [2022, 5, 17],
  [2024, 12, 31],
  [2021, 3, 9],
  [2025, 1, 20],
  [2024, 7, 14],
  [2020, 11, 11],
];
const JDK_ORDER_B = [
  '2024-01-01T12:00',
  '2022-05-17T12:00',
  '2023-07-04T12:00',
  '2025-01-20T12:00',
  '2020-11-11T12:00',
  '2025-12-25T12:00',
  '2021-03-09T12:00',
  '2024-07-14T12:00',
  '2026-10-31T12:00',
  '2024-12-31T12:00',
  '2024-02-29T12:00',
];

describe('DayCalendarData', () => {
  it('getColorDays iterates colorDaysInternal.keySet() in HashMap order, not insertion order (:98-100)', () => {
    const data = new DayCalendarData();
    for (let d = 1; d <= 20; d++) data.putColorDay(day(2024, 3, d), HColors.BLACK);
    expect(iso(data.getColorDays())).toEqual(JDK_ORDER_A);
  });

  it('getNameDays iterates in HashMap order; a repeated put keeps its slot and updates the value (:102-104,116-118)', () => {
    const data = new DayCalendarData();
    for (const [y, m, d] of B_INPUT) data.putNameDay(noon(y, m, d), `n${y}-${m}-${d}`);
    data.putNameDay(noon(2024, 1, 1), 'renamed');
    const names = data.getNameDays();
    expect(iso(names.keys())).toEqual(JDK_ORDER_B);
    expect(names.size).toBe(11);
    expect([...names.values()][0]).toBe('renamed');
    expect(data.getDayName(noon(2024, 1, 1))).toBe('renamed');
    expect(data.getDayName(noon(2024, 1, 2))).toBeUndefined();
  });

  it('a small key set follows its bucket order too (JDK case C: 03-05, 03-01, 03-03)', () => {
    const data = new DayCalendarData();
    for (const d of [5, 1, 3]) data.putColorDay(day(2024, 3, d), HColors.WHITE);
    expect(iso(data.getColorDays())).toEqual(['2024-03-05T00:00', '2024-03-03T00:00', '2024-03-01T00:00']);
  });

  it('getDayColor prefers colorDaysToday over colorDaysInternal (:78-84)', () => {
    const data = new DayCalendarData();
    const d = day(2024, 3, 5);
    expect(data.getDayColor(d)).toBeUndefined();
    data.putColorDay(d, HColors.BLACK);
    expect(data.getDayColor(day(2024, 3, 5))).toBe(HColors.BLACK);
    data.putColorDayToday(d, HColors.WHITE);
    expect(data.getDayColor(d)).toBe(HColors.WHITE);
  });

  it('getDayOfWeekColor is a lookup on putColorDayOfWeek (:86-88,128-130)', () => {
    const data = new DayCalendarData();
    data.putColorDayOfWeek(DayOfWeek.SUNDAY, HColors.BLACK);
    expect(data.getDayOfWeekColor(DayOfWeek.SUNDAY)).toBe(HColors.BLACK);
    expect(data.getDayOfWeekColor(DayOfWeek.MONDAY)).toBeUndefined();
  });

  it('isOpen reads the OpenClose load for a LocalDate and for a TimePoint (:70-76)', () => {
    const data = new DayCalendarData();
    data.getOpenClose().close(DayOfWeek.SUNDAY);
    expect(data.isOpen(LocalDate.of(2024, 3, 3))).toBe(false);
    expect(data.isOpen(LocalDate.of(2024, 3, 4))).toBe(true);
    expect(data.isOpen(day(2024, 3, 3))).toBe(false);
    expect(data.isOpen(day(2024, 3, 4))).toBe(true);
  });

  it('separators are a lookup by LocalDate value (:106-114)', () => {
    const data = new DayCalendarData();
    data.addSeparatorBefore(LocalDate.of(2024, 3, 4));
    expect(data.hasSeparatorBefore(LocalDate.of(2024, 3, 4))).toBe(true);
    expect(data.hasSeparatorBefore(LocalDate.of(2024, 3, 5))).toBe(false);
  });

  it('getOpenCloseForTask is computeIfAbsent: one OpenClose per task (:132-134)', () => {
    const data = new DayCalendarData();
    const a = data.getOpenCloseForTask('a');
    expect(data.getOpenCloseForTask('a')).toBe(a);
    expect(data.getOpenCloseForTask('b')).not.toBe(a);
    expect(a).not.toBe(data.getOpenClose());
  });

  it('getDefaultPlan is the OpenClose piecewise constant (:136-138)', () => {
    const data = new DayCalendarData();
    expect(data.getDefaultPlan()).toBe(data.getOpenClose().asPiecewiseConstant());
  });

  it('working time ranges feed hours, duration and the OpenClose (:140-155)', () => {
    const data = new DayCalendarData();
    expect(data.hasWorkingTimeRanges()).toBe(false);
    expect(data.durationOfDays(3)).toEqual(Duration.ofDays(3));
    data.addWorkingTimeRange(new TimeRange('08:00', '12:00'));
    data.addWorkingTimeRange(new TimeRange('13:00', '17:30'));
    expect(data.hasWorkingTimeRanges()).toBe(true);
    expect(data.durationOfDays(2)).toEqual(Duration.ofHours(17));
    // WorkingHours.java:64-71 with dayWidth 240, closeFactor 0.5: working 8.5h = 85, pause 15.5h * 5 = 77.5
    expect(data.buildWorkingHours(240, 0.5).getWorkingDurationForOneDay(false)).toBe(162.5);
  });
});
