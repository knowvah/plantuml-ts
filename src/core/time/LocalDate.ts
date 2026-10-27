/**
 * `java.time.LocalDate` -- proleptic Gregorian (ISO) date, epoch-day based.
 * Gantt calls `of(y,m|Month,d)`, `plusDays`, `minusDays`, `getYear`,
 * `getMonth`, `getDayOfMonth`, `getDayOfWeek`, `atStartOfDay`, `isBefore`,
 * `isAfter`, `compareTo`, `equals`, `hashCode` (HashMap/HashSet keys:
 * `OpenClose.java:59`, `data/DayCalendarData.java:66`), `get(weekOfYear)`
 * (`time/TimePoint.java:105`) and `toEpochDay`. `LocalDate.now()` reads the
 * clock and is NOT here: use `src/core/clock.ts`.
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDate.html
 * @see https://github.com/openjdk/jdk/blob/jdk-21+35/src/java.base/share/classes/java/time/LocalDate.java
 */
import { DateTimeException } from './DateTimeException.js';
import { DayOfWeek } from './DayOfWeek.js';
import { LocalDateTime } from './LocalDateTime.js';
import { LocalTime } from './LocalTime.js';
import { Month } from './Month.js';
import type { TemporalField } from './TemporalField.js';
import { checkValid, floorMod } from './time-math.js';

