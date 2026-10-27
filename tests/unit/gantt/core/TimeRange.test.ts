import { describe, expect, it } from 'vitest';
import { TimeRange } from '../../../../src/diagrams/gantt/core/TimeRange.js';
import { LocalTime } from '../../../../src/core/time/LocalTime.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRange.java:40-92
describe('TimeRange', () => {
  it('parses "H:M" strings (java:54-64)', () => {
    const r = new TimeRange('8:00', ' 12 : 30 ');
    expect(r.getStart()?.toString()).toBe('08:00');
    expect(r.getEnd()?.toString()).toBe('12:30');
    expect(r.toString()).toBe('08:00-12:30');
  });

  it('accepts LocalTime directly (java:49-52)', () => {
    const r = new TimeRange(LocalTime.of(9, 0), LocalTime.of(17, 45));
    expect(r.toString()).toBe('09:00-17:45');
  });

  it('a string without ":" is an IllegalArgumentException (java:55-56)', () => {
    expect(() => new TimeRange('0800', '12:00')).toThrow('IllegalArgumentException: Invalid time: 0800');
  });

  it.each(['ab:cd', '8:', ':30', '25:00', '8:60', '+8:+5x', '99999999999:00', '1.5:00'])(
    'unparseable or out-of-range %j becomes null (java:58-62 catch)',
    (bad) => {
      const r = new TimeRange(bad, '12:00');
      expect(r.getStart()).toBeNull();
      expect(r.toString()).toBe('null-12:00');
    },
  );

  it('accepts a leading sign like Integer.parseInt', () => {
    expect(new TimeRange('+8:00', '09:-0').getStart()?.toString()).toBe('08:00');
    expect(new TimeRange('+8:00', '09:-0').getEnd()?.toString()).toBe('09:00');
  });

  it('contains is [start, end) (java:74-78)', () => {
    const r = new TimeRange('08:00', '12:00');
    expect(r.contains(LocalTime.of(7, 59))).toBe(false);
    expect(r.contains(LocalTime.of(8, 0))).toBe(true);
    expect(r.contains(LocalTime.of(11, 59))).toBe(true);
    expect(r.contains(LocalTime.of(12, 0))).toBe(false);
    expect(r.contains(null)).toBe(false);
  });

  it('contains on a null bound is a NullPointerException', () => {
    expect(() => new TimeRange('zz:00', '12:00').contains(LocalTime.of(9, 0))).toThrow('NullPointerException');
  });

  it('getDuration is end - start (java:85-87)', () => {
    expect(new TimeRange('08:00', '12:30').getDuration().toString()).toBe('PT4H30M');
    expect(() => new TimeRange('zz:00', '12:00').getDuration()).toThrow('NullPointerException');
  });
});
