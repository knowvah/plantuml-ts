import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../../src/core/time/DayOfWeek.js';
import { Duration } from '../../../../../src/core/time/Duration.js';
import { LocalDateTime } from '../../../../../src/core/time/LocalDateTime.js';
import { TimeDirection } from '../../../../../src/diagrams/gantt/ngm/math/TimeDirection.js';
import { Fraction } from '../../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import { Load } from '../../../../../src/diagrams/gantt/ngm/Load.js';
import { LoadIntegrator } from '../../../../../src/diagrams/gantt/ngm/math/LoadIntegrator.js';
import { PiecewiseConstantTimeWindow } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantTimeWindow.js';
import { PiecewiseConstantWeekday } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantWeekday.js';
import { OpenClose } from '../../../../../src/diagrams/gantt/OpenClose.js';

// 2024-01-01 is a Monday.
const at = (day: number, hour = 0): LocalDateTime => LocalDateTime.of(2024, 1, day, hour, 0);
const days = (n: number): Load => Load.of(Duration.ofDays(n));
const weekdays = (): PiecewiseConstantWeekday =>
  PiecewiseConstantWeekday.of(Fraction.ONE)
    .with(DayOfWeek.SATURDAY, Fraction.ZERO)
    .with(DayOfWeek.SUNDAY, Fraction.ZERO);

describe('LoadIntegrator (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/LoadIntegrator.java:44)', () => {
  it('10 working days from Monday span two weeks and end Saturday 00:00 of week 2 (:61,89-125)', () => {
    // Mon 1..Fri 5 = 5 days, weekend skipped (:101-104), Mon 8..Fri 12 = 5 days; Friday completes at +86400 s (:113-117).
    const end = new LoadIntegrator(weekdays(), days(10)).computeEnd(at(1));
    expect(end.toString()).toBe('2024-01-13T00:00');
  });

  it('computeStart is the backward mirror: 10 working days before Sat 13th is Mon 1st (:78)', () => {
    const start = new LoadIntegrator(weekdays(), days(10)).computeStart(at(13));
    expect(start.toString()).toBe('2024-01-01T00:00');
  });

  it('a zero load returns the start unchanged (:97-98,125)', () => {
    expect(new LoadIntegrator(weekdays(), Load.zero()).computeEnd(at(3, 7)).toString()).toBe('2024-01-03T07:00');
    expect(new LoadIntegrator(weekdays(), Load.zero()).computeStart(at(3, 7)).toString()).toBe('2024-01-03T07:00');
  });

  it('a mid-day start consumes only the rest of the first segment (:106-110)', () => {
    // Mon 12:00..24:00 = 43200 s, then 43200 s of Tuesday: Tue 12:00.
    const end = new LoadIntegrator(weekdays(), days(1)).computeEnd(at(1, 12));
    expect(end.toString()).toBe('2024-01-02T12:00');
  });

  it('a half-rate allocation doubles the elapsed time (:113-117)', () => {
    const end = new LoadIntegrator(PiecewiseConstantWeekday.of(new Fraction(1, 2)), days(1)).computeEnd(at(1));
    expect(end.toString()).toBe('2024-01-03T00:00');
  });

  it('zero-rate segments are skipped without a duration computation (:101-104)', () => {
    const saturdayStart = new LoadIntegrator(weekdays(), days(1)).computeEnd(at(6, 5));
    expect(saturdayStart.toString()).toBe('2024-01-09T00:00');
  });

  it('D5 realistic spans stay exact: 10 years of working days in seconds (:109)', () => {
    // 3650 days of load from Mon 2024-01-01 at full rate; a 10-year span is ~3.2e8 s, far below 2^53.
    const end = new LoadIntegrator(PiecewiseConstantWeekday.of(Fraction.ONE), days(3650)).computeEnd(at(1));
    expect(end.toString()).toBe('2033-12-29T00:00');
    const tenYearsSeconds = Duration.between(at(1), LocalDateTime.of(2034, 1, 1, 0, 0)).getSeconds();
    expect(tenYearsSeconds).toBe(315_619_200);
    expect(Number.isSafeInteger(tenYearsSeconds * 100)).toBe(true);
  });

  it('D5: only the LocalDateTime.MAX sentinel exceeds 2^53 seconds (:109, TimeWindow.java:127)', () => {
    const toMax = Duration.between(at(1), LocalDateTime.MAX).getSeconds();
    expect(toMax).toBeGreaterThan(Number.MAX_SAFE_INTEGER);
  });

  it('D5: a gantt calendar never hands the integrator a sentinel-length segment (OpenClose.java:209-210)', () => {
    // offBefore set, offAfter unset -> window [offBefore, MAX); the weekday product caps every segment at one day.
    const calendar = new OpenClose();
    calendar.setOffBeforeDate(at(1).toLocalDate());
    const segment = calendar.asPiecewiseConstant().iterateSegmentsFrom(at(1, 9), TimeDirection.FORWARD).next();
    expect(segment.endExclusive().toString()).toBe('2024-01-02T00:00');
    expect(new LoadIntegrator(calendar.asPiecewiseConstant(), days(2)).computeEnd(at(1)).toString()).toBe(
      '2024-01-03T00:00',
    );
  });

  it('D5: even a bare sentinel segment completes inside its first iteration (:113-117)', () => {
    const open = new PiecewiseConstantTimeWindow(at(1), LocalDateTime.MAX);
    expect(new LoadIntegrator(open, days(1)).computeEnd(at(2)).toString()).toBe('2024-01-03T00:00');
  });
});
