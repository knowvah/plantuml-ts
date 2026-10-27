import { describe, expect, it } from 'vitest';
import { Instant } from '../../../../src/core/time/Instant.js';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import { YearMonth } from '../../../../src/core/time/YearMonth.js';
import { ZoneOffset } from '../../../../src/core/time/ZoneOffset.js';

// Expected values: OpenJDK 21.0.1 scratch program (not a plantuml oracle).
describe('Instant', () => {
  it('EPOCH.atZone(UTC).toLocalDate() is 1970-01-01 (time/TimePoint.java:50)', () => {
    const zdt = Instant.EPOCH.atZone(ZoneOffset.UTC);
    expect(zdt.toLocalDate().toString()).toBe('1970-01-01');
    expect(zdt.toLocalDateTime().toString()).toBe('1970-01-01T00:00');
    expect(zdt.getOffset()).toBe(ZoneOffset.UTC);
  });

  it('ofEpochMilli splits seconds and nanos with floor semantics', () => {
    const i = Instant.ofEpochMilli(-1);
    expect(i.getEpochSecond()).toBe(-1);
    expect(i.getNano()).toBe(999_000_000);
    expect(i.toEpochMilli()).toBe(-1);
    expect(Instant.ofEpochMilli(1_700_000_000_123).toEpochMilli()).toBe(1_700_000_000_123);
  });

  it('ofEpochSecond normalises the nano adjustment and compares', () => {
    const i = Instant.ofEpochSecond(1, -1);
    expect([i.getEpochSecond(), i.getNano()]).toEqual([0, 999_999_999]);
    expect(Instant.ofEpochSecond(5).compareTo(Instant.ofEpochSecond(6))).toBeLessThan(0);
    expect(Instant.ofEpochSecond(5, 2).compareTo(Instant.ofEpochSecond(5, 1))).toBe(1);
    expect(Instant.ofEpochSecond(5).equals(Instant.ofEpochSecond(5))).toBe(true);
    expect(Instant.ofEpochSecond(5).equals(5)).toBe(false);
  });

  it('rejects a non-integer epoch millisecond', () => {
    expect(() => Instant.ofEpochMilli(0.5)).toThrow('Invalid value for EpochMilli');
  });
});

describe('ZoneOffset', () => {
  it('UTC is the zero offset and ofTotalSeconds(0) returns it', () => {
    expect(ZoneOffset.UTC.getTotalSeconds()).toBe(0);
    expect(ZoneOffset.ofTotalSeconds(0)).toBe(ZoneOffset.UTC);
    expect(ZoneOffset.ofTotalSeconds(3600).equals(ZoneOffset.ofTotalSeconds(3600))).toBe(true);
    expect(ZoneOffset.ofTotalSeconds(3600).equals(ZoneOffset.UTC)).toBe(false);
    expect(ZoneOffset.UTC.equals(0)).toBe(false);
  });

  it('rejects offsets beyond +-18:00', () => {
    expect(() => ZoneOffset.ofTotalSeconds(18 * 3600 + 1)).toThrow('Zone offset not in valid range: -18:00 to +18:00');
    expect(ZoneOffset.ofTotalSeconds(-18 * 3600).getTotalSeconds()).toBe(-64800);
  });
});

describe('YearMonth', () => {
  it('from(LocalDateTime) keeps year and month (time/TimePoint.java:177)', () => {
    const ym = YearMonth.from(LocalDateTime.of(2024, 2, 29, 13, 5));
    expect(ym.getYear()).toBe(2024);
    expect(ym.equals(YearMonth.from(LocalDateTime.of(2024, 2, 1, 0, 0)))).toBe(true);
    expect(ym.equals(YearMonth.from(LocalDateTime.of(2024, 3, 1, 0, 0)))).toBe(false);
    expect(ym.equals(YearMonth.from(LocalDateTime.of(2023, 2, 1, 0, 0)))).toBe(false);
    expect(ym.equals(2024)).toBe(false);
  });
});
