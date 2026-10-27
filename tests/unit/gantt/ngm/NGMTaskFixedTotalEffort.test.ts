import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { Duration } from '../../../../src/core/time/Duration.js';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import { Fraction } from '../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import { PiecewiseConstantWeekday } from '../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantWeekday.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { NGMAllocation } from '../../../../src/diagrams/gantt/ngm/NGMAllocation.js';

import { NGMTaskFixedTotalEffort } from '../../../../src/diagrams/gantt/ngm/NGMTaskFixedTotalEffort.js';

// 2024-01-01 is a Monday.
const at = (day: number): LocalDateTime => LocalDateTime.of(2024, 1, day, 0, 0);
const days = (n: number): Load => Load.of(Duration.ofDays(n));
const weekdays = (): NGMAllocation =>
  NGMAllocation.of(
    PiecewiseConstantWeekday.of(Fraction.ONE)
      .with(DayOfWeek.SATURDAY, Fraction.ZERO)
      .with(DayOfWeek.SUNDAY, Fraction.ZERO),
  );

describe('NGMTaskFixedTotalEffort (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedTotalEffort.java:8)', () => {
  it('the constructor computes end = LoadIntegrator.computeEnd(start) (:14-19)', () => {
    // 10 weekdays from Mon 1st: Mon1-Fri5, Mon8-Fri12; Friday completes at +86400 s -> Sat 13th 00:00 (LoadIntegrator.java:101-117).
    const task = new NGMTaskFixedTotalEffort(weekdays(), at(1), days(10));
    expect(task.getStart().toString()).toBe('2024-01-01T00:00');
    expect(task.getEnd().toString()).toBe('2024-01-13T00:00');
    expect(task.getTotalEffort().toString()).toBe(days(10).toString());
  });

  it('a 1/2 allocation doubles the duration (:14-19, LoadIntegrator.java:113-117)', () => {
    const half = NGMAllocation.of(PiecewiseConstantWeekday.of(new Fraction(1, 2)));
    const task = new NGMTaskFixedTotalEffort(half, at(1), days(1));
    expect(task.getEnd().toString()).toBe('2024-01-03T00:00');
    expect(task.getDuration().getSeconds()).toBe(2 * 86400);
  });

  it('getDuration is Duration.between(start, end), weekend included (:50-52)', () => {
    expect(new NGMTaskFixedTotalEffort(weekdays(), at(1), days(10)).getDuration().getSeconds()).toBe(12 * 86400);
  });

  it('setStart re-anchors and recomputes end (:27-31)', () => {
    const task = new NGMTaskFixedTotalEffort(weekdays(), at(1), days(10));
    task.setStart(at(8)); // Mon8-Fri12 (5 d), Mon15-Fri19 (5 d) -> Sat 20th
    expect(task.getStart().toString()).toBe('2024-01-08T00:00');
    expect(task.getEnd().toString()).toBe('2024-01-20T00:00');
  });

  it('setEnd back-computes start with computeStart (:38-41)', () => {
    const task = new NGMTaskFixedTotalEffort(weekdays(), at(8), days(10));
    task.setEnd(at(13));
    expect(task.getEnd().toString()).toBe('2024-01-13T00:00');
    expect(task.getStart().toString()).toBe('2024-01-01T00:00');
  });

  it('setEffort replaces the effort and recomputes end from the kept start (:44-48)', () => {
    const task = new NGMTaskFixedTotalEffort(weekdays(), at(1), days(10));
    task.setEffort(days(5)); // Mon1-Fri5 -> Sat 6th 00:00
    expect(task.getTotalEffort().toString()).toBe(days(5).toString());
    expect(task.getStart().toString()).toBe('2024-01-01T00:00');
    expect(task.getEnd().toString()).toBe('2024-01-06T00:00');
  });

  it('getAllocation returns the constructor allocation (NGMTask.java:295)', () => {
    const allocation = weekdays();
    expect(new NGMTaskFixedTotalEffort(allocation, at(1), days(1)).getAllocation()).toBe(allocation);
  });
});
