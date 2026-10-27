/**
 * A fixed-total-effort task: the effort is intrinsic, the end derived by
 * integrating the allocation's load function.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedTotalEffort.java:8
 */

import { Duration } from '../../../core/time/Duration.js';
import type { LocalDateTime } from '../../../core/time/LocalDateTime.js';
import type { Load } from './Load.js';
import { LoadIntegrator } from './math/LoadIntegrator.js';
import type { NGMAllocation } from './NGMAllocation.js';
import { NGMTaskBase } from './NGMTaskBase.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedTotalEffort.java:8 */
export class NGMTaskFixedTotalEffort extends NGMTaskBase {
  #totalEffort: Load;
  #start: LocalDateTime;
  #end: LocalDateTime;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedTotalEffort.java:14 */
  public constructor(allocation: NGMAllocation, start: LocalDateTime, totalEffort: Load) {
    super(allocation);
    this.#totalEffort = totalEffort;
    this.#start = start;
    this.#end = new LoadIntegrator(allocation.getLoadFunction(), totalEffort).computeEnd(start);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedTotalEffort.java:22 */
  public getStart(): LocalDateTime {
    return this.#start;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedTotalEffort.java:27 */
  public setStart(start: LocalDateTime): void {
    this.#start = start;
    this.#end = new LoadIntegrator(this.allocation.getLoadFunction(), this.#totalEffort).computeEnd(start);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedTotalEffort.java:33 */
  public getEnd(): LocalDateTime {
    return this.#end;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedTotalEffort.java:8 */
  public setEnd(end: LocalDateTime): void {
    this.#end = end;
    this.#start = new LoadIntegrator(this.allocation.getLoadFunction(), this.#totalEffort).computeStart(end);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedTotalEffort.java:44 */
  public setEffort(effort: Load): void {
    this.#totalEffort = effort;
    this.#end = new LoadIntegrator(this.allocation.getLoadFunction(), this.#totalEffort).computeEnd(this.#start);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedTotalEffort.java:50 */
  public getDuration(): Duration {
    return Duration.between(this.#start, this.#end);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedTotalEffort.java:55 */
  public getTotalEffort(): Load {
    return this.#totalEffort;
  }
}
