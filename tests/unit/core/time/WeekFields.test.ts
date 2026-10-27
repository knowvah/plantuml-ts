import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { WeekFields } from '../../../../src/core/time/WeekFields.js';

interface Config {
  readonly firstDayOfWeek: number;
  readonly minimalDays: number;
  readonly weekOfYear: readonly number[];
  readonly weekOfWeekBasedYear: readonly number[];
  readonly weekBasedYear: readonly number[];
}
interface Fixture {
  readonly provenance: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly configs: readonly Config[];
}

const FIXTURE = JSON.parse(
  readFileSync(new URL('./fixtures/weekfields-jdk21.json', import.meta.url), 'utf8'),
) as Fixture;

function parseDate(iso: string): LocalDate {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return LocalDate.of(y, m, d);
}

describe('WeekFields', () => {
  it('ISO and SUNDAY_START are the two gantt definitions', () => {
    expect(WeekFields.ISO.getFirstDayOfWeek()).toBe(DayOfWeek.MONDAY);
    expect(WeekFields.ISO.getMinimalDaysInFirstWeek()).toBe(4);
    expect(WeekFields.SUNDAY_START.getFirstDayOfWeek()).toBe(DayOfWeek.SUNDAY);
    expect(WeekFields.SUNDAY_START.getMinimalDaysInFirstWeek()).toBe(1);
    expect(WeekFields.of(DayOfWeek.MONDAY, 4)).toBe(WeekFields.ISO);
    expect(WeekFields.ISO.equals(WeekFields.of(DayOfWeek.MONDAY, 4))).toBe(true);
    expect(WeekFields.ISO.equals(WeekFields.SUNDAY_START)).toBe(false);
    expect(WeekFields.ISO.equals('ISO')).toBe(false);
  });

  it('rejects minimalDays outside 1..7 like the JDK', () => {
    expect(() => WeekFields.of(DayOfWeek.MONDAY, 8)).toThrow('Minimal number of days is invalid');
    expect(() => WeekFields.of(DayOfWeek.MONDAY, 0)).toThrow('Minimal number of days is invalid');
  });

  // JDK 21.0.1 printed (weekOfYear / weekOfWeekBasedYear) for the acceptance dates.
  it.each([
    ['2020-12-31', 53, 53, 53, 1],
    ['2021-01-01', 0, 53, 1, 1],
    ['2021-01-03', 0, 53, 2, 2],
    ['2021-01-04', 1, 1, 2, 2],
  ])('%s: ISO %i/%i, SUNDAY_START %i/%i', (iso, isoWoy, isoWowby, sunWoy, sunWowby) => {
    const d = parseDate(iso);
    expect(d.get(WeekFields.ISO.weekOfYear())).toBe(isoWoy);
    expect(d.get(WeekFields.ISO.weekOfWeekBasedYear())).toBe(isoWowby);
    expect(d.get(WeekFields.SUNDAY_START.weekOfYear())).toBe(sunWoy);
    expect(d.get(WeekFields.SUNDAY_START.weekOfWeekBasedYear())).toBe(sunWowby);
  });

  it('SUNDAY_START week-based year of 2020-12-31 is 2021 (JDK printed)', () => {
    expect(parseDate('2020-12-31').get(WeekFields.SUNDAY_START.weekBasedYear())).toBe(2021);
  });

  it('dayOfWeek counts from the configured first day', () => {
    const sunday = LocalDate.of(2021, 1, 3);
    expect(sunday.get(WeekFields.ISO.dayOfWeek())).toBe(7);
    expect(sunday.get(WeekFields.SUNDAY_START.dayOfWeek())).toBe(1);
  });

  it(`matches the JDK for every day ${FIXTURE.startDate}..${FIXTURE.endDate} under ${FIXTURE.configs.length} definitions`, () => {
    expect(FIXTURE.provenance).toContain('OpenJDK 21.0.1');
    const start = parseDate(FIXTURE.startDate).toEpochDay();
    const end = parseDate(FIXTURE.endDate).toEpochDay();
    for (const cfg of FIXTURE.configs) {
      const wf = WeekFields.of(DayOfWeek.of(cfg.firstDayOfWeek), cfg.minimalDays);
      expect(cfg.weekOfYear).toHaveLength(end - start + 1);
      const mismatches: string[] = [];
      for (let n = start; n <= end; n++) {
        const d = LocalDate.ofEpochDay(n);
        const i = n - start;
        const got = [d.get(wf.weekOfYear()), d.get(wf.weekOfWeekBasedYear()), d.get(wf.weekBasedYear())];
        const want = [cfg.weekOfYear[i], cfg.weekOfWeekBasedYear[i], cfg.weekBasedYear[i]];
        if (got.join() !== want.join())
          mismatches.push(
            `${d.toString()} cfg ${cfg.firstDayOfWeek}/${cfg.minimalDays} got ${got.join()} want ${want.join()}`,
          );
      }
      expect(mismatches).toEqual([]);
    }
  });
});
