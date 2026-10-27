import type { PiecewiseConstant } from '../ngm/math/PiecewiseConstant.js';
import { PiecewiseConstantUtils } from '../ngm/math/PiecewiseConstantUtils.js';
import { GanttConstraintMode } from '../GanttConstraintMode.js';
import type { TimePoint } from '../time/TimePoint.js';
import { AbstractTask } from './AbstractTask.js';
import type { Moment } from './Moment.js';
import { TaskAttribute } from './TaskAttribute.js';

/**
 * TaskInstant -- the START or END of a `Moment`, shifted by a day delta (optionally skipping closed days).
 *
 * The private 5-argument Java constructor (java:56-65) is reached through the private static `#withState`;
 * the public constructor is the 2-argument one (java:51-54).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskInstant.java:43-131
 */
export class TaskInstant {
  readonly #task: Moment;
  readonly #attribute: TaskAttribute;
  #delta = 0;
  #mode: GanttConstraintMode = GanttConstraintMode.IGNORE_CALENDAR;
  #calendar: PiecewiseConstant | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskInstant.java:51-54 and :56-65 (attribute check) */
  constructor(task: Moment, attribute: TaskAttribute) {
    this.#task = task;
    this.#attribute = attribute;
    if (attribute !== TaskAttribute.START && attribute !== TaskAttribute.END)
      throw new Error('IllegalArgumentException');
  }

  static #withState(
    task: Moment,
    attribute: TaskAttribute,
    delta: number,
    mode: GanttConstraintMode,
    calendar: PiecewiseConstant | undefined,
  ): TaskInstant {
    const result = new TaskInstant(task, attribute);
    result.#delta = delta;
    result.#mode = mode;
    result.#calendar = calendar;
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskInstant.java:67-69 */
  public withDelta(newDelta: number, mode: GanttConstraintMode, calendar: PiecewiseConstant | undefined): TaskInstant {
    return TaskInstant.#withState(this.#task, this.#attribute, newDelta, mode, calendar);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskInstant.java:71-92 */
  #manageDelta(start: TimePoint): TimePoint {
    let value = start;
    if (this.#delta > 0) {
      let added = 0;
      while (added < this.#delta) {
        value = value.increment();

        if (this.#mode === GanttConstraintMode.DO_NOT_COUNT_CLOSE_DAY) {
          if (this.#calendar === undefined) throw new Error('NullPointerException');
          if (PiecewiseConstantUtils.isZeroOnDay(this.#calendar, value.toDay())) {
            continue; // skip closed days
          }
        }

        added++;
      }
    }

    if (this.#delta < 0) for (let i = 0; i < -this.#delta; i++) value = value.decrement();

    return value;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskInstant.java:94-103 */
  public getInstantPrecise(): TimePoint {
    if (this.#attribute === TaskAttribute.START) return this.#manageDelta(this.#task.getStart());

    if (this.#attribute === TaskAttribute.END) return this.#manageDelta(this.#task.getEnd());

    throw new Error('IllegalStateException');
  }

  /** `attribute.toString() + " of " + task` (java:105-107); `String(task)` stands for `Object#toString`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskInstant.java:105-107 */
  public toString(): string {
    // Java concatenates the Moment, i.e. its (default) Object#toString.
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return this.#attribute.toString() + ' of ' + String(this.#task);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskInstant.java:109-111 */
  public getMoment(): Moment {
    return this.#task;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskInstant.java:113-115 */
  public isTask(): boolean {
    return this.#task instanceof AbstractTask;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskInstant.java:117-119 */
  public getAttribute(): TaskAttribute {
    return this.#attribute;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskInstant.java:121-130 */
  public sameRowAs(dest: TaskInstant): boolean {
    if (this.isTask() && dest.isTask()) {
      const t1 = this.getMoment() as AbstractTask;
      const t2 = dest.getMoment() as AbstractTask;
      if (t1 === t2.getRow() || t2 === t1.getRow()) return true;
    }
    return false;
  }
}
