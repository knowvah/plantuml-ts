import { describe, expect, it } from 'vitest';
import { ChronoUnit } from '../../../../src/core/time/ChronoUnit.js';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { Month } from '../../../../src/core/time/Month.js';

// Expected values: OpenJDK 21.0.1 scratch program (not a plantuml oracle).
describe('DayOfWeek', () => {
  it('keeps the Java ordinals and names', () => {
    expect(DayOfWeek.values().map((d) => d.name())).toEqual([
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ]);
    expect(DayOfWeek.values().map((d) => d.ordinal())).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(DayOfWeek.SUNDAY.getValue()).toBe(7);
    expect(DayOfWeek.SUNDAY.toString()).toBe('SUNDAY');
  });

  it('plus/minus wrap around the week', () => {
    expect(DayOfWeek.SUNDAY.plus(1)).toBe(DayOfWeek.MONDAY);
    expect(DayOfWeek.MONDAY.minus(1)).toBe(DayOfWeek.SUNDAY);
    expect(DayOfWeek.MONDAY.minus(8)).toBe(DayOfWeek.SUNDAY);
    expect(DayOfWeek.WEDNESDAY.plus(-3)).toBe(DayOfWeek.SUNDAY);
  });

  it('of() maps 1..7 and rejects others with the JDK message', () => {
    expect(DayOfWeek.of(1)).toBe(DayOfWeek.MONDAY);
    expect(DayOfWeek.of(7)).toBe(DayOfWeek.SUNDAY);
    expect(() => DayOfWeek.of(8)).toThrow('Invalid value for DayOfWeek: 8');
    expect(() => DayOfWeek.of(0)).toThrow('Invalid value for DayOfWeek: 0');
    expect(() => DayOfWeek.of(1.5)).toThrow('Invalid value for DayOfWeek: 1.5');
  });

  it('values() returns a fresh array and compareTo follows ordinals', () => {
    expect(DayOfWeek.values()).not.toBe(DayOfWeek.values());
    expect(DayOfWeek.MONDAY.compareTo(DayOfWeek.FRIDAY)).toBe(-4);
  });
});

describe('Month', () => {
  it('keeps the Java ordinals and names', () => {
    expect(Month.values()).toHaveLength(12);
    expect(Month.JANUARY.ordinal()).toBe(0);
    expect(Month.DECEMBER.ordinal()).toBe(11);
    expect(Month.SEPTEMBER.name()).toBe('SEPTEMBER');
    expect(Month.SEPTEMBER.getValue()).toBe(9);
    expect(Month.SEPTEMBER.toString()).toBe('SEPTEMBER');
    expect(Month.values().map((m) => m.name().slice(0, 3))).toEqual([
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ]);
  });

  it('length(leap) matches the calendar', () => {
    expect(Month.values().map((m) => m.length(false))).toEqual([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
    expect(Month.FEBRUARY.length(true)).toBe(29);
    expect(Month.APRIL.length(true)).toBe(30);
  });

  it('plus wraps and of() validates', () => {
    expect(Month.NOVEMBER.plus(3)).toBe(Month.FEBRUARY);
    expect(Month.JANUARY.plus(-1)).toBe(Month.DECEMBER);
    expect(Month.of(12)).toBe(Month.DECEMBER);
    expect(() => Month.of(13)).toThrow('Invalid value for MonthOfYear: 13');
    expect(() => Month.of(0)).toThrow('Invalid value for MonthOfYear: 0');
    expect(Month.MARCH.compareTo(Month.JANUARY)).toBe(2);
  });
});

describe('ChronoUnit.DAYS', () => {
  it('has Java ordinal 7, a 86400 s duration and counts days between dates', () => {
    expect(ChronoUnit.DAYS.ordinal()).toBe(7);
    expect(ChronoUnit.DAYS.getDuration().getSeconds()).toBe(86400);
    expect(ChronoUnit.DAYS.between(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 3, 1))).toBe(60);
    expect(ChronoUnit.DAYS.between(LocalDate.of(2024, 3, 1), LocalDate.of(2024, 1, 1))).toBe(-60);
    expect(ChronoUnit.DAYS.toString()).toBe('Days');
  });
});
