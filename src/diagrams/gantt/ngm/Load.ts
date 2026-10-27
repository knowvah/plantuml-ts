/**
 * Intrinsic amount of work for a task, in seconds of person-time.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/Load.java:66
 */

import { Duration } from '../../../core/time/Duration.js';
import type { PValue } from '../PValue.js';
import { Fraction } from './math/Fraction.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/Load.java:66 */
export class Load implements PValue {
  readonly #duration: Duration;

  /**
   * @throws Error "Effort cannot be negative: <duration>" (Java `IllegalArgumentException`)
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/Load.java:78
   */
  private constructor(duration: Duration) {
    if (duration.isNegative()) throw new Error(`Effort cannot be negative: ${duration.toString()}`);

    this.#duration = duration;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/Load.java:85 */
  public static of(duration: Duration): Load {
    return new Load(duration);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/Load.java:97 */
  public static zero(): Load {
    return new Load(Duration.ZERO);
  }

  /**
   * `duration.toMillis() / 1000L` -- LONG division truncating toward zero (D5).
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/Load.java:101
   */
  public toSeconds(): Fraction {
    return new Fraction(Math.trunc(this.#duration.toMillis() / 1000), 1);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/Load.java:106 */
  public equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof Load)) return false;
    return this.#duration.equals(obj.#duration);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/Load.java:116 */
  public toString(): string {
    return this.#duration.toString();
  }
}
