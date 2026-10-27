/**
 * Gantt's own millisecond instant (distinct from `java.time.Instant`, which is
 * `src/core/time/Instant.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/Instant.java:40
 */

import { DEFAULT_CLOCK } from '../../../core/clock.js';
import type { Clock } from '../../../core/clock.js';
import type { PValue } from '../PValue.js';

/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/Instant.java:40
 */
export class Instant implements PValue {
  readonly #ms: number;

  private constructor(ms: number) {
    this.#ms = ms;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/Instant.java:45 */
  public static create(ms: number): Instant {
    return new Instant(ms);
  }

  /**
   * `System.currentTimeMillis()` at `time/Instant.java:50`. DEVIATION (gep D3a):
   * the wall clock is the injected {@link Clock}, defaulting to
   * {@link DEFAULT_CLOCK} (instant 0), never an ambient global.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/Instant.java:49
   */
  public static today(clock: Clock = DEFAULT_CLOCK): Instant {
    return Instant.create(clock.nowMillis());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/Instant.java:57 */
  public getMillis(): number {
    return this.#ms;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/Instant.java:62 */
  public toString(): string {
    return `${this.#ms}`;
  }

  /**
   * `Long.valueOf(ms).hashCode()` = `(int)(v ^ (v >>> 32))` (`time/Instant.java:67-73`).
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/Instant.java:67
   */
  public hashCode(): number {
    const v = BigInt.asUintN(64, BigInt(this.#ms));
    return Number(BigInt.asIntN(32, v ^ (v >> 32n)));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/Instant.java:76 */
  public equals(other: Instant): boolean {
    return this.#ms === other.#ms;
  }

  /**
   * `Long#compareTo` (`time/Instant.java:81-83`): -1, 0 or 1.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/Instant.java:81
   */
  public compareTo(other: Instant): number {
    return this.#ms < other.#ms ? -1 : this.#ms > other.#ms ? 1 : 0;
  }
}
