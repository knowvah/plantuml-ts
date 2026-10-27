import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../../src/core/time/DayOfWeek.js';
import { LocalDateTime } from '../../../../../src/core/time/LocalDateTime.js';
import { Fraction } from '../../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import { PiecewiseConstantWeekday } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantWeekday.js';
import { TimeDirection } from '../../../../../src/diagrams/gantt/ngm/math/TimeDirection.js';

// 2024-01-01 is a Monday.
const at = (day: number, hour = 0): LocalDateTime => LocalDateTime.of(2024, 1, day, hour, 0);
const half = new Fraction(1, 2);

describe('PiecewiseConstantWeekday (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantWeekday.java:63)', () => {
  it('of(x) gives every day the same workload (:86-93)', () => {
    const w = PiecewiseConstantWeekday.of(half);
    for (let day = 1; day <= 7; day++)
      expect(w.segmentAt(at(day, 3), TimeDirection.FORWARD).getValue().toString()).toBe('1/2');
  });

  it('with() replaces one day and leaves the receiver unchanged (:109-115)', () => {
    const base = PiecewiseConstantWeekday.of(Fraction.ONE);
    const saturdayOff = base.with(DayOfWeek.SATURDAY, Fraction.ZERO);
    expect(saturdayOff.segmentAt(at(6, 9), TimeDirection.FORWARD).getValue().toString()).toBe('0');
    expect(saturdayOff.segmentAt(at(5, 9), TimeDirection.FORWARD).getValue().toString()).toBe('1');
    expect(base.segmentAt(at(6, 9), TimeDirection.FORWARD).getValue().toString()).toBe('1');
  });

  it('FORWARD: the whole civil day containing the instant (:118-122)', () => {
    const s = PiecewiseConstantWeekday.of(Fraction.ONE).segmentAt(at(3, 17), TimeDirection.FORWARD);
    expect(s.getTimeDirection()).toBe(TimeDirection.FORWARD);
    expect(s.startExclusive().toString()).toBe('2024-01-03T00:00');
    expect(s.endExclusive().toString()).toBe('2024-01-04T00:00');
  });

  it('BACKWARD: the day containing a non-midnight instant (:125-133)', () => {
    const w = PiecewiseConstantWeekday.of(Fraction.ONE).with(DayOfWeek.WEDNESDAY, Fraction.ZERO);
    const s = w.segmentAt(at(3, 17), TimeDirection.BACKWARD);
    expect(s.getTimeDirection()).toBe(TimeDirection.BACKWARD);
    expect(s.startExclusive().toString()).toBe('2024-01-04T00:00');
    expect(s.endExclusive().toString()).toBe('2024-01-03T00:00');
    expect(s.getValue().toString()).toBe('0');
  });

  it('BACKWARD at midnight belongs to the previous day, with that day value (:127-130)', () => {
    const w = PiecewiseConstantWeekday.of(Fraction.ONE).with(DayOfWeek.TUESDAY, half);
    const s = w.segmentAt(at(3), TimeDirection.BACKWARD);
    expect(s.startExclusive().toString()).toBe('2024-01-03T00:00');
    expect(s.endExclusive().toString()).toBe('2024-01-02T00:00');
    expect(s.getValue().toString()).toBe('1/2');
  });
});
