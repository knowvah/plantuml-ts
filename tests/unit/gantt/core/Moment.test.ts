import { describe, expect, it } from 'vitest';
import { getEndMinusOneDayTOBEREMOVED } from '../../../../src/diagrams/gantt/core/Moment.js';
import { MomentImpl } from '../../../../src/diagrams/gantt/core/MomentImpl.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';

describe('Moment', () => {
  it('getEndMinusOneDayTOBEREMOVED is getEnd().decrement() (Moment.java:46-48)', () => {
    const m = new MomentImpl(TimePoint.ofStartOfDay(2024, 3, 1), TimePoint.ofStartOfDay(2024, 3, 5));
    expect(getEndMinusOneDayTOBEREMOVED(m).toString()).toBe('2024-03-04T00:00');
  });
});
