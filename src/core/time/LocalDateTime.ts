/**
 * `java.time.LocalDateTime` -- a `LocalDate` plus a `LocalTime`; no zone.
 * Gantt calls `of(...)`, `ofInstant`, `plusDays`, `plusSeconds`,
 * `minusSeconds`, `plus(Duration)`, `minus(Duration)`, `with(LocalTime)`,
 * `toLocalDate`, `toLocalTime`, `getHour/Minute/Second`, `getMonth`,
 * `getDayOfWeek`, `getDayOfMonth`, `toInstant`, `isBefore`, `isAfter`,
 * `compareTo`, `equals`, `hashCode`, `toString`, `MIN` and `MAX`.
 * `LocalDateTime.now(zone)` reads the clock and is NOT here: use
 * `src/core/clock.ts`.
 *
 * `MIN` / `MAX` are lazy getters: `LocalDate` and `LocalDateTime` import each
 * other, so a static field initialised at module load could hit the other
 * module's temporal dead zone.
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDateTime.html
 * @see https://github.com/openjdk/jdk/blob/jdk-21+35/src/java.base/share/classes/java/time/LocalDateTime.java
 */
import type { Duration } from './Duration.js';
import type { DayOfWeek } from './DayOfWeek.js';
import { Instant } from './Instant.js';
import { LocalDate } from './LocalDate.js';
import { LocalTime } from './LocalTime.js';
import type { Month } from './Month.js';
import { floorDiv, floorMod, NANOS_PER_DAY, NANOS_PER_SECOND, SECONDS_PER_DAY } from './time-math.js';
import type { ZoneOffset } from './ZoneOffset.js';

let cachedMin: LocalDateTime | undefined;
let cachedMax: LocalDateTime | undefined;

export class LocalDateTime {
  readonly #date: LocalDate;
  readonly #time: LocalTime;

  private constructor(date: LocalDate, time: LocalTime) {
    this.#date = date;
    this.#time = time;
  }

  /** `LocalDateTime.MIN` = `-999999999-01-01T00:00:00`. */
  public static get MIN(): LocalDateTime {
    cachedMin ??= new LocalDateTime(LocalDate.of(-999_999_999, 1, 1), LocalTime.MIN);
    return cachedMin;
  }

  /** `LocalDateTime.MAX` = `+999999999-12-31T23:59:59.999999999`. */
  public static get MAX(): LocalDateTime {
    cachedMax ??= new LocalDateTime(LocalDate.of(999_999_999, 12, 31), LocalTime.MAX);
    return cachedMax;
  }

  /**
   * `LocalDateTime.of(LocalDate, LocalTime)` or
   * `of(int year, int|Month month, int day, int hour, int minute[, second[, nano]])`.
   */
  public static of(date: LocalDate, time: LocalTime): LocalDateTime;
  public static of(
    year: number,
    month: number | Month,
    dayOfMonth: number,
    hour: number,
    minute: number,
    second?: number,
    nanoOfSecond?: number,
  ): LocalDateTime;
  public static of(
    a: LocalDate | number,
    b: LocalTime | number | Month,
    dayOfMonth?: number,
    hour?: number,
    minute?: number,
    second = 0,
    nanoOfSecond = 0,
  ): LocalDateTime {
    if (a instanceof LocalDate) return new LocalDateTime(a, b as LocalTime);
    return new LocalDateTime(
      LocalDate.of(a, b as number | Month, dayOfMonth as number),
      LocalTime.of(hour as number, minute as number, second, nanoOfSecond),
    );
  }

  /**
   * `LocalDateTime.ofEpochSecond(long epochSecond, int nanoOfSecond, ZoneOffset offset)`.
   *
   * @see https://github.com/openjdk/jdk/blob/jdk-21+35/src/java.base/share/classes/java/time/LocalDateTime.java (ofEpochSecond)
   */
  public static ofEpochSecond(epochSecond: number, nanoOfSecond: number, offsetSeconds: number): LocalDateTime {
    const localSecond = epochSecond + offsetSeconds;
    const localEpochDay = floorDiv(localSecond, SECONDS_PER_DAY);
    const secsOfDay = floorMod(localSecond, SECONDS_PER_DAY);
    const date = LocalDate.ofEpochDay(localEpochDay);
    const time = LocalTime.ofNanoOfDay(secsOfDay * NANOS_PER_SECOND + nanoOfSecond);
    return new LocalDateTime(date, time);
  }

