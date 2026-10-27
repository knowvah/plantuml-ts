/**
 * `java.time.ZonedDateTime` restricted to a fixed `ZoneOffset`, and to the one
 * accessor gantt reads (`toLocalDate`, `time/TimePoint.java:50`).
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/ZonedDateTime.html
 */
import type { Instant } from './Instant.js';
import type { LocalDate } from './LocalDate.js';
import { LocalDateTime } from './LocalDateTime.js';
import type { ZoneOffset } from './ZoneOffset.js';

export class ZonedDateTime {
  readonly #dateTime: LocalDateTime;
  readonly #offset: ZoneOffset;

  private constructor(dateTime: LocalDateTime, offset: ZoneOffset) {
    this.#dateTime = dateTime;
    this.#offset = offset;
  }

  /** `ZonedDateTime.ofInstant(Instant, ZoneId)` for a fixed offset. */
  public static ofInstant(instant: Instant, offset: ZoneOffset): ZonedDateTime {
    return new ZonedDateTime(LocalDateTime.ofInstant(instant, offset), offset);
  }

  public toLocalDate(): LocalDate {
    return this.#dateTime.toLocalDate();
  }

  public toLocalDateTime(): LocalDateTime {
    return this.#dateTime;
  }

  public getOffset(): ZoneOffset {
    return this.#offset;
  }
}
