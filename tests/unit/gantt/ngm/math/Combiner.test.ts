import { describe, expect, it } from 'vitest';
import { LocalDateTime } from '../../../../../src/core/time/LocalDateTime.js';
import { TimeRange } from '../../../../../src/diagrams/gantt/core/TimeRange.js';
import { Combiner } from '../../../../../src/diagrams/gantt/ngm/math/Combiner.js';
import { Fraction } from '../../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import type { PiecewiseConstant } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstant.js';
import { PiecewiseConstantHours } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantHours.js';
import { PiecewiseConstantWeekday } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantWeekday.js';
import { TimeDirection } from '../../../../../src/diagrams/gantt/ngm/math/TimeDirection.js';

const at = (day: number, hour = 0): LocalDateTime => LocalDateTime.of(2024, 1, day, hour, 0);
const half = PiecewiseConstantWeekday.of(new Fraction(1, 2));
const third = PiecewiseConstantWeekday.of(new Fraction(1, 3));
const value = (p: PiecewiseConstant): string => p.segmentAt(at(1, 9), TimeDirection.FORWARD).getValue().toString();

describe('Combiner (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Combiner.java:56)', () => {
  it('a single element is returned as is, for all four factories (:67-69,73-75,79-81,85-87)', () => {
    expect(Combiner.sum(half)).toBe(half);
    expect(Combiner.min(half)).toBe(half);
    expect(Combiner.max(half)).toBe(half);
    expect(Combiner.product(half)).toBe(half);
  });

  it('sum = Fraction.SUM: 1/2 + 1/3 = 5/6 (:68, Fraction.java:58)', () => {
    expect(value(Combiner.sum(half, third))).toBe('5/6');
  });

  it('min = Fraction.MIN (:77, Fraction.java:59)', () => {
    expect(value(Combiner.min(half, third))).toBe('1/3');
  });

  it('max = Fraction.MAX (:83, Fraction.java:60)', () => {
    expect(value(Combiner.max(half, third))).toBe('1/2');
  });

  it('product = Fraction.PRODUCT: 1/2 * 1/3 = 1/6 (:89, Fraction.java:57)', () => {
    expect(value(Combiner.product(half, third))).toBe('1/6');
  });

  it('folds three elements left to right (:96-101, Segment.java:371)', () => {
    expect(value(Combiner.sum(half, third, half))).toBe('4/3');
  });

  it('intersects the segments: a day times a working-hours range (:96-101)', () => {
    const hours = PiecewiseConstantHours.fromWorkingHours([new TimeRange('08:00', '12:00')]);
    const s = Combiner.product(half, hours).segmentAt(at(1, 9), TimeDirection.FORWARD);
    expect(s.startExclusive().toString()).toBe('2024-01-01T08:00');
    expect(s.endExclusive().toString()).toBe('2024-01-01T12:00');
    expect(s.getValue().toString()).toBe('1/2');
  });

  it('intersects BACKWARD segments too (:98-99)', () => {
    const hours = PiecewiseConstantHours.fromWorkingHours([new TimeRange('08:00', '12:00')]);
    const s = Combiner.product(half, hours).segmentAt(at(1, 10), TimeDirection.BACKWARD);
    expect(s.startExclusive().toString()).toBe('2024-01-01T12:00');
    expect(s.endExclusive().toString()).toBe('2024-01-01T08:00');
  });

  it('fewer than two elements cannot combine (:92-94)', () => {
    expect(() => Combiner.sum().segmentAt(at(1), TimeDirection.FORWARD)).toThrow(
      'At least two functions are required for combination',
    );
  });

  it('is itself a PiecewiseConstant: iteration chains day segments (AbstractPiecewiseConstant.java:85)', () => {
    const it = Combiner.sum(half, third).iterateSegmentsFrom(at(1, 9), TimeDirection.FORWARD);
    it.next();
    expect(it.next().startExclusive().toString()).toBe('2024-01-02T00:00');
  });
});
