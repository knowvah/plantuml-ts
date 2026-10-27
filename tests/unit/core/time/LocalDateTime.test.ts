import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { Duration } from '../../../../src/core/time/Duration.js';
import { Instant } from '../../../../src/core/time/Instant.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import { LocalTime } from '../../../../src/core/time/LocalTime.js';
import { Month } from '../../../../src/core/time/Month.js';
import { ZoneOffset } from '../../../../src/core/time/ZoneOffset.js';

// Expected values: OpenJDK 21.0.1 scratch program (not a plantuml oracle).
describe('LocalDateTime', () => {
  it('has the MIN and MAX sentinels (ngm/math/PiecewiseConstantTimeWindow.java:127,149)', () => {
    expect(LocalDateTime.MIN.toString()).toBe('-999999999-01-01T00:00');
    expect(LocalDateTime.MAX.toString()).toBe('+999999999-12-31T23:59:59.999999999');
    expect(LocalDateTime.MIN).toBe(LocalDateTime.MIN);
    expect(LocalDateTime.MAX.isAfter(LocalDateTime.of(9999, 12, 31, 23, 59))).toBe(true);
    expect(LocalDateTime.MIN.isBefore(LocalDateTime.of(-9999, 1, 1, 0, 0))).toBe(true);
  });

  it('builds from fields, a Month, or a date and time', () => {
    const a = LocalDateTime.of(2024, 2, 29, 13, 5);
    expect(a.toString()).toBe('2024-02-29T13:05');
    expect(LocalDateTime.of(2024, Month.FEBRUARY, 29, 13, 5, 7, 123_000_000).toString()).toBe(
      '2024-02-29T13:05:07.123',
    );
    expect(LocalDateTime.of(LocalDate.of(2024, 2, 29), LocalTime.of(13, 5)).equals(a)).toBe(true);
  });

  it('exposes the accessors gantt reads', () => {
    const a = LocalDateTime.of(2024, 2, 29, 13, 5, 7);
    expect([a.getYear(), a.getDayOfMonth(), a.getHour(), a.getMinute(), a.getSecond()]).toEqual([2024, 29, 13, 5, 7]);
    expect(a.getMonth()).toBe(Month.FEBRUARY);
    expect(a.getDayOfWeek()).toBe(DayOfWeek.THURSDAY);
    expect(a.toLocalDate().toString()).toBe('2024-02-29');
    expect(a.toLocalTime().toString()).toBe('13:05:07');
  });

  it('plusSeconds / minusSeconds carry across midnight and month ends', () => {
    expect(LocalDateTime.of(2024, 2, 28, 23, 59, 59).plusSeconds(1).toString()).toBe('2024-02-29T00:00');
    expect(LocalDateTime.of(2024, 3, 1, 0, 0).minusSeconds(1).toString()).toBe('2024-02-29T23:59:59');
    expect(
      LocalDateTime.of(2024, 3, 1, 0, 0)
        .plusSeconds(86400 * 3 + 61)
        .toString(),
    ).toBe('2024-03-04T00:01:01');
    expect(LocalDateTime.of(2024, 3, 1, 0, 0).plusSeconds(0).toString()).toBe('2024-03-01T00:00');
  });

  it('plus / minus a Duration', () => {
    const a = LocalDateTime.of(2024, 3, 1, 0, 0);
    expect(a.plus(Duration.ofHours(25)).toString()).toBe('2024-03-02T01:00');
    expect(a.minus(Duration.ofHours(25)).toString()).toBe('2024-02-28T23:00');
    expect(a.plus(Duration.ofSeconds(0, 1500)).toString()).toBe('2024-03-01T00:00:00.000001500');
  });

  it('plusDays and with(LocalTime)', () => {
    const a = LocalDateTime.of(2024, 3, 1, 10, 0);
    expect(a.plusDays(0)).toBe(a);
    expect(a.plusDays(-1).toString()).toBe('2024-02-29T10:00');
    expect(a.with(LocalTime.of(8, 30)).toString()).toBe('2024-03-01T08:30');
  });

  it('compares, equals and hashes like the JDK', () => {
    const a = LocalDateTime.of(2024, 2, 29, 13, 5);
    const b = LocalDateTime.of(2024, 2, 29, 13, 6);
    expect(a.compareTo(b)).toBeLessThan(0);
    expect(b.compareTo(a)).toBeGreaterThan(0);
    expect(a.compareTo(LocalDateTime.of(2024, 3, 1, 0, 0))).toBeLessThan(0);
    expect(a.isBefore(b)).toBe(true);
    expect(a.isAfter(b)).toBe(false);
    expect(a.equals(LocalDateTime.of(2024, 2, 29, 13, 5))).toBe(true);
    expect(a.equals(b)).toBe(false);
    expect(a.equals('x')).toBe(false);
    expect(a.hashCode()).toBe(1392226891);
  });

  describe('instants and offsets', () => {
    it('ofInstant at UTC (time/TimePoint.java:86)', () => {
      expect(LocalDateTime.ofInstant(Instant.ofEpochMilli(-1), ZoneOffset.UTC).toString()).toBe(
        '1969-12-31T23:59:59.999',
      );
      expect(LocalDateTime.ofInstant(Instant.ofEpochMilli(1_700_000_000_123), ZoneOffset.UTC).toString()).toBe(
        '2023-11-14T22:13:20.123',
      );
    });

    it('toInstant(UTC).toEpochMilli() (time/TimePoint.java:134)', () => {
      expect(LocalDateTime.of(2024, 2, 29, 13, 5, 7, 123_000_000).toInstant(ZoneOffset.UTC).toEpochMilli()).toBe(
        1709211907123,
      );
      expect(LocalDateTime.of(1969, 12, 31, 23, 59, 59, 999_000_000).toInstant(ZoneOffset.UTC).toEpochMilli()).toBe(-1);
    });

    it('ofEpochSecond applies a non-zero offset and round-trips toEpochSecond', () => {
      const plus2 = ZoneOffset.ofTotalSeconds(7200);
      const ldt = LocalDateTime.ofEpochSecond(0, 5, plus2.getTotalSeconds());
      expect(ldt.toString()).toBe('1970-01-01T02:00:00.000000005');
      expect(ldt.toEpochSecond(plus2)).toBe(0);
      expect(ldt.toInstant(plus2).equals(Instant.ofEpochSecond(0, 5))).toBe(true);
    });
  });
});
