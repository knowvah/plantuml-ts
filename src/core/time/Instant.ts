/**
 * `java.time.Instant` -- epoch seconds + nano adjustment. Gantt's only use is
 * `time/TimePoint.java:50` (`Instant.EPOCH.atZone(ZoneOffset.UTC)`),
 * `:86` (`Instant.ofEpochMilli`) and `:134` (`toEpochMilli`). NOT the gantt
 * class `net.sourceforge.plantuml.gantt.time.Instant`.
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Instant.html
 */
import { checkValid, floorDiv, floorMod, MILLIS_PER_SECOND, NANOS_PER_MILLI } from './time-math.js';
import type { ZoneOffset } from './ZoneOffset.js';
import { ZonedDateTime } from './ZonedDateTime.js';

export class Instant {
  /** `Instant.EPOCH` (1970-01-01T00:00:00Z). */
  public static readonly EPOCH: Instant = new Instant(0, 0);

  readonly #seconds: number;
  readonly #nanos: number;

  private constructor(seconds: number, nanos: number) {
    this.#seconds = seconds;
    this.#nanos = nanos;
  }

  /** `Instant.ofEpochSecond(long, long nanoAdjustment)`; the adjustment is normalised with floorDiv/floorMod. */
  public static ofEpochSecond(epochSecond: number, nanoAdjustment = 0): Instant {
    const secs = epochSecond + floorDiv(nanoAdjustment, 1_000_000_000);
    const nos = floorMod(nanoAdjustment, 1_000_000_000);
    return new Instant(secs, nos);
  }

  /** `Instant.ofEpochMilli(long)`. */
  public static ofEpochMilli(epochMilli: number): Instant {
    checkValid('EpochMilli', epochMilli, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    const secs = floorDiv(epochMilli, MILLIS_PER_SECOND);
    const mos = floorMod(epochMilli, MILLIS_PER_SECOND);
    return new Instant(secs, mos * NANOS_PER_MILLI);
  }

  public getEpochSecond(): number {
    return this.#seconds;
  }

  public getNano(): number {
    return this.#nanos;
  }

  /** `Instant#toEpochMilli()` = `seconds * 1000 + nanos / 1_000_000` (the JDK's negative-seconds branch is algebraically equal). */
  public toEpochMilli(): number {
    return this.#seconds * MILLIS_PER_SECOND + Math.floor(this.#nanos / NANOS_PER_MILLI);
  }

  /** `Instant#atZone(ZoneId)` for a fixed `ZoneOffset`. */
  public atZone(zone: ZoneOffset): ZonedDateTime {
    return ZonedDateTime.ofInstant(this, zone);
  }

  public equals(other: unknown): boolean {
    return other instanceof Instant && other.#seconds === this.#seconds && other.#nanos === this.#nanos;
  }

  public compareTo(other: Instant): number {
    const diff = this.#seconds - other.#seconds;
    return diff !== 0 ? Math.sign(diff) : this.#nanos - other.#nanos;
  }
}
