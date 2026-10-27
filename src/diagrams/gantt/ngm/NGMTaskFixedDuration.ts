/**
 * A fixed-duration task: the calendar span is intrinsic, the effort derived.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedDuration.java:56
 */

import type { Duration } from '../../../core/time/Duration.js';
import type { LocalDateTime } from '../../../core/time/LocalDateTime.js';
import type { Load } from './Load.js';
import type { NGMAllocation } from './NGMAllocation.js';
import { NGMTaskBase } from './NGMTaskBase.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedDuration.java:56 */
export class NGMTaskFixedDuration extends NGMTaskBase {
  readonly #duration: Duration;
  /** Unset until `setStart`/`setEnd` (Java `null`, :51). */
  #start: LocalDateTime | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedDuration.java:67 */
  public constructor(workload: NGMAllocation, duration: Duration) {
    super(workload);
    this.#duration = duration;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedDuration.java:73 (returns the possibly-null field) */
  public getStart(): LocalDateTime {
    return this.#start as LocalDateTime;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedDuration.java:78 */
  public setStart(start: LocalDateTime): void {
    this.#start = start;
  }

  /**
   * @throws Error NullPointerException when no start was set (:75 `start.plus`)
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedDuration.java:83
   */
  public getEnd(): LocalDateTime {
    if (this.#start === undefined) throw new Error('NullPointerException: start is not set');
    return this.#start.plus(this.#duration);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedDuration.java:88 */
  public setEnd(end: LocalDateTime): void {
    this.#start = end.minus(this.#duration);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedDuration.java:93 */
  public getDuration(): Duration {
    return this.#duration;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedDuration.java:98 */
  public getTotalEffort(): Load {
    throw new Error('UnsupportedOperationException: Work In Progress');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedDuration.java:103 */
  public setEffort(_effort: Load): void {
    throw new Error('UnsupportedOperationException: Work In Progress');
  }
}
