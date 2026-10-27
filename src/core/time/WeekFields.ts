/**
 * `java.time.temporal.WeekFields` -- locale-independent week definition
 * (first day of week + minimal days in first week). Gantt calls
 * `WeekFields.of(firstDayOfWeek, minimalDays)` then `weekOfYear()`
 * (`time/TimePoint.java:104-105`), and `WeekNumberStrategy` carries the two
 * inputs (`ISO` = Monday/4 is gantt's default, `data/WeekConfigData.java:52`).
 * `weekOfWeekBasedYear()`/`weekBasedYear()`/`dayOfWeek()` are ported with it
 * because they share the same algorithm; `weekOfMonth()` is not called by
 * gantt and is not ported.
 *
 * Algorithm: OpenJDK `WeekFields.ComputedDayOfField`
 * (jdk-21+35 `java/time/temporal/WeekFields.java`: `localizedDayOfWeek`,
 * `localizedWeekOfYear`, `startOfWeekOffset`, `computeWeek`,
 * `localizedWeekBasedYear`, `localizedWeekOfWeekBasedYear`).
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/temporal/WeekFields.html
 */
import { DayOfWeek } from './DayOfWeek.js';
import type { LocalDate } from './LocalDate.js';
import type { TemporalField } from './TemporalField.js';
import { floorMod } from './time-math.js';

const CACHE = new Map<number, WeekFields>();

export class WeekFields {
  /** `WeekFields.ISO` = Monday, 4. */
  public static readonly ISO: WeekFields = WeekFields.of(DayOfWeek.MONDAY, 4);
  /** `WeekFields.SUNDAY_START` = Sunday, 1. */
  public static readonly SUNDAY_START: WeekFields = WeekFields.of(DayOfWeek.SUNDAY, 1);

  readonly #firstDayOfWeek: DayOfWeek;
  readonly #minimalDays: number;

  private constructor(firstDayOfWeek: DayOfWeek, minimalDaysInFirstWeek: number) {
    this.#firstDayOfWeek = firstDayOfWeek;
    this.#minimalDays = minimalDaysInFirstWeek;
  }

  /**
   * `WeekFields.of(DayOfWeek, int)`; `minimalDaysInFirstWeek` must be 1..7
   * (`IllegalArgumentException("Minimal number of days is invalid")`).
   */
  public static of(firstDayOfWeek: DayOfWeek, minimalDaysInFirstWeek: number): WeekFields {
    if (!Number.isInteger(minimalDaysInFirstWeek) || minimalDaysInFirstWeek < 1 || minimalDaysInFirstWeek > 7) {
      throw new RangeError('Minimal number of days is invalid');
    }
    const key = firstDayOfWeek.ordinal() * 7 + (minimalDaysInFirstWeek - 1);
    let wf = CACHE.get(key);
    if (wf === undefined) {
      wf = new WeekFields(firstDayOfWeek, minimalDaysInFirstWeek);
      CACHE.set(key, wf);
    }
    return wf;
  }

  public getFirstDayOfWeek(): DayOfWeek {
    return this.#firstDayOfWeek;
  }

  public getMinimalDaysInFirstWeek(): number {
    return this.#minimalDays;
  }

  /** `WeekFields#dayOfWeek()` -- 1..7 counted from this definition's first day. */
  public dayOfWeek(): TemporalField {
    return { getFrom: (date) => this.#localizedDayOfWeek(date) };
  }

  /** `WeekFields#weekOfYear()` -- 0 for days before the first week. */
  public weekOfYear(): TemporalField {
    return { getFrom: (date) => this.#localizedWeekOfYear(date) };
  }

  /** `WeekFields#weekOfWeekBasedYear()`. */
  public weekOfWeekBasedYear(): TemporalField {
    return { getFrom: (date) => this.#localizedWeekOfWeekBasedYear(date) };
  }

  /** `WeekFields#weekBasedYear()`. */
  public weekBasedYear(): TemporalField {
    return { getFrom: (date) => this.#localizedWeekBasedYear(date) };
  }

  public equals(other: unknown): boolean {
    return (
      other instanceof WeekFields &&
      other.#firstDayOfWeek === this.#firstDayOfWeek &&
      other.#minimalDays === this.#minimalDays
    );
  }

  #localizedDayOfWeek(date: LocalDate): number {
    const sow = this.#firstDayOfWeek.getValue();
    const isoDow = date.getDayOfWeek().getValue();
    return floorMod(isoDow - sow, 7) + 1;
  }

  /** `startOfWeekOffset(day, dow)`: offset of the first full week's start, zero origin. */
  #startOfWeekOffset(day: number, dow: number): number {
    const weekStart = floorMod(day - dow, 7);
    let offset = -weekStart;
    if (weekStart + 1 > this.#minimalDays) {
      offset = 7 - weekStart;
    }
    return offset;
  }

  static #computeWeek(offset: number, day: number): number {
    return Math.trunc((7 + offset + (day - 1)) / 7);
  }

  #localizedWeekOfYear(date: LocalDate): number {
    const dow = this.#localizedDayOfWeek(date);
    const doy = date.getDayOfYear();
    const offset = this.#startOfWeekOffset(doy, dow);
    return WeekFields.#computeWeek(offset, doy);
  }

  #localizedWeekBasedYear(date: LocalDate): number {
    const dow = this.#localizedDayOfWeek(date);
    const year = date.getYear();
    const doy = date.getDayOfYear();
    const offset = this.#startOfWeekOffset(doy, dow);
    const week = WeekFields.#computeWeek(offset, doy);
    if (week === 0) {
      return year - 1;
    }
    const yearLen = date.lengthOfYear();
    const newYearWeek = WeekFields.#computeWeek(offset, yearLen + this.#minimalDays);
    return week >= newYearWeek ? year + 1 : year;
  }

  #localizedWeekOfWeekBasedYear(date: LocalDate): number {
    const dow = this.#localizedDayOfWeek(date);
    const doy = date.getDayOfYear();
    const offset = this.#startOfWeekOffset(doy, dow);
    let week = WeekFields.#computeWeek(offset, doy);
    if (week === 0) {
      // Day is in the end of the previous year's last week: back down into it.
      return this.#localizedWeekOfWeekBasedYear(date.minusDays(doy));
    }
    if (week > 50) {
      const yearLen = date.lengthOfYear();
      const newYearWeek = WeekFields.#computeWeek(offset, yearLen + this.#minimalDays);
      if (week >= newYearWeek) {
        week = week - newYearWeek + 1;
      }
    }
    return week;
  }
}
