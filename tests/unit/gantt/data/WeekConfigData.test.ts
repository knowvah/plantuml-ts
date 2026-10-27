import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { newLocale } from '../../../../src/core/utils/I18nTimeData.js';
import { WeekConfigData } from '../../../../src/diagrams/gantt/data/WeekConfigData.js';
import { WeeklyHeaderStrategy } from '../../../../src/diagrams/gantt/draw/WeeklyHeaderStrategy.js';
import { WeekNumberStrategy } from '../../../../src/diagrams/gantt/time/WeekNumberStrategy.js';

describe('WeekConfigData', () => {
  it('defaults: ENGLISH, ISO-8601 (MONDAY,4), no header strategy, start 0 (WeekConfigData.java:44-49)', () => {
    const d = new WeekConfigData();
    expect(d.getLocale()).toEqual({ language: 'en', country: '' });
    expect(d.getWeekNumberStrategy().getFirstDayOfWeek()).toBe(DayOfWeek.MONDAY);
    expect(d.getWeekNumberStrategy().getMinimalDaysInFirstWeek()).toBe(4);
    expect(d.getWeeklyHeaderStrategy()).toBeUndefined();
    expect(d.getWeekStartingNumber()).toBe(0);
  });

  it('setters round-trip (WeekConfigData.java:70-84)', () => {
    const d = new WeekConfigData();
    const locale = newLocale('FR');
    const strategy = new WeekNumberStrategy(DayOfWeek.SUNDAY, 1);
    d.setLocale(locale);
    d.setWeekNumberStrategy(strategy);
    d.setWeeklyHeaderStrategy(WeeklyHeaderStrategy.FROM_N);
    d.setWeekStartingNumber(7);
    expect(d.getLocale()).toBe(locale);
    expect(d.getLocale().language).toBe('fr');
    expect(d.getWeekNumberStrategy()).toBe(strategy);
    expect(d.getWeeklyHeaderStrategy()).toBe('FROM_N');
    expect(d.getWeekStartingNumber()).toBe(7);
  });
});
