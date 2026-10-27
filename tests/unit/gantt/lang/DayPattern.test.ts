import { describe, expect, it } from 'vitest';
import { DayPattern } from '../../../../src/diagrams/gantt/lang/DayPattern.js';

// Expected values: DayPattern.java (gantt/lang) and the date shapes of TimeResolution.java.
const lookup = (values: Record<string, string>) => ({
  findFirstValueByKey: (key: string): string | undefined => values[key],
  findValuesByKey: (key: string): string[] => (key in values ? [values[key]!] : []),
});

describe('DayPattern', () => {
  const pattern = new DayPattern('X');

  it('parses day-month-year via the A keys (java:77-79, 89-94)', () => {
    const m = pattern.toUbrex().match('15 March 2020');
    expect(m.exactMatch()).toBe(true);
    expect(pattern.getDay(m)?.toString()).toBe('2020-03-15');
  });

  it('parses year-month-day via the B keys (java:80-81, 96-101)', () => {
    const m = pattern.toUbrex().match('2020/3/9');
    expect(m.exactMatch()).toBe(true);
    expect(pattern.getDay(m)?.toString()).toBe('2020-03-09');
  });

  it('parses month-day-year via the C keys (java:82-83, 103-108)', () => {
    const m = pattern.toUbrex().match('dec 25, 2021');
    expect(m.exactMatch()).toBe(true);
    expect(pattern.getDay(m)?.toString()).toBe('2021-12-25');
  });

  it('keys carry the id prefix: A/B/C + YEAR/MONTH/DAY + id (java:59-69)', () => {
    expect(pattern.getDay(lookup({ ADAYX: '1', AMONTHX: 'feb', AYEARX: '2024' }))?.toString()).toBe('2024-02-01');
    expect(pattern.getDay(lookup({ BDAYX: '2', BMONTHX: '3', BYEARX: '2025' }))?.toString()).toBe('2025-03-02');
    expect(pattern.getDay(lookup({ CDAYX: '3', CMONTHX: 'apr', CYEARX: '2026' }))?.toString()).toBe('2026-04-03');
    expect(pattern.getDay(lookup({ ADAY: '1', AMONTH: 'feb', AYEAR: '2024' }))).toBeUndefined();
  });

  it('returns undefined (Java null) when no day key matched (java:84-85)', () => {
    expect(pattern.getDay(lookup({}))).toBeUndefined();
  });

  it('an impossible date is rejected by LocalDate.of (java:93)', () => {
    expect(() => pattern.getDay(lookup({ ADAYX: '31', AMONTHX: 'feb', AYEARX: '2024' }))).toThrow();
  });

  it('a non-numeric or missing component is a NumberFormatException (Integer.parseInt)', () => {
    expect(() => pattern.getDay(lookup({ BDAYX: 'x', BMONTHX: '3', BYEARX: '2025' }))).toThrow('NumberFormatException');
    expect(() => pattern.getDay(lookup({ BDAYX: '1', BMONTHX: '3' }))).toThrow('NumberFormatException');
    expect(() => pattern.getDay(lookup({ BDAYX: '1', BMONTHX: '3', BYEARX: '99999999999' }))).toThrow(
      'NumberFormatException',
    );
  });

  it('a missing month name is a NullPointerException (MonthUtils.fromString(null))', () => {
    expect(() => pattern.getDay(lookup({ ADAYX: '1', AYEARX: '2024' }))).toThrow('NullPointerException');
    expect(() => pattern.getDay(lookup({ CDAYX: '1', CYEARX: '2024' }))).toThrow('NullPointerException');
  });
});
