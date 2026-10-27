/**
 * `java.time.ZoneOffset`, fixed offsets only. Gantt uses just `ZoneOffset.UTC`
 * (`time/TimePoint.java:50,86,88,134`). IANA zones are NOT here: zone -> offset
 * conversion lives in `src/core/clock.ts` (journal row 7), which passes the
 * resulting integer to `ofTotalSeconds`.
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/ZoneOffset.html
 */
import { DateTimeException } from './DateTimeException.js';

const MAX_SECONDS = 18 * 3600;

export class ZoneOffset {
  /** `ZoneOffset.UTC`. */
  public static readonly UTC: ZoneOffset = new ZoneOffset(0);

  readonly #totalSeconds: number;

  private constructor(totalSeconds: number) {
    this.#totalSeconds = totalSeconds;
  }

  /** `ZoneOffset.ofTotalSeconds(int)`; range +-18:00 (ZoneOffset.java `ofTotalSeconds`). */
  public static ofTotalSeconds(totalSeconds: number): ZoneOffset {
    if (!Number.isInteger(totalSeconds) || Math.abs(totalSeconds) > MAX_SECONDS) {
      throw new DateTimeException(`Zone offset not in valid range: -18:00 to +18:00`);
    }
    return totalSeconds === 0 ? ZoneOffset.UTC : new ZoneOffset(totalSeconds);
  }

  public getTotalSeconds(): number {
    return this.#totalSeconds;
  }

  public equals(other: unknown): boolean {
    return other instanceof ZoneOffset && other.#totalSeconds === this.#totalSeconds;
  }
}
