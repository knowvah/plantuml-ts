import { Duration } from '../../../core/time/Duration.js';
import { LocalTime } from '../../../core/time/LocalTime.js';

/** `Integer.MIN_VALUE` / `Integer.MAX_VALUE`: `Integer.parseInt` rejects anything outside. */
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

/**
 * TimeRange -- a half-open [start, end) working-hours interval.
 * A bound that fails to parse is `null` upstream (the `parse` catch).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRange.java:40-92
 */
export class TimeRange {
  readonly #start: LocalTime | null;
  readonly #end: LocalTime | null;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRange.java:45-47 (`String` form) and :49-52 (`LocalTime` form) */
  public constructor(start: string | LocalTime | null, end: string | LocalTime | null) {
    this.#start = typeof start === 'string' ? parse(start) : start;
    this.#end = typeof end === 'string' ? parse(end) : end;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRange.java:66-68 */
  public getStart(): LocalTime | null {
    return this.#start;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRange.java:70-72 */
  public getEnd(): LocalTime | null {
    return this.#end;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRange.java:74-78 */
  public contains(time: LocalTime | null): boolean {
    if (time === null) return false;
    return !time.isBefore(nonNull(this.#start)) && time.isBefore(nonNull(this.#end));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRange.java:80-83 (a null bound prints as `null`) */
  public toString(): string {
    return `${String(this.#start)}-${String(this.#end)}`;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRange.java:85-87 */
  public getDuration(): Duration {
    return Duration.between(nonNull(this.getStart()), nonNull(this.getEnd()));
  }
}

/** A Java dereference of a null bound: `NullPointerException`. */
function nonNull(time: LocalTime | null): LocalTime {
  if (time === null) throw new Error('NullPointerException');
  return time;
}

/** `Integer.parseInt(s.trim())`: `null` where it throws `NumberFormatException`. */
function parseInt32(s: string): number | null {
  const trimmed = s.replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '');
  if (!/^[+-]?[0-9]+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return n >= INT_MIN && n <= INT_MAX ? n : null;
}

/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRange.java:54-64 -- no ':' is an `IllegalArgumentException`
 * (outside the try); a bad number or out-of-range field is swallowed to `null`.
 */
function parse(time: string): LocalTime | null {
  const index = time.indexOf(':');
  if (index === -1) throw new Error(`IllegalArgumentException: Invalid time: ${time}`);

  const hour = parseInt32(time.substring(0, index));
  const minute = parseInt32(time.substring(index + 1));
  if (hour === null || minute === null) return null;
  try {
    return LocalTime.of(hour, minute);
  } catch {
    // Java: catch (Exception e) { return null; } -- DateTimeException for an out-of-range field.
    return null;
  }
}
