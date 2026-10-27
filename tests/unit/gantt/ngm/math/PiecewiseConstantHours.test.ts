import { describe, expect, it } from 'vitest';
import { LocalDateTime } from '../../../../../src/core/time/LocalDateTime.js';
import { TimeRange } from '../../../../../src/diagrams/gantt/core/TimeRange.js';
import { Fraction } from '../../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import { PiecewiseConstantHours } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantHours.js';
import { TimeDirection } from '../../../../../src/diagrams/gantt/ngm/math/TimeDirection.js';

const at = (day: number, hour = 0): LocalDateTime => LocalDateTime.of(2024, 1, day, hour, 0);
const MORNING = new TimeRange('08:00', '12:00');
const AFTERNOON = new TimeRange('13:00', '18:00');
const shifts = (): PiecewiseConstantHours => PiecewiseConstantHours.fromWorkingHours([MORNING, AFTERNOON]);

const seg = (p: PiecewiseConstantHours, t: LocalDateTime, d: TimeDirection): string[] => {
  const s = p.segmentAt(t, d);
  return [s.startExclusive().toString(), s.endExclusive().toString(), s.getValue().toString()];
};

describe('PiecewiseConstantHours (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantHours.java:48)', () => {
  it('of(default) with no boundary is one whole-day segment of the default (:92-106)', () => {
    expect(seg(PiecewiseConstantHours.of(Fraction.ONE), at(1, 10), TimeDirection.FORWARD)).toEqual([
      '2024-01-01T00:00',
      '2024-01-02T00:00',
      '1',
    ]);
  });

  it('fromWorkingHours(null) and [] are closed all day (:76-80)', () => {
    for (const p of [PiecewiseConstantHours.fromWorkingHours(null), PiecewiseConstantHours.fromWorkingHours([])])
      expect(seg(p, at(1, 10), TimeDirection.FORWARD)).toEqual(['2024-01-01T00:00', '2024-01-02T00:00', '0']);
  });

  it('FORWARD inside a range: floor boundary to next boundary (:93-105)', () => {
    expect(seg(shifts(), at(1, 10), TimeDirection.FORWARD)).toEqual(['2024-01-01T08:00', '2024-01-01T12:00', '1']);
  });

  it('FORWARD before the first boundary starts at midnight with the default (:96-99)', () => {
    expect(seg(shifts(), at(1, 7), TimeDirection.FORWARD)).toEqual(['2024-01-01T00:00', '2024-01-01T08:00', '0']);
  });

  it('FORWARD in the gap between ranges takes the closing boundary default (:96-105)', () => {
    expect(seg(shifts(), at(1, 12), TimeDirection.FORWARD)).toEqual(['2024-01-01T12:00', '2024-01-01T13:00', '0']);
  });

  it('FORWARD after the last boundary runs to the next midnight (:102-103)', () => {
    expect(seg(shifts(), at(1, 19), TimeDirection.FORWARD)).toEqual(['2024-01-01T18:00', '2024-01-02T00:00', '0']);
  });

  it('BACKWARD inside a range uses lowerEntry (strictly below) (:121-134)', () => {
    expect(seg(shifts(), at(1, 10), TimeDirection.BACKWARD)).toEqual(['2024-01-01T12:00', '2024-01-01T08:00', '1']);
    // exactly on a boundary the lower entry is the previous one
    expect(seg(shifts(), at(1, 12), TimeDirection.BACKWARD)).toEqual(['2024-01-01T12:00', '2024-01-01T08:00', '1']);
  });

  it('BACKWARD before the first boundary uses midnight and the default (:123-125)', () => {
    expect(seg(shifts(), at(1, 7), TimeDirection.BACKWARD)).toEqual(['2024-01-01T08:00', '2024-01-01T00:00', '0']);
  });

  it('BACKWARD after the last boundary starts at the next midnight (:128)', () => {
    expect(seg(shifts(), at(1, 20), TimeDirection.BACKWARD)).toEqual(['2024-01-02T00:00', '2024-01-01T18:00', '0']);
  });

  it('BACKWARD at midnight is the last segment of the previous day (:111-120)', () => {
    expect(seg(shifts(), at(2), TimeDirection.BACKWARD)).toEqual(['2024-01-02T00:00', '2024-01-01T18:00', '0']);
  });

  it('BACKWARD at midnight with no boundary spans the previous whole day (:113-119)', () => {
    expect(seg(PiecewiseConstantHours.of(Fraction.ONE), at(2), TimeDirection.BACKWARD)).toEqual([
      '2024-01-02T00:00',
      '2024-01-01T00:00',
      '1',
    ]);
  });

  it('a range ending at 00:00 only stores its start (:143-148)', () => {
    const p = PiecewiseConstantHours.of(Fraction.ZERO).with(new TimeRange('20:00', '00:00'), Fraction.ONE);
    expect(seg(p, at(1, 21), TimeDirection.FORWARD)).toEqual(['2024-01-01T20:00', '2024-01-02T00:00', '1']);
  });

  it('a boundary at midnight is read back through get(startKey) (:97-98)', () => {
    const p = PiecewiseConstantHours.of(Fraction.ZERO).with(new TimeRange('00:00', '06:00'), Fraction.ONE);
    expect(seg(p, at(1, 3), TimeDirection.FORWARD)).toEqual(['2024-01-01T00:00', '2024-01-01T06:00', '1']);
  });

  it('with() is persistent; a repeated start replaces the earlier value (:138-149)', () => {
    const base = PiecewiseConstantHours.of(Fraction.ZERO);
    const one = base.with(MORNING, Fraction.ONE);
    const replaced = one.with(new TimeRange('08:00', '10:00'), new Fraction(1, 2));
    expect(seg(base, at(1, 9), TimeDirection.FORWARD)[2]).toBe('0');
    expect(seg(one, at(1, 9), TimeDirection.FORWARD)).toEqual(['2024-01-01T08:00', '2024-01-01T12:00', '1']);
    expect(seg(replaced, at(1, 9), TimeDirection.FORWARD)).toEqual(['2024-01-01T08:00', '2024-01-01T10:00', '1/2']);
  });

  it('with() rejects start >= end unless end is 00:00 (:138-143)', () => {
    const base = PiecewiseConstantHours.of(Fraction.ZERO);
    expect(() => base.with(new TimeRange('12:00', '08:00'), Fraction.ONE)).toThrow('start must be strictly before end');
    expect(() => base.with(new TimeRange('08:00', '08:00'), Fraction.ONE)).toThrow('start must be strictly before end');
  });

  it('with() on a TimeRange with an unparsable bound is a NullPointerException (:139-140)', () => {
    const base = PiecewiseConstantHours.of(Fraction.ZERO);
    expect(() => base.with(new TimeRange('xx:00', '08:00'), Fraction.ONE)).toThrow('NullPointerException');
    expect(() => base.with(new TimeRange('08:00', 'xx:00'), Fraction.ONE)).toThrow('NullPointerException');
  });
});
