import { describe, expect, it } from 'vitest';
import { LocalDateTime } from '../../../../../src/core/time/LocalDateTime.js';
import { adjustBySeconds, TimeDirection } from '../../../../../src/diagrams/gantt/ngm/math/TimeDirection.js';

const T = LocalDateTime.of(2024, 3, 1, 0, 0, 30);

describe('TimeDirection', () => {
  it('has FORWARD and BACKWARD (TimeDirection.java:41)', () => {
    expect(Object.values(TimeDirection)).toEqual(['FORWARD', 'BACKWARD']);
  });

  it('FORWARD adds seconds (TimeDirection.java:45-46)', () => {
    expect(adjustBySeconds(TimeDirection.FORWARD, T, 45).toString()).toBe('2024-03-01T00:01:15');
  });

  it('BACKWARD subtracts seconds across a leap day (TimeDirection.java:47-48)', () => {
    expect(adjustBySeconds(TimeDirection.BACKWARD, T, 31).toString()).toBe('2024-02-29T23:59:59');
  });

  it('an unknown direction throws (TimeDirection.java:49-50)', () => {
    expect(() => adjustBySeconds('SIDEWAYS' as TimeDirection, T, 1)).toThrow('IllegalStateException');
  });
});