const MIN_YEAR = -999_999_999;
const MAX_YEAR = 999_999_999;
/** LocalDate.java `DAYS_PER_CYCLE`: days in a 400-year Gregorian cycle. */
const DAYS_PER_CYCLE = 146097;
/** LocalDate.java `DAYS_0000_TO_1970`. */
const DAYS_0000_TO_1970 = DAYS_PER_CYCLE * 5 - (30 * 365 + 7);
/** `ChronoField.EPOCH_DAY` range of the ISO chronology (LocalDate.MIN/MAX). */
const MIN_EPOCH_DAY = -365_243_219_162;
const MAX_EPOCH_DAY = 365_241_780_471;
/** Cumulative days before each month in a non-leap year. */
const CUMULATIVE_DAYS: readonly number[] = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function isLeap(year: number): boolean {
  return (year & 3) === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export class LocalDate {
  readonly #year: number;
  readonly #month: number;
  readonly #day: number;

  private constructor(year: number, month: number, day: number) {
    this.#year = year;
    this.#month = month;
    this.#day = day;
  }

  /**
   * `LocalDate.of(int year, int month, int dayOfMonth)` and
   * `LocalDate.of(int year, Month month, int dayOfMonth)`. Invalid values throw
   * `DateTimeException` with the JDK's messages (LocalDate.java `create`).
   */
  public static of(year: number, month: number | Month, dayOfMonth: number): LocalDate {
    const monthValue = typeof month === 'number' ? month : month.getValue();
    checkValid('Year', year, MIN_YEAR, MAX_YEAR);
    checkValid('MonthOfYear', monthValue, 1, 12);
    checkValid('DayOfMonth', dayOfMonth, 1, 31, '28/31');
    return LocalDate.#create(year, monthValue, dayOfMonth);
  }

  static #create(year: number, month: number, dayOfMonth: number): LocalDate {
    if (dayOfMonth > 28) {
      const dom = Month.of(month).length(isLeap(year));
      if (dayOfMonth > dom) {
        if (dayOfMonth === 29) {
          throw new DateTimeException(`Invalid date 'February 29' as '${year}' is not a leap year`);
        }
        throw new DateTimeException(`Invalid date '${Month.of(month).name()} ${dayOfMonth}'`);
      }
    }
    return new LocalDate(year, month, dayOfMonth);
  }

  /**
   * `LocalDate.ofEpochDay(long)`.
   *
   * @see https://github.com/openjdk/jdk/blob/jdk-21+35/src/java.base/share/classes/java/time/LocalDate.java (ofEpochDay)
   */
  public static ofEpochDay(epochDay: number): LocalDate {
    checkValid('EpochDay', epochDay, MIN_EPOCH_DAY, MAX_EPOCH_DAY);
    let zeroDay = epochDay + DAYS_0000_TO_1970;
    zeroDay -= 60; // adjust to 0000-03-01 so leap day is at end of four year cycle
    let adjust = 0;
    if (zeroDay < 0) {
      const adjustCycles = Math.trunc((zeroDay + 1) / DAYS_PER_CYCLE) - 1;
      adjust = adjustCycles * 400;
      zeroDay += -adjustCycles * DAYS_PER_CYCLE;
    }
    let yearEst = Math.trunc((400 * zeroDay + 591) / DAYS_PER_CYCLE);
    let doyEst =
      zeroDay - (365 * yearEst + Math.trunc(yearEst / 4) - Math.trunc(yearEst / 100) + Math.trunc(yearEst / 400));
    if (doyEst < 0) {
      yearEst--;
      doyEst =
        zeroDay - (365 * yearEst + Math.trunc(yearEst / 4) - Math.trunc(yearEst / 100) + Math.trunc(yearEst / 400));
    }
    yearEst += adjust;
    const marchDoy0 = doyEst;
    const marchMonth0 = Math.trunc((marchDoy0 * 5 + 2) / 153);
    const month = ((marchMonth0 + 2) % 12) + 1;
    const dom = marchDoy0 - Math.trunc((marchMonth0 * 306 + 5) / 10) + 1;
    yearEst += Math.trunc(marchMonth0 / 10);
    return new LocalDate(yearEst, month, dom);
  }

  /**
   * `LocalDate#toEpochDay()`.
   *
   * @see https://github.com/openjdk/jdk/blob/jdk-21+35/src/java.base/share/classes/java/time/LocalDate.java (toEpochDay)
   */
  public toEpochDay(): number {
    const y = this.#year;
    const m = this.#month;
    let total = 365 * y;
    if (y >= 0) {
      total += Math.trunc((y + 3) / 4) - Math.trunc((y + 99) / 100) + Math.trunc((y + 399) / 400);
    } else {
      total -= Math.trunc(y / -4) - Math.trunc(y / -100) + Math.trunc(y / -400);
    }
    total += Math.trunc((367 * m - 362) / 12);
    total += this.#day - 1;
    if (m > 2) {
      total--;
      if (!isLeap(y)) total--;
    }
    return total - DAYS_0000_TO_1970;
  }

  public getYear(): number {
    return this.#year;
  }

  public getMonthValue(): number {
    return this.#month;
  }

  public getMonth(): Month {
    return Month.of(this.#month);
  }

  public getDayOfMonth(): number {
    return this.#day;
  }

  /** `LocalDate#getDayOfYear()`. */
  public getDayOfYear(): number {
    return CUMULATIVE_DAYS[this.#month - 1]! + (this.#month > 2 && isLeap(this.#year) ? 1 : 0) + this.#day;
  }

  /** `LocalDate#getDayOfWeek()` = `DayOfWeek.of(floorMod(toEpochDay() + 3, 7) + 1)`. */
  public getDayOfWeek(): DayOfWeek {
    return DayOfWeek.of(floorMod(this.toEpochDay() + 3, 7) + 1);
  }

  /** `LocalDate#isLeapYear()`. */
  public isLeapYear(): boolean {
    return isLeap(this.#year);
  }

  /** `LocalDate#lengthOfYear()`. */
  public lengthOfYear(): number {
    return isLeap(this.#year) ? 366 : 365;
  }

  /** `LocalDate#plusDays(long)`. */
  public plusDays(daysToAdd: number): LocalDate {
    return daysToAdd === 0 ? this : LocalDate.ofEpochDay(this.toEpochDay() + daysToAdd);
  }

  /** `LocalDate#minusDays(long)`. */
  public minusDays(daysToSubtract: number): LocalDate {
    return this.plusDays(-daysToSubtract);
  }

  /** `LocalDate#atStartOfDay()`. */
  public atStartOfDay(): LocalDateTime {
    return LocalDateTime.of(this, LocalTime.MIDNIGHT);
  }

  /** `LocalDate#get(TemporalField)` (gantt passes `WeekFields#weekOfYear()`). */
  public get(field: TemporalField): number {
    return field.getFrom(this);
  }

  public isBefore(other: LocalDate): boolean {
    return this.compareTo(other) < 0;
  }

  public isAfter(other: LocalDate): boolean {
    return this.compareTo(other) > 0;
  }

  /** `LocalDate#compareTo` -- year, then month, then day (the JDK returns the first non-zero difference). */
  public compareTo(other: LocalDate): number {
    let cmp = this.#year - other.#year;
    if (cmp === 0) {
      cmp = this.#month - other.#month;
      if (cmp === 0) cmp = this.#day - other.#day;
    }
    return cmp;
  }

  public equals(other: unknown): boolean {
    return other instanceof LocalDate && this.compareTo(other) === 0;
  }

  /**
   * `LocalDate#hashCode()` = `(year & 0xFFFFF800) ^ ((year << 11) + (month << 6) + day)`.
   * Needed for fidelity: `HashMap<LocalDate,_>` iteration order depends on it.
   */
  public hashCode(): number {
    const yearValue = this.#year;
    return (yearValue & 0xfffff800) ^ ((yearValue << 11) + (this.#month << 6) + this.#day);
  }

  /** `LocalDate#toString()` (`uuuu-MM-dd`, `+` prefix beyond year 9999). */
  public toString(): string {
    const absYear = Math.abs(this.#year);
    let y: string;
    if (absYear < 1000) {
      y = `${this.#year < 0 ? '-' : ''}${String(absYear + 10000).slice(1)}`;
    } else {
      y = `${this.#year > 9999 ? '+' : ''}${this.#year}`;
    }
    return `${y}-${pad2(this.#month)}-${pad2(this.#day)}`;
  }
}
