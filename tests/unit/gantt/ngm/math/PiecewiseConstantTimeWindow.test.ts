import { describe, expect, it } from 'vitest';
import { LocalDateTime } from '../../../../../src/core/time/LocalDateTime.js';
import { PiecewiseConstantTimeWindow } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantTimeWindow.js';
import { TimeDirection } from '../../../../../src/diagrams/gantt/ngm/math/TimeDirection.js';

const at = (day: number, hour = 0): LocalDateTime => LocalDateTime.of(2024, 1, day, hour, 0);
// Window [Jan 2 00:00, Jan 5 00:00)
const window = (): PiecewiseConstantTimeWindow => new PiecewiseConstantTimeWindow(at(2), at(5));
const fwd = (t: LocalDateTime): string[] => {
  const s = window().segmentAt(t, TimeDirection.FORWARD);
  return [s.startExclusive().toString(), s.endExclusive().toString(), s.getValue().toString()];
};
const bwd = (t: LocalDateTime): string[] => {
  const s = window().segmentAt(t, TimeDirection.BACKWARD);
  return [s.startExclusive().toString(), s.endExclusive().toString(), s.getValue().toString()];
};

describe('PiecewiseConstantTimeWindow (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantTimeWindow.java:60)', () => {
  it('rejects offAfter <= offBefore (:82-88)', () => {
    expect(() => new PiecewiseConstantTimeWindow(at(5), at(2))).toThrow('offAfter must be after offBefore');
    expect(() => new PiecewiseConstantTimeWindow(at(2), at(2))).toThrow('offAfter must be after offBefore');
  });

  it('FORWARD before the window: instant to offBefore, value 0 (:119-120)', () => {
    expect(fwd(at(1, 10))).toEqual(['2024-01-01T10:00', '2024-01-02T00:00', '0']);
  });

  it('FORWARD within the window: instant to offAfter, value 1 (:123-124, :131)', () => {
    expect(fwd(at(3, 6))).toEqual(['2024-01-03T06:00', '2024-01-05T00:00', '1']);
    expect(fwd(at(2))).toEqual(['2024-01-02T00:00', '2024-01-05T00:00', '1']);
  });

  it('FORWARD at or after offAfter: unbounded to LocalDateTime.MAX, value 0 (:126-127)', () => {
    expect(fwd(at(5))).toEqual(['2024-01-05T00:00', LocalDateTime.MAX.toString(), '0']);
    expect(fwd(at(9))).toEqual(['2024-01-09T00:00', LocalDateTime.MAX.toString(), '0']);
  });

  it('BACKWARD after the window: instant back to offAfter, value 0 (:141-142)', () => {
    expect(bwd(at(7))).toEqual(['2024-01-07T00:00', '2024-01-05T00:00', '0']);
  });

  it('BACKWARD within the window (offAfter included): back to offBefore, value 1 (:148-150)', () => {
    expect(bwd(at(4))).toEqual(['2024-01-04T00:00', '2024-01-02T00:00', '1']);
    expect(bwd(at(5))).toEqual(['2024-01-05T00:00', '2024-01-02T00:00', '1']);
  });

  it('BACKWARD at or before offBefore: unbounded to LocalDateTime.MIN, value 0 (:148-149)', () => {
    expect(bwd(at(2))).toEqual(['2024-01-02T00:00', LocalDateTime.MIN.toString(), '0']);
    expect(bwd(at(1))).toEqual(['2024-01-01T00:00', LocalDateTime.MIN.toString(), '0']);
  });
});
