/**
 * `java.time.LocalTime` -- a time of day held as nanosecond-of-day (0 ..
 * 86_399_999_999_999, < 2^53). Gantt calls `of(h,m[,s])`, `MIDNIGHT`, `MAX`,
 * `isBefore`, `equals`, `toString`, used as a `TreeMap` key
 * (`ngm/math/PiecewiseConstantHours.java:52`, hence `compareTo`/`hashCode`).
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalTime.html
 */
import { checkValid, NANOS_PER_DAY, NANOS_PER_SECOND, SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from './time-math.js';

const NANOS_PER_MINUTE = SECONDS_PER_MINUTE * NANOS_PER_SECOND;
const NANOS_PER_HOUR = SECONDS_PER_HOUR * NANOS_PER_SECOND;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export class LocalTime {
  /** `LocalTime.MIDNIGHT` / `LocalTime.MIN` (00:00). */
  public static readonly MIDNIGHT: LocalTime = new LocalTime(0);
  /** `LocalTime.MIN` -- identical to MIDNIGHT (LocalTime.java `MIN = HOURS[0]`). */
  public static readonly MIN: LocalTime = LocalTime.MIDNIGHT;
  /** `LocalTime.MAX` (23:59:59.999999999). */
  public static readonly MAX: LocalTime = new LocalTime(NANOS_PER_DAY - 1);

  readonly #nanoOfDay: number;

  private constructor(nanoOfDay: number) {
    this.#nanoOfDay = nanoOfDay;
  }

  /**
   * `LocalTime.of(int hour, int minute)` / `of(hour, minute, second)` /
   * `of(hour, minute, second, nano)`; each field range-checked as
   * `ChronoField.checkValidValue` does.
   */
  public static of(hour: number, minute: number, second = 0, nanoOfSecond = 0): LocalTime {
    checkValid('HourOfDay', hour, 0, 23);
    checkValid('MinuteOfHour', minute, 0, 59);
    checkValid('SecondOfMinute', second, 0, 59);
    checkValid('NanoOfSecond', nanoOfSecond, 0, 999_999_999);
    return new LocalTime(hour * NANOS_PER_HOUR + minute * NANOS_PER_MINUTE + second * NANOS_PER_SECOND + nanoOfSecond);
  }

  /** `LocalTime.ofNanoOfDay(long)`. */
  public static ofNanoOfDay(nanoOfDay: number): LocalTime {
    checkValid('NanoOfDay', nanoOfDay, 0, NANOS_PER_DAY - 1);
    return new LocalTime(nanoOfDay);
  }

  public getHour(): number {
    return Math.floor(this.#nanoOfDay / NANOS_PER_HOUR);
  }

  public getMinute(): number {
    return Math.floor(this.#nanoOfDay / NANOS_PER_MINUTE) % 60;
  }

  public getSecond(): number {
    return Math.floor(this.#nanoOfDay / NANOS_PER_SECOND) % 60;
  }

  public getNano(): number {
    return this.#nanoOfDay % NANOS_PER_SECOND;
  }

  /** `LocalTime#toNanoOfDay()`. */
  public toNanoOfDay(): number {
    return this.#nanoOfDay;
  }

  /** `LocalTime#toSecondOfDay()`. */
  public toSecondOfDay(): number {
    return Math.floor(this.#nanoOfDay / NANOS_PER_SECOND);
  }

  public isBefore(other: LocalTime): boolean {
    return this.compareTo(other) < 0;
  }

  public isAfter(other: LocalTime): boolean {
    return this.compareTo(other) > 0;
  }

  /** `LocalTime#compareTo` -- hour, minute, second, nano order = nano-of-day order; returns the sign-preserving difference. */
  public compareTo(other: LocalTime): number {
    return Math.sign(this.#nanoOfDay - other.#nanoOfDay);
  }

  public equals(other: unknown): boolean {
    return other instanceof LocalTime && other.#nanoOfDay === this.#nanoOfDay;
  }

  /** `LocalTime#hashCode()` = `Long.hashCode(toNanoOfDay())`. */
  public hashCode(): number {
    const n = BigInt(this.#nanoOfDay);
    return Number(BigInt.asIntN(32, n ^ (n >> 32n)));
  }

  /**
   * `LocalTime#toString()`: `HH:mm`, then `:ss` when second or nano is non-zero,
   * then 3, 6 or 9 fraction digits.
   *
   * @see https://github.com/openjdk/jdk/blob/jdk-21+35/src/java.base/share/classes/java/time/LocalTime.java (toString)
   */
  public toString(): string {
    let out = `${pad2(this.getHour())}:${pad2(this.getMinute())}`;
    const second = this.getSecond();
    const nano = this.getNano();
    if (second > 0 || nano > 0) {
      out += `:${pad2(second)}`;
      if (nano > 0) {
        if (nano % 1_000_000 === 0) out += `.${String(nano / 1_000_000 + 1000).slice(1)}`;
        else if (nano % 1000 === 0) out += `.${String(nano / 1000 + 1_000_000).slice(1)}`;
        else out += `.${String(nano + 1_000_000_000).slice(1)}`;
      }
    }
    return out;
  }
}
