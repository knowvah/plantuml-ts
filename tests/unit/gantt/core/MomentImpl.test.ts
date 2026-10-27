import { describe, expect, it } from 'vitest';
import { MomentImpl } from '../../../../src/diagrams/gantt/core/MomentImpl.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';

describe('MomentImpl', () => {
  const start = TimePoint.ofStartOfDay(2024, 3, 1);
  const end = TimePoint.ofStartOfDay(2024, 3, 5);

  it('returns the constructor arguments (MomentImpl.java:45-57)', () => {
    const m = new MomentImpl(start, end);
    expect(m.getStart()).toBe(start);
    expect(m.getEnd()).toBe(end);
  });

  it('inherits the Moment default (Moment.java:46-48)', () => {
    expect(new MomentImpl(start, end).getEndMinusOneDayTOBEREMOVED().toString()).toBe('2024-03-04T00:00');
  });
});