  /** `LocalDateTime.ofInstant(Instant, ZoneId)` for a fixed `ZoneOffset`. */
  public static ofInstant(instant: Instant, offset: ZoneOffset): LocalDateTime {
    return LocalDateTime.ofEpochSecond(instant.getEpochSecond(), instant.getNano(), offset.getTotalSeconds());
  }

  public toLocalDate(): LocalDate {
    return this.#date;
  }

  public toLocalTime(): LocalTime {
    return this.#time;
  }

  public getYear(): number {
    return this.#date.getYear();
  }

  public getMonth(): Month {
    return this.#date.getMonth();
  }

  public getDayOfMonth(): number {
    return this.#date.getDayOfMonth();
  }

  public getDayOfWeek(): DayOfWeek {
    return this.#date.getDayOfWeek();
  }

  public getHour(): number {
    return this.#time.getHour();
  }

  public getMinute(): number {
    return this.#time.getMinute();
  }

  public getSecond(): number {
    return this.#time.getSecond();
  }

  /** `LocalDateTime#with(TemporalAdjuster)` where the adjuster is a `LocalTime` (`ngm/math/PiecewiseConstantHours.java:103`). */
  public with(time: LocalTime): LocalDateTime {
    return new LocalDateTime(this.#date, time);
  }

  public plusDays(days: number): LocalDateTime {
    return days === 0 ? this : new LocalDateTime(this.#date.plusDays(days), this.#time);
  }

  /** `LocalDateTime#plusSeconds(long)` (`plusWithOverflow`). */
  public plusSeconds(seconds: number): LocalDateTime {
    return this.#plusNanosOfDay(Math.trunc(seconds / SECONDS_PER_DAY), (seconds % SECONDS_PER_DAY) * NANOS_PER_SECOND);
  }

  public minusSeconds(seconds: number): LocalDateTime {
    return this.plusSeconds(-seconds);
  }

  /** `LocalDateTime#plus(TemporalAmount)` for a `Duration`. */
  public plus(duration: Duration): LocalDateTime {
    const seconds = duration.getSeconds();
    return this.#plusNanosOfDay(
      Math.trunc(seconds / SECONDS_PER_DAY),
      (seconds % SECONDS_PER_DAY) * NANOS_PER_SECOND + duration.getNano(),
    );
  }

  /** `LocalDateTime#minus(TemporalAmount)` for a `Duration`. */
  public minus(duration: Duration): LocalDateTime {
    return this.plus(duration.negated());
  }

  #plusNanosOfDay(days: number, nanos: number): LocalDateTime {
    const total = nanos + this.#time.toNanoOfDay();
    const totDays = days + floorDiv(total, NANOS_PER_DAY);
    const newNoD = floorMod(total, NANOS_PER_DAY);
    return new LocalDateTime(
      totDays === 0 ? this.#date : this.#date.plusDays(totDays),
      newNoD === this.#time.toNanoOfDay() ? this.#time : LocalTime.ofNanoOfDay(newNoD),
    );
  }

  /** `LocalDateTime#toEpochSecond(ZoneOffset)`. */
  public toEpochSecond(offset: ZoneOffset): number {
    return this.#date.toEpochDay() * SECONDS_PER_DAY + this.#time.toSecondOfDay() - offset.getTotalSeconds();
  }

  /** `LocalDateTime#toInstant(ZoneOffset)`. */
  public toInstant(offset: ZoneOffset): Instant {
    return Instant.ofEpochSecond(this.toEpochSecond(offset), this.#time.getNano());
  }

  public isBefore(other: LocalDateTime): boolean {
    return this.compareTo(other) < 0;
  }

  public isAfter(other: LocalDateTime): boolean {
    return this.compareTo(other) > 0;
  }

  /** `LocalDateTime#compareTo` -- date first, then time. */
  public compareTo(other: LocalDateTime): number {
    const cmp = this.#date.compareTo(other.#date);
    return cmp !== 0 ? cmp : this.#time.compareTo(other.#time);
  }

  public equals(other: unknown): boolean {
    return other instanceof LocalDateTime && this.compareTo(other) === 0;
  }

  /** `LocalDateTime#hashCode()` = `date.hashCode() ^ time.hashCode()`. */
  public hashCode(): number {
    return this.#date.hashCode() ^ this.#time.hashCode();
  }

  /** `LocalDateTime#toString()` = `date + 'T' + time`. */
  public toString(): string {
    return `${this.#date.toString()}T${this.#time.toString()}`;
  }
}
