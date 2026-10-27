import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../../../../src/core/time/LocalDate.js';
import { LocalDateTime } from '../../../../../src/core/time/LocalDateTime.js';
import { Fraction } from '../../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import { PiecewiseConstantSpecificDays } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantSpecificDays.js';
import { TimeDirection } from '../../../../../src/diagrams/gantt/ngm/math/TimeDirection.js';

const at = (day: number, hour = 0): LocalDateTime => LocalDateTime.of(2024, 1, day, hour, 0);
const day = (d: number): LocalDate => LocalDate.of(2024, 1, d);
const half = new Fraction(1, 2);

describe('PiecewiseConstantSpecificDays (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantSpecificDays.java:59)', () => {
  it('of(default) answers the default for every date (:105,92-97)', () => {
    const s = PiecewiseConstantSpecificDays.of(half).segmentAt(at(3, 5), TimeDirection.FORWARD);
    expect(s.getValue().toString()).toBe('1/2');
    expect(s.startExclusive().toString()).toBe('2024-01-03T00:00');
    expect(s.endExclusive().toString()).toBe('2024-01-04T00:00');
  });

  it('withDay maps one date and leaves the receiver unchanged (:136-141)', () => {
    const base = PiecewiseConstantSpecificDays.of(Fraction.ONE);
    const withZero = base.withDay(day(3), Fraction.ZERO);
    expect(withZero.segmentAt(at(3, 5), TimeDirection.FORWARD).getValue().toString()).toBe('0');
    expect(withZero.segmentAt(at(4, 5), TimeDirection.FORWARD).getValue().toString()).toBe('1');
    expect(base.segmentAt(at(3, 5), TimeDirection.FORWARD).getValue().toString()).toBe('1');
  });

  it('withDay on an already mapped date overwrites it (:136-141, HashMap.put)', () => {
    const p = PiecewiseConstantSpecificDays.of(Fraction.ONE).withDay(day(3), Fraction.ZERO).withDay(day(3), half);
    expect(p.segmentAt(at(3), TimeDirection.FORWARD).getValue().toString()).toBe('1/2');
  });

  it('of(default, map) keys by date value and copies the map (:123-125)', () => {
    const source = new Map<LocalDate, Fraction>([[day(3), Fraction.ZERO]]);
    const p = PiecewiseConstantSpecificDays.of(Fraction.ONE, source);
    source.set(day(4), Fraction.ZERO);
    expect(p.segmentAt(at(3, 8), TimeDirection.FORWARD).getValue().toString()).toBe('0');
    expect(p.segmentAt(at(4, 8), TimeDirection.FORWARD).getValue().toString()).toBe('1');
  });

  it('BACKWARD at a non-midnight instant uses that date (:150-157)', () => {
    const p = PiecewiseConstantSpecificDays.of(Fraction.ONE).withDay(day(3), Fraction.ZERO);
    const s = p.segmentAt(at(3, 8), TimeDirection.BACKWARD);
    expect(s.startExclusive().toString()).toBe('2024-01-04T00:00');
    expect(s.endExclusive().toString()).toBe('2024-01-03T00:00');
    expect(s.getValue().toString()).toBe('0');
  });

  it('BACKWARD at midnight uses the previous date (:150-153)', () => {
    const p = PiecewiseConstantSpecificDays.of(Fraction.ONE).withDay(day(2), half);
    const s = p.segmentAt(at(3), TimeDirection.BACKWARD);
    expect(s.startExclusive().toString()).toBe('2024-01-03T00:00');
    expect(s.endExclusive().toString()).toBe('2024-01-02T00:00');
    expect(s.getValue().toString()).toBe('1/2');
  });
});
