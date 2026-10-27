import { describe, expect, it } from 'vitest';
import { ComplementTimePoint } from '../../../../src/diagrams/gantt/lang/ComplementTimePoint.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementTimePoint.java:60-99.
const complement = ComplementTimePoint.any();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);

describe('ComplementTimePoint', () => {
  it.each(['2020-03-15T10:30', '2020-03-15t10:30:45', '15 March 2020T08:05', 'March 15 2020t23:59:59'])(
    'accepts %s (java:62-66, 71-82)',
    (s) => {
      expect(parse(s).exactMatch()).toBe(true);
    },
  );

  it.each(['2020-03-15', '2020-03-15T10', '2020-03-15T10:30:', '10:30', '2020-03-15 10:30 pm'])(
    'rejects %s (java:62-66, 71-82)',
    (s) => {
      expect(parse(s).exactMatch()).toBe(false);
    },
  );

  it('getMe builds the TimePoint from day and HH:MM, seconds default 0 (java:85-98)', () => {
    const tp = complement.getMe(newGantt(), parse('2020-03-15T10:30')).get();
    const again = complement.getMe(newGantt(), parse('2020-03-15T10:30:00')).get();
    expect(tp.compareTo(again)).toBe(0);
    expect(tp.toString()).toContain('2020-03-15');
    expect(tp.toString()).toContain('10:30');
  });

  it('seconds are parsed when present (java:97)', () => {
    const a = complement.getMe(newGantt(), parse('2020-03-15T10:30:45')).get();
    const b = complement.getMe(newGantt(), parse('2020-03-15T10:30')).get();
    expect(a.compareTo(b)).toBeGreaterThan(0);
  });

  it('day-month-year and month-day-year agree (DayPattern keys)', () => {
    const a = complement.getMe(newGantt(), parse('15 March 2020T08:05')).get();
    const b = complement.getMe(newGantt(), parse('2020-03-15T08:05')).get();
    expect(a.compareTo(b)).toBe(0);
  });

  it('no day capture is IllegalStateException (java:88-89)', () => {
    const none = { findFirstValueByKey: () => undefined, findValuesByKey: () => [] };
    expect(() => complement.getMe(newGantt(), none)).toThrow('IllegalStateException');
  });

  it('a missing HOUR is NumberFormatException (Integer.parseInt(null))', () => {
    const noTime = {
      findFirstValueByKey: (k: string) =>
        k === 'ADAY' ? '1' : k === 'AMONTH' ? 'jan' : k === 'AYEAR' ? '2020' : undefined,
      findValuesByKey: () => [],
    };
    expect(() => complement.getMe(newGantt(), noTime)).toThrow('NumberFormatException');
  });

  it('an out-of-range hour is rejected by LocalTime.of (java:99)', () => {
    expect(() => complement.getMe(newGantt(), parse('2020-03-15T25:00'))).toThrow();
  });

  it('an hour beyond int range is a NumberFormatException (Integer.parseInt)', () => {
    const big = {
      findFirstValueByKey: (k: string) =>
        ({ ADAY: '1', AMONTH: 'jan', AYEAR: '2020', HOUR: '99999999999', MINUTE: '0' })[k],
      findValuesByKey: (): string[] => [],
    };
    expect(() => complement.getMe(newGantt(), big)).toThrow('NumberFormatException');
  });
});
