/**
 * The abstract task contract of the New Gantt Model. Split from {@link NGMTask}
 * (ESM cycle break): upstream's `NGMTask` both declares the abstract members
 * and the static factories that construct its own subclasses; in ESM a
 * subclass module cannot `extends` a class whose module imports it back.
 * `NGMTask` (NGMTask.ts) extends this class and carries the factories.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:117
 */

import type { Duration } from '../../../core/time/Duration.js';
import type { LocalDateTime } from '../../../core/time/LocalDateTime.js';
import type { Load } from './Load.js';
import type { NGMAllocation } from './NGMAllocation.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:117 */
export abstract class NGMTaskBase {
  protected readonly allocation: NGMAllocation;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:125 */
  protected constructor(allocation: NGMAllocation) {
    this.allocation = allocation;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:140 */
  public abstract getStart(): LocalDateTime;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:164 */
  public abstract setStart(start: LocalDateTime): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:177 */
  public abstract getEnd(): LocalDateTime;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:201 */
  public abstract setEnd(end: LocalDateTime): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:231 */
  public abstract getDuration(): Duration;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:233 */
  public abstract setEffort(effort: Load): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:264 */
  public abstract getTotalEffort(): Load;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:295 */
  public getAllocation(): NGMAllocation {
    return this.allocation;
  }
}
