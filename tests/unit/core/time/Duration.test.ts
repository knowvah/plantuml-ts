import { describe, expect, it } from 'vitest';
import { Duration } from '../../../../src/core/time/Duration.js';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import { LocalTime } from '../../../../src/core/time/LocalTime.js';

// Expected values: OpenJDK 21.0.1 scratch program (not a plantuml oracle).
describe('Duration', () => {
  it.each([
    [Duration.ZERO, 'PT0S'],
    [Duration.ofHours(24), 'PT24H'],
    [Duration.ofDays(3).plusHours(5).plusMinutes(6).plusSeconds(7), 'PT77H6M7S'],
    [Duration.ofSeconds(-5, 500_000_000), 'PT-4.5S'],
    [Duration.ofSeconds(-60, 1), 'PT-59.999999999S'],
    [Duration.ofSeconds(1, 5_000_000), 'PT1.005S'],
    [Duration.ofSeconds(-1), 'PT-1S'],
    [Duration.ofSeconds(0, -1), 'PT-0.000000001S'],
    [Duration.ofHours(24).minus(Duration.ofHours(9)), 'PT15H'],
    [Duration.ofHours(9).multipliedBy(5), 'PT45H'],
    [Duration.ofHours(9).multipliedBy(0), 'PT0S'],
  ])('toString %# is %s', (d, expected) => {
    expect(d.toString()).toBe(expected);
  });

  it('between two LocalTimes (data/WorkingHours.java:80-91)', () => {
    expect(Duration.between(LocalTime.of(8, 0), LocalTime.of(17, 30)).toString()).toBe('PT9H30M');
    expect(Duration.between(LocalTime.of(17, 30), LocalTime.of(8, 0)).toString()).toBe('PT-9H-30M');
    expect(Duration.between(LocalTime.MIDNIGHT, LocalTime.MAX).toString()).toBe('PT23H59M59.999999999S');
  });

  it('between two LocalDateTimes (ngm/NGMTaskFixedTotalEffort.java:51)', () => {
    const a = LocalDateTime.of(2024, 1, 1, 0, 0);
    const b = LocalDateTime.of(2024, 3, 1, 12, 0);
    expect(Duration.between(a, b).toString()).toBe('PT1452H');
    expect(Duration.between(b, a).toString()).toBe('PT-1452H');
    expect(Duration.between(a, b).getSeconds()).toBe(1452 * 3600);
  });

  it('getSeconds / getNano / toMillis / isNegative / isZero', () => {
    const d = Duration.ofSeconds(-5, 500_000_000);
    expect(d.getSeconds()).toBe(-5);
    expect(d.getNano()).toBe(500_000_000);
    expect(d.toMillis()).toBe(-4500);
    expect(d.isNegative()).toBe(true);
    expect(Duration.ofHours(1).isNegative()).toBe(false);
    expect(Duration.ZERO.isZero()).toBe(true);
    expect(Duration.ofHours(1).isZero()).toBe(false);
    expect(Duration.ofSeconds(0, 1).isZero()).toBe(false);
  });

  it('plus / minus / negated / multipliedBy normalise nanos', () => {
    const a = Duration.ofSeconds(1, 600_000_000);
    expect(a.plus(a).getSeconds()).toBe(3);
    expect(a.plus(a).getNano()).toBe(200_000_000);
    expect(a.minus(Duration.ofSeconds(2)).toString()).toBe('PT-0.4S');
    expect(a.negated().toString()).toBe('PT-1.6S');
    expect(a.multipliedBy(5).toString()).toBe('PT8S');
  });

  it('ChronoUnit-style constants: ofDays / ofSeconds', () => {
    expect(Duration.ofDays(1).getSeconds()).toBe(86400);
    expect(Duration.ofSeconds(1, 1_500_000_000).getSeconds()).toBe(2);
  });

  it('equals and hashCode follow the JDK', () => {
    expect(Duration.ofHours(24).equals(Duration.ofDays(1))).toBe(true);
    expect(Duration.ofHours(24).equals(Duration.ofHours(23))).toBe(false);
    expect(Duration.ofHours(24).equals('PT24H')).toBe(false);
    expect(Duration.ofDays(1).hashCode()).toBe(86400);
    expect(Duration.ofSeconds(-5, 500).hashCode()).toBe(25504);
  });

  it('D5: realistic gantt spans in seconds stay below Number.MAX_SAFE_INTEGER', () => {
    const centuryOfDays = Duration.ofDays(36_525);
    const times1000Allocations = centuryOfDays.multipliedBy(1000);
    expect(times1000Allocations.getSeconds()).toBe(36_525 * 86_400 * 1000);
    expect(times1000Allocations.getSeconds()).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it('D5: the MIN..MAX sentinel span is ordered and positive even though it exceeds 2^53', () => {
    const span = Duration.between(LocalDateTime.MIN, LocalDateTime.MAX);
    expect(span.getSeconds()).toBeGreaterThan(Number.MAX_SAFE_INTEGER);
    const exact = (365_241_780_471n + 365_243_219_162n) * 86_400n + 86_399n; // epochDay span * 86400 + 23:59:59
    expect(Math.abs(span.getSeconds() - Number(exact))).toBeLessThanOrEqual(8); // double spacing at 6.3e16
    expect(Duration.between(LocalDateTime.MAX, LocalDateTime.MIN).isNegative()).toBe(true);
  });
});
