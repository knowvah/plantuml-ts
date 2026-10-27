import { describe, expect, it } from 'vitest';
import { LocalDateTime } from '../../../../../src/core/time/LocalDateTime.js';
import { Fraction } from '../../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import { Segment } from '../../../../../src/diagrams/gantt/ngm/math/Segment.js';
import { TimeDirection } from '../../../../../src/diagrams/gantt/ngm/math/TimeDirection.js';

const d = (day: number): LocalDateTime => LocalDateTime.of(2024, 1, day, 0, 0);
const v = (n: number, den = 1): Fraction => new Fraction(n, den);

describe('Segment factories (Segment.java:133,158)', () => {
  it('forward holds bounds, value and direction', () => {
    const s = Segment.forward(d(1), d(5), v(1, 2));
    expect(s.getTimeDirection()).toBe(TimeDirection.FORWARD);
    expect(s.startExclusive().toString()).toBe('2024-01-01T00:00');
    expect(s.endExclusive().toString()).toBe('2024-01-05T00:00');
    expect(s.getValue().toString()).toBe('1/2');
  });

  it('forward rejects end <= start (:134-135)', () => {
    expect(() => Segment.forward(d(5), d(5), v(1))).toThrow('end must be after start');
    expect(() => Segment.forward(d(5), d(1), v(1))).toThrow('end must be after start');
  });

  it('backward rejects end >= start (:159-160)', () => {
    expect(Segment.backward(d(5), d(1), v(1)).getTimeDirection()).toBe(TimeDirection.BACKWARD);
    expect(() => Segment.backward(d(1), d(5), v(1))).toThrow('end must be before start');
    expect(() => Segment.backward(d(1), d(1), v(1))).toThrow('end must be before start');
  });
});

describe('Segment includes/split (Segment.java:256,289)', () => {
  it('includes excludes both bounds, forward', () => {
    const s = Segment.forward(d(1), d(5), v(1));
    expect([d(1), d(2), d(4), d(5), d(9)].map((t) => s.includes(t))).toEqual([false, true, true, false, false]);
  });

  it('includes excludes both bounds, backward', () => {
    const s = Segment.backward(d(5), d(1), v(1));
    expect([d(1), d(2), d(4), d(5), d(9)].map((t) => s.includes(t))).toEqual([false, true, true, false, false]);
  });

  it('split forward gives two contiguous same-valued segments', () => {
    const [a, b] = Segment.forward(d(1), d(5), v(3)).split(d(3));
    expect(a.toString()).toBe('FORWARD ]2024-01-01T00:00, 2024-01-03T00:00[ value=3');
    expect(b.toString()).toBe('FORWARD ]2024-01-03T00:00, 2024-01-05T00:00[ value=3');
  });

  it('split backward keeps the direction', () => {
    const [a, b] = Segment.backward(d(5), d(1), v(1, 2)).split(d(3));
    expect(a.toString()).toBe('BACKWARD ]2024-01-05T00:00, 2024-01-03T00:00[ value=1/2');
    expect(b.toString()).toBe('BACKWARD ]2024-01-03T00:00, 2024-01-01T00:00[ value=1/2');
  });

  it('split at a bound or outside throws (:258-259)', () => {
    const s = Segment.forward(d(1), d(5), v(1));
    expect(() => s.split(d(1))).toThrow('time must be within the segment bounds');
    expect(() => s.split(d(9))).toThrow('time must be within the segment bounds');
  });
});

describe('Segment.intersection (Segment.java:336,371)', () => {
  it('multiplies values by default (Fraction.PRODUCT)', () => {
    const r = Segment.intersection([Segment.forward(d(1), d(8), v(1, 2)), Segment.forward(d(3), d(10), v(2, 3))]);
    expect(r.toString()).toBe('FORWARD ]2024-01-03T00:00, 2024-01-08T00:00[ value=1/3');
  });

  it('uses the supplied value function, folding left over three segments', () => {
    const r = Segment.intersection(
      [Segment.forward(d(1), d(8), v(1)), Segment.forward(d(2), d(9), v(2)), Segment.forward(d(3), d(7), v(5))],
      Fraction.SUM,
    );
    expect(r.toString()).toBe('FORWARD ]2024-01-03T00:00, 2024-01-07T00:00[ value=8');
  });

  it('single segment is returned as-is (:376-377)', () => {
    const s = Segment.forward(d(1), d(2), v(1));
    expect(Segment.intersection([s])).toBe(s);
  });

  it('empty input throws (:373-374)', () => {
    expect(() => Segment.intersection([])).toThrow('No segments to intersect');
  });

  it('mixed directions throw (:388-389)', () => {
    expect(() => Segment.intersection([Segment.forward(d(1), d(5), v(1)), Segment.backward(d(5), d(1), v(1))])).toThrow(
      'All segments must have the same direction',
    );
  });

  it('backward intersection takes the later start and earlier end bound', () => {
    const r = Segment.intersection([Segment.backward(d(8), d(1), v(2)), Segment.backward(d(10), d(3), v(3))]);
    expect(r.toString()).toBe('BACKWARD ]2024-01-08T00:00, 2024-01-03T00:00[ value=6');
  });

  it('disjoint forward segments throw (:411-412)', () => {
    expect(() => Segment.intersection([Segment.forward(d(1), d(3), v(1)), Segment.forward(d(3), d(5), v(1))])).toThrow(
      'Segments do not overlap',
    );
  });

  it('disjoint backward segments throw (:415-416)', () => {
    expect(() =>
      Segment.intersection([Segment.backward(d(5), d(3), v(1)), Segment.backward(d(3), d(1), v(1))]),
    ).toThrow('Segments do not overlap');
  });

  it('forward: a segment that starts earlier / ends later changes neither bound', () => {
    const r = Segment.intersection([Segment.forward(d(3), d(5), v(1)), Segment.forward(d(1), d(9), v(1))]);
    expect(r.startExclusive().toString()).toBe('2024-01-03T00:00');
    expect(r.endExclusive().toString()).toBe('2024-01-05T00:00');
  });

  it('backward: a segment that starts later / ends earlier changes neither bound', () => {
    const r = Segment.intersection([Segment.backward(d(5), d(3), v(1)), Segment.backward(d(9), d(1), v(1))]);
    expect(r.startExclusive().toString()).toBe('2024-01-05T00:00');
    expect(r.endExclusive().toString()).toBe('2024-01-03T00:00');
  });
});

describe('Segment.computeClampedStart (Segment.java:418-423)', () => {
  it('forward clamps to the later of current and start', () => {
    const s = Segment.forward(d(3), d(9), v(1));
    expect(s.computeClampedStart(d(1)).toString()).toBe('2024-01-03T00:00');
    expect(s.computeClampedStart(d(5)).toString()).toBe('2024-01-05T00:00');
  });

  it('backward clamps to the earlier of current and start', () => {
    const s = Segment.backward(d(9), d(3), v(1));
    expect(s.computeClampedStart(d(12)).toString()).toBe('2024-01-09T00:00');
    expect(s.computeClampedStart(d(5)).toString()).toBe('2024-01-05T00:00');
  });
});
