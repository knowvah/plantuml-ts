/**
 * `java.time.Duration` -- seconds (number) + nano adjustment (0..999_999_999).
 * Gantt calls `ZERO`, `ofDays`, `ofHours`, `between`, `plus`, `minus`,
 * `plusHours`, `plusMinutes`, `plusSeconds`, `multipliedBy`, `isNegative`,
 * `getSeconds`, `toMillis`, `equals`, `toString`.
 *
 * D5 (long maths): `getSeconds()` is a `number`. Real gantt spans stay far
 * below 2^53 s; only `Duration.between(LocalDateTime.MIN, LocalDateTime.MAX)`
 * (about 6.3e16 s, the `PiecewiseConstantTimeWindow` sentinels,
 * `ngm/math/LoadIntegrator.java:109`) exceeds it and loses its low bits --
 * the JDK keeps them in a `long`. Segments that reach a sentinel are clamped
 * by `Fraction` long maths first (`ngm/math/Fraction.java:66-67`).
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Duration.html
 * @see https://github.com/openjdk/jdk/blob/jdk-21+35/src/java.base/share/classes/java/time/Duration.java
 */
import { LocalDateTime } from './LocalDateTime.js';
import type { LocalTime } from './LocalTime.js';
import {
  floorDiv,
  floorMod,
  NANOS_PER_MILLI,
  NANOS_PER_SECOND,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
} from './time-math.js';

export class Duration {
  /** `Duration.ZERO`. */
  public static readonly ZERO: Duration = new Duration(0, 0);

  readonly #seconds: number;
  readonly #nanos: number;

  private constructor(seconds: number, nanos: number) {
    this.#seconds = seconds;
    this.#nanos = nanos;
  }

  /** `Duration.ofSeconds(long, long nanoAdjustment)`. */
  public static ofSeconds(seconds: number, nanoAdjustment = 0): Duration {
    const secs = seconds + floorDiv(nanoAdjustment, NANOS_PER_SECOND);
    const nos = floorMod(nanoAdjustment, NANOS_PER_SECOND);
    return secs === 0 && nos === 0 ? Duration.ZERO : new Duration(secs, nos);
  }

  public static ofDays(days: number): Duration {
    return Duration.ofSeconds(days * SECONDS_PER_DAY);
  }

  public static ofHours(hours: number): Duration {
    return Duration.ofSeconds(hours * SECONDS_PER_HOUR);
  }

  /**
   * `Duration.between(Temporal, Temporal)` for two `LocalTime`s or two
   * `LocalDateTime`s: the exact signed difference (the JDK's NANOS fast path
   * and its seconds fallback give the same value).
   */
  public static between(start: LocalTime, end: LocalTime): Duration;
  public static between(start: LocalDateTime, end: LocalDateTime): Duration;
  public static between(start: LocalTime | LocalDateTime, end: LocalTime | LocalDateTime): Duration {
    if (start instanceof LocalDateTime) {
      const e = end as LocalDateTime;
      const days = e.toLocalDate().toEpochDay() - start.toLocalDate().toEpochDay();
      const nanoDiff = e.toLocalTime().toNanoOfDay() - start.toLocalTime().toNanoOfDay();
      return Duration.ofSeconds(days * SECONDS_PER_DAY, nanoDiff);
    }
    return Duration.ofSeconds(0, (end as LocalTime).toNanoOfDay() - start.toNanoOfDay());
  }

  public getSeconds(): number {
    return this.#seconds;
  }

  public getNano(): number {
    return this.#nanos;
  }

  public isNegative(): boolean {
    return this.#seconds < 0;
  }

  public isZero(): boolean {
    return this.#seconds === 0 && this.#nanos === 0;
  }

  public plus(other: Duration): Duration {
    return Duration.ofSeconds(this.#seconds + other.#seconds, this.#nanos + other.#nanos);
  }

  public minus(other: Duration): Duration {
    return Duration.ofSeconds(this.#seconds - other.#seconds, this.#nanos - other.#nanos);
  }

  public negated(): Duration {
    return this.multipliedBy(-1);
  }

  public plusHours(hours: number): Duration {
    return Duration.ofSeconds(this.#seconds + hours * SECONDS_PER_HOUR, this.#nanos);
  }

  public plusMinutes(minutes: number): Duration {
    return Duration.ofSeconds(this.#seconds + minutes * SECONDS_PER_MINUTE, this.#nanos);
  }

  public plusSeconds(seconds: number): Duration {
    return Duration.ofSeconds(this.#seconds + seconds, this.#nanos);
  }

  /** `Duration#multipliedBy(long)`. */
  public multipliedBy(multiplicand: number): Duration {
    return Duration.ofSeconds(this.#seconds * multiplicand, this.#nanos * multiplicand);
  }

  /** `Duration#toMillis()` (floor of the total, as the JDK's negative branch yields). */
  public toMillis(): number {
    return this.#seconds * 1000 + Math.floor(this.#nanos / NANOS_PER_MILLI);
  }

  public equals(other: unknown): boolean {
    return other instanceof Duration && other.#seconds === this.#seconds && other.#nanos === this.#nanos;
  }

  /** `Duration#hashCode()` = `((int)(seconds ^ (seconds >>> 32))) + (51 * nanos)`. */
  public hashCode(): number {
    const s = BigInt.asUintN(64, BigInt(this.#seconds));
    return (Number(BigInt.asIntN(32, s ^ (s >> 32n))) + 51 * this.#nanos) | 0;
  }

  /**
   * `Duration#toString()` -- ISO-8601 `PT8H6M12.345S`.
   *
   * @see https://github.com/openjdk/jdk/blob/jdk-21+35/src/java.base/share/classes/java/time/Duration.java (toString)
   */
  public toString(): string {
    if (this.isZero()) return 'PT0S';
    const seconds = this.#seconds;
    const nanos = this.#nanos;
    const effectiveTotalSecs = seconds < 0 && nanos > 0 ? seconds + 1 : seconds;
    const hours = Math.trunc(effectiveTotalSecs / SECONDS_PER_HOUR);
    const minutes = Math.trunc((effectiveTotalSecs % SECONDS_PER_HOUR) / 60);
    const secs = effectiveTotalSecs % 60;
    let buf = 'PT';
    if (hours !== 0) buf += `${hours}H`;
    if (minutes !== 0) buf += `${minutes}M`;
    if (secs === 0 && nanos === 0 && buf.length > 2) return buf;
    buf += seconds < 0 && nanos > 0 && secs === 0 ? '-0' : `${secs}`;
    if (nanos > 0) {
      const frac = String(seconds < 0 ? 2 * NANOS_PER_SECOND - nanos : nanos + NANOS_PER_SECOND).replace(/0+$/, '');
      buf += `.${frac.slice(1)}`;
    }
    return `${buf}S`;
  }
}
