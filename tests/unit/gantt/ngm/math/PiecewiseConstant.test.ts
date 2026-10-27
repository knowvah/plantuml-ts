import { describe, expect, it } from 'vitest';
import { LocalDateTime } from '../../../../../src/core/time/LocalDateTime.js';
import { Fraction } from '../../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import type { PiecewiseConstant } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstant.js';
import { PiecewiseConstantWeekday } from '../../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantWeekday.js';
import { TimeDirection } from '../../../../../src/diagrams/gantt/ngm/math/TimeDirection.js';

const at = (day: number, hour = 0): LocalDateTime => LocalDateTime.of(2024, 1, day, hour, 0);

describe('PiecewiseConstant interface (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstant.java:52)', () => {
  const pc: PiecewiseConstant = PiecewiseConstantWeekday.of(Fraction.ONE);

  it('segmentAt returns the segment containing the instant (:54)', () => {
    const s = pc.segmentAt(at(1, 10), TimeDirection.FORWARD);
    expect(s.startExclusive().toString()).toBe('2024-01-01T00:00');
    expect(s.endExclusive().toString()).toBe('2024-01-02T00:00');
  });

  it('iterateSegmentsFrom yields the containing segment first, then its successors (:82)', () => {
    const it = pc.iterateSegmentsFrom(at(1, 10), TimeDirection.FORWARD);
    expect(it.hasNext()).toBe(true);
    expect(it.next().startExclusive().toString()).toBe('2024-01-01T00:00');
    expect(it.next().startExclusive().toString()).toBe('2024-01-02T00:00');
  });
});
