import { describe, expect, it } from 'vitest';
import { newLocale } from '../../../../src/core/utils/I18nTimeData.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { TimePointFormat } from '../../../../src/diagrams/gantt/time/TimePointFormat.js';

/** 2024-06-17 is a Monday (the date used in the Java comments, TimePointFormat.java:92,96,100). */
const JUN_17 = TimePoint.ofStartOfDay(2024, 6, 17);

/** Expected strings per I18nTimeData tables (month ordinal 5, day ordinal 0). */
const EXPECTED: Readonly<Record<string, readonly [TimePointFormat, string][]>> = {
  en: [
    [TimePointFormat.DAY_OF_WEEK_SHORT, 'Mo'],
    [TimePointFormat.DAY_OF_WEEK_LONG, 'Monday'],
    [TimePointFormat.MONTH_YEAR_SHORT, 'Jun 2024'],
    [TimePointFormat.MONTH_YEAR_LONG, 'June 2024'],
    [TimePointFormat.MONTH_LONG, 'June'],
    [TimePointFormat.MONTH_SHORT, 'Jun'],
    [TimePointFormat.YEAR, '2024'],
    [TimePointFormat.QUARTER, 'Q2'],
    [TimePointFormat.DAY_OF_MONTH, '17'],
    [TimePointFormat.MONTH_AND_DAY, 'Jun 17'],
  ],
  de: [
    [TimePointFormat.DAY_OF_WEEK_SHORT, 'Mo'],
    [TimePointFormat.DAY_OF_WEEK_LONG, 'Montag'],
    [TimePointFormat.MONTH_YEAR_SHORT, 'Jun 2024'],
    [TimePointFormat.MONTH_YEAR_LONG, 'Juni 2024'],
    [TimePointFormat.MONTH_LONG, 'Juni'],
    [TimePointFormat.MONTH_SHORT, 'Jun'],
    [TimePointFormat.YEAR, '2024'],
    [TimePointFormat.QUARTER, 'Q2'],
    [TimePointFormat.DAY_OF_MONTH, '17'],
    [TimePointFormat.MONTH_AND_DAY, '17. Jun'],
  ],
  fr: [
    [TimePointFormat.DAY_OF_WEEK_SHORT, 'lu'],
    [TimePointFormat.DAY_OF_WEEK_LONG, 'lundi'],
    [TimePointFormat.MONTH_YEAR_SHORT, 'juin 2024'],
    [TimePointFormat.MONTH_YEAR_LONG, 'juin 2024'],
    [TimePointFormat.MONTH_LONG, 'juin'],
    [TimePointFormat.MONTH_SHORT, 'juin'],
    [TimePointFormat.YEAR, '2024'],
    [TimePointFormat.QUARTER, 'Q2'],
    [TimePointFormat.DAY_OF_MONTH, '17'],
    [TimePointFormat.MONTH_AND_DAY, '17 juin'],
  ],
  ja: [
    [TimePointFormat.DAY_OF_WEEK_SHORT, '月'],
    [TimePointFormat.DAY_OF_WEEK_LONG, '月曜日'],
    [TimePointFormat.MONTH_YEAR_SHORT, '6月 2024'],
    [TimePointFormat.MONTH_YEAR_LONG, '6月 2024'],
    [TimePointFormat.MONTH_LONG, '6月'],
    [TimePointFormat.MONTH_SHORT, '6月'],
    [TimePointFormat.YEAR, '2024'],
    [TimePointFormat.QUARTER, 'Q2'],
    [TimePointFormat.DAY_OF_MONTH, '17'],
    [TimePointFormat.MONTH_AND_DAY, '6月/17日'],
  ],
};

describe('TimePointFormat', () => {
  it('declares the ten constants in upstream order (TimePointFormat.java:42-43)', () => {
    expect(TimePointFormat.values().map((f) => f.name())).toEqual([
      'DAY_OF_WEEK_SHORT',
      'DAY_OF_WEEK_LONG',
      'MONTH_YEAR_SHORT',
      'MONTH_YEAR_LONG',
      'MONTH_LONG',
      'MONTH_SHORT',
      'YEAR',
      'QUARTER',
      'DAY_OF_MONTH',
      'MONTH_AND_DAY',
    ]);
    expect(TimePointFormat.MONTH_AND_DAY.ordinal()).toBe(9);
    expect(TimePointFormat.YEAR.toString()).toBe('YEAR');
  });

  for (const [lang, rows] of Object.entries(EXPECTED)) {
    it.each(rows.map(([f, s]) => [f.name(), f, s] as const))(`${lang}: %s (TimePointFormat.java:47-85)`, (_n, f, s) => {
      expect(f.format(JUN_17, newLocale(lang))).toBe(s);
    });
  }

  // monthAndDay branches, TimePointFormat.java:87-107 (the es/ko/ru/zh cases are not in the en/de/fr/ja matrix).
  it.each([
    ['es', '17 de jun'],
    ['ko', '6월 17일'],
    ['ru', '17 июнь'],
    ['zh', '6月17日'],
  ])('MONTH_AND_DAY for %s (TimePointFormat.java:94,100,104,106)', (lang, expected) => {
    expect(TimePointFormat.MONTH_AND_DAY.format(JUN_17, newLocale(lang))).toBe(expected);
  });
});
