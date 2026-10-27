import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { Duration } from '../../../../src/core/time/Duration.js';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import { Fraction } from '../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import { PiecewiseConstantWeekday } from '../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantWeekday.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { NGMAllocation } from '../../../../src/diagrams/gantt/ngm/NGMAllocation.js';

import type { PValue } from '../../../../src/diagrams/gantt/PValue.js';
import { TaskAttribute } from '../../../../src/diagrams/gantt/core/TaskAttribute.js';
import { Solver } from '../../../../src/diagrams/gantt/solver/Solver.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';

// 2024-01-01 is a Monday.
const tp = (day: number): TimePoint => TimePoint.of(LocalDateTime.of(2024, 1, day, 0, 0));
const days = (n: number): Load => Load.of(Duration.ofDays(n));
const weekdays = (): NGMAllocation =>
  NGMAllocation.of(
    PiecewiseConstantWeekday.of(Fraction.ONE)
      .with(DayOfWeek.SATURDAY, Fraction.ZERO)
      .with(DayOfWeek.SUNDAY, Fraction.ZERO),
  );

/** Renders the two PValue kinds the solver holds. */
const show = (v: PValue): string => (v instanceof TimePoint || v instanceof Load ? v.toString() : 'unknown');

describe('Solver (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/solver/Solver.java:53)', () => {
  it('END is derived from START + LOAD (:89-99,104-110)', () => {
    // 10 weekdays from Mon 1st -> Sat 13th 00:00 (LoadIntegrator.java:101-117).
    const solver = new Solver();
    solver.setData(TaskAttribute.START, tp(1));
    solver.setData(TaskAttribute.LOAD, days(10));
    expect(show(solver.getData(weekdays(), TaskAttribute.END))).toBe('2024-01-13T00:00');
  });

  it('START is derived from END + LOAD via setEnd (:93-95,112-120)', () => {
    const solver = new Solver();
    solver.setData(TaskAttribute.END, tp(13));
    solver.setData(TaskAttribute.LOAD, days(10));
    expect(show(solver.getData(weekdays(), TaskAttribute.START))).toBe('2024-01-01T00:00');
  });

  it('a stored attribute is returned as given (:90,98-99)', () => {
    const solver = new Solver();
    solver.setData(TaskAttribute.LOAD, days(3));
    expect(show(solver.getData(weekdays(), TaskAttribute.LOAD))).toBe(days(3).toString());
  });

  it('a missing LOAD defaults to one day (:97)', () => {
    expect(show(new Solver().getData(weekdays(), TaskAttribute.LOAD))).toBe(days(1).toString());
  });

  it('a 1/2 allocation doubles the derived span (NGM semantics)', () => {
    const half = NGMAllocation.of(PiecewiseConstantWeekday.of(new Fraction(1, 2)));
    const solver = new Solver();
    solver.setData(TaskAttribute.START, tp(1));
    solver.setData(TaskAttribute.LOAD, days(1));
    expect(show(solver.getData(half, TaskAttribute.END))).toBe('2024-01-03T00:00');
  });

  it('chain "[B] starts at [A] end": A 5 d from Mon 1st ends Sat 6th, B 5 d from there ends Sat 13th', () => {
    // A: Mon1-Fri5 -> Sat 6 00:00. B starts Sat 6: Sat/Sun rate 0 skipped (LoadIntegrator.java:101-104),
    // Mon8-Fri12 -> Sat 13 00:00.
    const a = new Solver();
    a.setData(TaskAttribute.START, tp(1));
    a.setData(TaskAttribute.LOAD, days(5));
    const aEnd = a.getData(weekdays(), TaskAttribute.END);
    expect(show(aEnd)).toBe('2024-01-06T00:00');
    const b = new Solver();
    b.setData(TaskAttribute.START, aEnd);
    b.setData(TaskAttribute.LOAD, days(5));
    expect(show(b.getData(weekdays(), TaskAttribute.END))).toBe('2024-01-13T00:00');
  });

  it('START keeps the later of the previous and the new value (:63-69)', () => {
    const solver = new Solver();
    solver.setData(TaskAttribute.START, tp(5));
    solver.setData(TaskAttribute.START, tp(3));
    expect(show(solver.getData(weekdays(), TaskAttribute.START))).toBe('2024-01-05T00:00');
    solver.setData(TaskAttribute.START, tp(8));
    expect(show(solver.getData(weekdays(), TaskAttribute.START))).toBe('2024-01-08T00:00');
  });

  it('a third attribute evicts the oldest; re-setting moves an attribute to the end (:63,72-74,83-87)', () => {
    // Order after START, LOAD, START(again): LOAD, START (remove+put, :63,72). END is third -> LOAD evicted.
    const solver = new Solver();
    solver.setData(TaskAttribute.START, tp(1));
    solver.setData(TaskAttribute.LOAD, days(10));
    solver.setData(TaskAttribute.START, tp(2));
    solver.setData(TaskAttribute.END, tp(13));
    expect(show(solver.getData(weekdays(), TaskAttribute.LOAD))).toBe(days(1).toString());
    expect(show(solver.getData(weekdays(), TaskAttribute.START))).toBe('2024-01-02T00:00');
    expect(show(solver.getData(weekdays(), TaskAttribute.END))).toBe('2024-01-13T00:00');
  });

  it('missing inputs throw NullPointerException (:105-106 casts of null)', () => {
    const solver = new Solver();
    expect(() => solver.getData(weekdays(), TaskAttribute.END)).toThrow('NullPointerException');
    expect(() => solver.getData(weekdays(), TaskAttribute.START)).toThrow('NullPointerException');
    solver.setData(TaskAttribute.START, tp(1));
    expect(() => solver.getData(weekdays(), TaskAttribute.END)).toThrow('NullPointerException');
  });

  it('a non-TimePoint START is a ClassCastException (:65 cast)', () => {
    const solver = new Solver();
    solver.setData(TaskAttribute.START, days(1));
    expect(() => solver.setData(TaskAttribute.START, tp(1))).toThrow('ClassCastException');
    const s2 = new Solver();
    s2.setData(TaskAttribute.START, tp(1));
    expect(() => s2.setData(TaskAttribute.START, days(1))).toThrow('ClassCastException');
    const s3 = new Solver();
    s3.setData(TaskAttribute.LOAD, tp(1));
    s3.setData(TaskAttribute.START, tp(1));
    expect(() => s3.getData(weekdays(), TaskAttribute.END)).toThrow('ClassCastException');
  });
});
