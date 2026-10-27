import { describe, expect, it } from 'vitest';
import { LocalTime } from '../../../../src/core/time/LocalTime.js';

// Expected values: OpenJDK 21.0.1 scratch program (not a plantuml oracle).
describe('LocalTime', () => {
  it('formats like LocalTime#toString', () => {
    expect(LocalTime.of(9, 5).toString()).toBe('09:05');
    expect(LocalTime.of(9, 5, 7).toString()).toBe('09:05:07');
    expect(LocalTime.MAX.toString()).toBe('23:59:59.999999999');
    expect(LocalTime.of(1, 2, 3, 5_000_000).toString()).toBe('01:02:03.005');
    expect(LocalTime.of(1, 2, 3, 5_000).toString()).toBe('01:02:03.000005');
    expect(LocalTime.of(1, 2, 0, 5).toString()).toBe('01:02:00.000000005');
    expect(LocalTime.MIDNIGHT.toString()).toBe('00:00');
  });

  it('exposes fields and nano/second of day', () => {
    const t = LocalTime.of(13, 45, 59, 123);
    expect([t.getHour(), t.getMinute(), t.getSecond(), t.getNano()]).toEqual([13, 45, 59, 123]);
    expect(t.toSecondOfDay()).toBe(13 * 3600 + 45 * 60 + 59);
    expect(t.toNanoOfDay()).toBe((13 * 3600 + 45 * 60 + 59) * 1_000_000_000 + 123);
    expect(LocalTime.ofNanoOfDay(t.toNanoOfDay()).equals(t)).toBe(true);
    expect(LocalTime.MIN).toBe(LocalTime.MIDNIGHT);
  });

  it('orders and compares', () => {
    const a = LocalTime.of(8, 0);
    const b = LocalTime.of(17, 30);
    expect(a.isBefore(b)).toBe(true);
    expect(b.isAfter(a)).toBe(true);
    expect(a.isBefore(a)).toBe(false);
    expect(a.isAfter(a)).toBe(false);
    expect(a.compareTo(b)).toBe(-1);
    expect(b.compareTo(a)).toBe(1);
    expect(a.compareTo(LocalTime.of(8, 0))).toBe(0);
    expect(a.equals(LocalTime.of(8, 0))).toBe(true);
    expect(a.equals(b)).toBe(false);
    expect(a.equals('08:00')).toBe(false);
  });

  it('hashes like Long.hashCode(nanoOfDay)', () => {
    expect(LocalTime.MAX.hashCode()).toBe(-1857113749);
    expect(LocalTime.of(9, 5).hashCode()).toBe(-1880996419);
  });

  it.each([
    [() => LocalTime.of(25, 0), 'Invalid value for HourOfDay (valid values 0 - 23): 25'],
    [() => LocalTime.of(1, 60), 'Invalid value for MinuteOfHour (valid values 0 - 59): 60'],
    [() => LocalTime.of(1, 1, 60), 'Invalid value for SecondOfMinute (valid values 0 - 59): 60'],
    [
      () => LocalTime.of(1, 1, 1, 1_000_000_000),
      'Invalid value for NanoOfSecond (valid values 0 - 999999999): 1000000000',
    ],
    [
      () => LocalTime.ofNanoOfDay(86_400_000_000_000),
      'Invalid value for NanoOfDay (valid values 0 - 86399999999999): 86400000000000',
    ],
  ])('rejects out-of-range fields (%#)', (fn, message) => {
    expect(fn).toThrow(message);
  });
});
