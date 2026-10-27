import { describe, expect, it } from 'vitest';
import { DateTimeException } from '../../../../src/core/time/DateTimeException.js';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { Month } from '../../../../src/core/time/Month.js';

// Expected values below were printed by OpenJDK 21.0.1 (scratch program, not a plantuml oracle).
describe('LocalDate', () => {
  it.each([
    [1900, 2, 28, '1900-03-01'],
    [2000, 2, 28, '2000-02-29'],
    [2024, 2, 28, '2024-02-29'],
  ])('%i-%i-%i + 1 day = %s (Gregorian leap rules)', (y, m, d, expected) => {
    expect(LocalDate.of(y, m, d).plusDays(1).toString()).toBe(expected);
  });

  it('round-trips toEpochDay/ofEpochDay for every day of 1970-2100', () => {
    const first = LocalDate.of(1970, 1, 1).toEpochDay();
    const last = LocalDate.of(2100, 12, 31).toEpochDay();
    expect(first).toBe(0);
    expect(last).toBe(47846);
    for (let n = first; n <= last; n++) {
      expect(LocalDate.ofEpochDay(n).toEpochDay()).toBe(n);
    }
  });

  it('round-trips field values over a wide proleptic range', () => {
    for (let n = -800_000; n <= 800_000; n += 37) {
      const d = LocalDate.ofEpochDay(n);
      expect(LocalDate.of(d.getYear(), d.getMonthValue(), d.getDayOfMonth()).toEpochDay()).toBe(n);
    }
  });

  it('matches the JDK epoch days at known points and at both extremes', () => {
    expect(LocalDate.of(-44, 3, 15).toEpochDay()).toBe(-735525);
    expect(LocalDate.of(1, 1, 1).toEpochDay()).toBe(-719162);
    expect(LocalDate.ofEpochDay(-719528).toString()).toBe('0000-01-01');
    expect(LocalDate.of(999_999_999, 12, 31).toEpochDay()).toBe(365_241_780_471);
    expect(LocalDate.of(-999_999_999, 1, 1).toEpochDay()).toBe(-365_243_219_162);
    expect(LocalDate.ofEpochDay(365_241_780_471).getYear()).toBe(999_999_999);
    expect(LocalDate.ofEpochDay(-365_243_219_162).getYear()).toBe(-999_999_999);
  });

  it('computes day of week and day of year like the JDK', () => {
    expect(LocalDate.of(2024, 2, 29).getDayOfWeek()).toBe(DayOfWeek.THURSDAY);
    expect(LocalDate.of(1900, 1, 1).getDayOfWeek()).toBe(DayOfWeek.MONDAY);
    expect(LocalDate.of(1969, 12, 31).getDayOfWeek()).toBe(DayOfWeek.WEDNESDAY);
    expect(LocalDate.of(2024, 12, 31).getDayOfYear()).toBe(366);
    expect(LocalDate.of(2023, 3, 1).getDayOfYear()).toBe(60);
  });

  it('accepts a Month constant and exposes the fields', () => {
    const d = LocalDate.of(2024, Month.MARCH, 9);
    expect(d.getMonth()).toBe(Month.MARCH);
    expect(d.getMonthValue()).toBe(3);
    expect(d.getDayOfMonth()).toBe(9);
    expect(d.getYear()).toBe(2024);
    expect(d.isLeapYear()).toBe(true);
    expect(d.lengthOfYear()).toBe(366);
    expect(LocalDate.of(2023, 1, 1).lengthOfYear()).toBe(365);
  });

  it('formats like LocalDate#toString', () => {
    expect(LocalDate.of(5, 1, 2).toString()).toBe('0005-01-02');
    expect(LocalDate.of(-5, 1, 2).toString()).toBe('-0005-01-02');
    expect(LocalDate.of(12345, 1, 2).toString()).toBe('+12345-01-02');
  });

  it('hashes like the JDK (HashMap iteration order depends on it)', () => {
    expect(LocalDate.of(2024, 2, 29).hashCode()).toBe(4145309);
    expect(LocalDate.of(1970, 1, 1).hashCode()).toBe(4034625);
    expect(LocalDate.of(-44, 3, 15).hashCode()).toBe(88271);
  });

  it('orders and compares', () => {
    const a = LocalDate.of(2024, 2, 29);
    expect(a.isBefore(LocalDate.of(2024, 3, 1))).toBe(true);
    expect(a.isAfter(LocalDate.of(2024, 2, 28))).toBe(true);
    expect(a.isBefore(a)).toBe(false);
    expect(a.compareTo(LocalDate.of(2025, 1, 1))).toBeLessThan(0);
    expect(a.compareTo(LocalDate.of(2024, 1, 31))).toBeGreaterThan(0);
    expect(a.compareTo(LocalDate.of(2024, 2, 1))).toBeGreaterThan(0);
    expect(a.equals(LocalDate.of(2024, 2, 29))).toBe(true);
    expect(a.equals('2024-02-29')).toBe(false);
  });

  it('plusDays/minusDays handle zero, negative and month crossings', () => {
    const a = LocalDate.of(2024, 3, 1);
    expect(a.plusDays(0)).toBe(a);
    expect(a.minusDays(1).toString()).toBe('2024-02-29');
    expect(a.plusDays(-366).toString()).toBe('2023-03-01');
    expect(a.plusDays(365).toString()).toBe('2025-03-01');
  });

  it('atStartOfDay yields midnight', () => {
    expect(LocalDate.of(2024, 2, 29).atStartOfDay().toString()).toBe('2024-02-29T00:00');
  });

  it('get(field) delegates to the field', () => {
    expect(LocalDate.of(2024, 2, 29).get({ getFrom: (d) => d.getDayOfMonth() * 2 })).toBe(58);
  });

  it.each([
    [2023, 2, 29, "Invalid date 'February 29' as '2023' is not a leap year"],
    [2024, 2, 30, "Invalid date 'FEBRUARY 30'"],
    [2024, 4, 31, "Invalid date 'APRIL 31'"],
    [2024, 13, 1, 'Invalid value for MonthOfYear (valid values 1 - 12): 13'],
    [2024, 1, 32, 'Invalid value for DayOfMonth (valid values 1 - 28/31): 32'],
    [1_000_000_000, 1, 1, 'Invalid value for Year (valid values -999999999 - 999999999): 1000000000'],
  ])('LocalDate.of(%i, %i, %i) throws the JDK message', (y, m, d, message) => {
    expect(() => LocalDate.of(y, m, d)).toThrow(new DateTimeException(message));
    expect(() => LocalDate.of(y, m, d)).toThrow(DateTimeException);
  });

  it('rejects an epoch day beyond LocalDate.MAX', () => {
    expect(() => LocalDate.ofEpochDay(365_241_780_472)).toThrow(
      'Invalid value for EpochDay (valid values -365243219162 - 365241780471): 365241780472',
    );
    expect(() => LocalDate.of(999_999_999, 12, 31).plusDays(1)).toThrow(DateTimeException);
  });
});
