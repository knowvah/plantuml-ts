import { describe, expect, it } from 'vitest';
import { LocalDateTime } from '../../../../../src/core/time/LocalDateTime.js';
import { LocalTime } from '../../../../../src/core/time/LocalTime.js';
import { AbstractPiecewiseConstant } from '../../../../../src/diagrams/gantt/ngm/math/AbstractPiecewiseConstant.js';
import { Fraction } from '../../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import { Segment } from '../../../../../src/diagrams/gantt/ngm/math/Segment.js';
import { TimeDirection } from '../../../../../src/diagrams/gantt/ngm/math/TimeDirection.js';

/** One-hour segments, recording the instants it was asked about. */
class HourlyFunction extends AbstractPiecewiseConstant {
  public readonly asked: string[] = [];

  public segmentAt(instant: LocalDateTime, _direction: TimeDirection): Segment {
    this.asked.push(instant.toString());
    const start = LocalDateTime.of(instant.toLocalDate(), LocalTime.of(instant.getHour(), 0));
    return Segment.forward(start, start.plusSeconds(3600), Fraction.ONE);
  }
}

describe('AbstractPiecewiseConstant (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/AbstractPiecewiseConstant.java:82)', () => {
  const start = LocalDateTime.of(2024, 1, 1, 5, 0);

  it('hasNext is always true (:114)', () => {
    const it = new HourlyFunction().iterateSegmentsFrom(start, TimeDirection.FORWARD);
    for (let i = 0; i < 3; i++) {
      expect(it.hasNext()).toBe(true);
      it.next();
    }
    expect(it.hasNext()).toBe(true);
  });

  it('next() feeds each segment end into the next segmentAt call (:95-102)', () => {
    const f = new HourlyFunction();
    const it = f.iterateSegmentsFrom(start, TimeDirection.FORWARD);
    const ends = [it.next(), it.next(), it.next()].map((s) => s.endExclusive().toString());
    expect(f.asked).toEqual(['2024-01-01T05:00', '2024-01-01T06:00', '2024-01-01T07:00']);
    expect(ends).toEqual(['2024-01-01T06:00', '2024-01-01T07:00', '2024-01-01T08:00']);
  });

  it('allows 9999 next() calls and throws on the 10000th (:92,97-98)', () => {
    const it = new HourlyFunction().iterateSegmentsFrom(start, TimeDirection.FORWARD);
    for (let i = 0; i < 9999; i++) it.next();
    expect(() => it.next()).toThrow('Infinite loop detected in PiecewiseConstant iteration');
  });

  it('each iterator has its own position and counter (:90-92)', () => {
    const f = new HourlyFunction();
    const a = f.iterateSegmentsFrom(start, TimeDirection.FORWARD);
    const b = f.iterateSegmentsFrom(start, TimeDirection.FORWARD);
    a.next();
    expect(b.next().startExclusive().toString()).toBe('2024-01-01T05:00');
  });
});
