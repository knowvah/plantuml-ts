import { describe, expect, it } from 'vitest';
import { TimeRange } from '../../../../src/diagrams/gantt/core/TimeRange.js';
import { TimeRanges } from '../../../../src/diagrams/gantt/core/TimeRanges.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRanges.java:39-85
describe('TimeRanges', () => {
  const morning = new TimeRange('08:00', '12:00');
  const afternoon = new TimeRange('13:00', '17:30');

  it('empty has no working ranges and prints []', () => {
    const t = new TimeRanges();
    expect(t.hasWorkingTimeRanges()).toBe(false);
    expect(t.toString()).toBe('[]');
    expect([...t]).toEqual([]);
  });

  it('keeps insertion order from the constructor and add (java:43-54)', () => {
    const t = new TimeRanges(morning);
    t.add(afternoon);
    expect(t.hasWorkingTimeRanges()).toBe(true);
    expect([...t]).toEqual([morning, afternoon]);
    expect(t.toString()).toBe('[08:00-12:00, 13:00-17:30]');
  });

  it('iteration is over a snapshot (unmodifiable view, java:61-64)', () => {
    const t = new TimeRanges(morning);
    const seen: TimeRange[] = [];
    for (const r of t) {
      seen.push(r);
      t.add(afternoon);
    }
    expect(seen).toEqual([morning]);
  });

  it('totalWorkingDuration sums the ranges (java:66-72)', () => {
    expect(new TimeRanges(morning, afternoon).totalWorkingDuration().toString()).toBe('PT8H30M');
    expect(new TimeRanges().totalWorkingDuration().toString()).toBe('PT0S');
  });

  it('durationOfDays multiplies the working time when ranges exist (java:74-80)', () => {
    expect(new TimeRanges(morning, afternoon).durationOfDays(3).toString()).toBe('PT25H30M');
  });

  it('durationOfDays is whole days when there are no ranges', () => {
    expect(new TimeRanges().durationOfDays(3).toString()).toBe('PT72H');
  });

  it('a range with a null bound is a NullPointerException in totalWorkingDuration', () => {
    expect(() => new TimeRanges(new TimeRange('zz:00', '12:00')).totalWorkingDuration()).toThrow(
      'NullPointerException',
    );
  });
});
