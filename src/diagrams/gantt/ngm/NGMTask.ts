/**
 * An abstract scheduled task in the New Gantt Model (NGM): total effort,
 * allocation and duration kept independent, with two concrete behaviours
 * (fixed duration, fixed total effort) built by the static factories.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:117
 */

import type { Duration } from '../../../core/time/Duration.js';
import type { LocalDateTime } from '../../../core/time/LocalDateTime.js';
import type { Load } from './Load.js';
import type { NGMAllocation } from './NGMAllocation.js';
import { NGMTaskBase } from './NGMTaskBase.js';
import { NGMTaskFixedDuration } from './NGMTaskFixedDuration.js';
import { NGMTaskFixedTotalEffort } from './NGMTaskFixedTotalEffort.js';

/**
 * Instance members are declared on {@link NGMTaskBase} (ESM cycle break, see
 * there); the concrete tasks extend the base, so they are not `instanceof
 * NGMTask` (no upstream caller tests it).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:117
 */
export abstract class NGMTask extends NGMTaskBase {
  /**
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:331 (`new NGMTaskFixedDuration(allocation, duration)`)
   */
  public static withFixedDuration(allocation: NGMAllocation, duration: Duration): NGMTaskBase {
    return new NGMTaskFixedDuration(allocation, duration);
  }

  /**
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:368 (`new NGMTaskFixedTotalEffort(allocation, start, totalEffort)`)
   */
  public static withFixedTotalEffort(allocation: NGMAllocation, start: LocalDateTime, totalEffort: Load): NGMTaskBase {
    return new NGMTaskFixedTotalEffort(allocation, start, totalEffort);
  }
}
