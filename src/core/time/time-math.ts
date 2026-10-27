/**
 * time-math.ts -- the `Math.floorDiv` / `Math.floorMod` pair and the range
 * check shared by the `java.time` subset (D2). Internal to `src/core/time`.
 *
 * Long maths follow decision D5: Java `long` is a JS `number`; every value the
 * subset produces for years 1-9999 is far below 2^53. The only exceptions are
 * the `LocalDateTime.MIN/MAX` sentinels, whose epoch-second span (about 6e16)
 * exceeds 2^53 -- `Duration` documents that at its `between` site.
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html#floorDiv(long,long)
 */

import { DateTimeException } from './DateTimeException.js';

export const SECONDS_PER_DAY = 86400;
export const NANOS_PER_SECOND = 1_000_000_000;
export const NANOS_PER_DAY = SECONDS_PER_DAY * NANOS_PER_SECOND;
export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_MINUTE = 60;
export const MILLIS_PER_SECOND = 1000;
export const NANOS_PER_MILLI = 1_000_000;

/** `Math.floorDiv(x, y)` (java.lang.Math). */
export function floorDiv(x: number, y: number): number {
  return Math.floor(x / y);
}

/** `Math.floorMod(x, y)` (java.lang.Math); result has the sign of `y`. */
export function floorMod(x: number, y: number): number {
  return x - Math.floor(x / y) * y;
}

/**
 * `ChronoField.checkValidValue` (java.time.temporal.ValueRange#checkValidValue):
 * throws `DateTimeException` "Invalid value for <name> (valid values <min> -
 * <max>): <value>".
 *
 * @see https://github.com/openjdk/jdk/blob/jdk-21+35/src/java.base/share/classes/java/time/temporal/ValueRange.java#L303
 */
export function checkValid(name: string, value: number, min: number, max: number, maxText?: string): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new DateTimeException(`Invalid value for ${name} (valid values ${min} - ${maxText ?? max}): ${value}`);
  }
  return value;
}
