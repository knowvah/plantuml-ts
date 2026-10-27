/**
 * Holds at most two of a task's START / END / LOAD values and derives the
 * missing START or END from them through a fixed-total-effort task.
 *
 * Deviation: upstream asserts `values.size() <= 2` under `TeaVM.a()`
 * (Solver.java:78-79); the size is bounded by `removeFirstElement` just
 * above, so the assertion is not ported (it has no effect off TeaVM).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/solver/Solver.java:53
 */

import { Duration } from '../../../core/time/Duration.js';
import { TaskAttribute } from '../core/TaskAttribute.js';
import { Load } from '../ngm/Load.js';
import type { NGMAllocation } from '../ngm/NGMAllocation.js';
import { NGMTask } from '../ngm/NGMTask.js';
import type { PValue } from '../PValue.js';
import { TimePoint } from '../time/TimePoint.js';

/** Maximum number of retained attributes (`values.size() > 2`, Solver.java:73). */
const MAX_VALUES = 2;

/** Java `(TimePoint) value`: absent is an NPE at the next dereference, a wrong type a ClassCastException. */
function asTimePoint(value: PValue | undefined): TimePoint {
  if (value === undefined) throw new Error('NullPointerException: attribute is not set');
  if (!(value instanceof TimePoint)) throw new Error('ClassCastException: not a TimePoint');
  return value;
}

/** Java `(Load) value`; see {@link asTimePoint}. */
function asLoad(value: PValue | undefined): Load {
  if (value === undefined) throw new Error('NullPointerException: attribute is not set');
  if (!(value instanceof Load)) throw new Error('ClassCastException: not a Load');
  return value;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/solver/Solver.java:53 */
export class Solver {
  /** `LinkedHashMap`: a JS `Map` iterates in insertion order too; keys are enum singletons. @see Solver.java:56 */
  readonly #values = new Map<TaskAttribute, PValue>();

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/solver/Solver.java:62 */
  public setData(attribute: TaskAttribute, value: PValue): void {
    let stored = value;
    const previous = this.#values.get(attribute);
    this.#values.delete(attribute);
    if (previous !== undefined && attribute === TaskAttribute.START) {
      const previousInstant = asTimePoint(previous);
      if (previousInstant.compareTo(asTimePoint(stored)) > 0) stored = previous;
    }
    this.#values.set(attribute, stored);
    if (this.#values.size > MAX_VALUES) this.#removeFirstElement();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/solver/Solver.java:83 */
  #removeFirstElement(): void {
    const first = this.#values.keys().next();
    if (first.done !== true) this.#values.delete(first.value);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/solver/Solver.java:89 */
  public getData(allocation: NGMAllocation, attribute: TaskAttribute): PValue {
    const result = this.#values.get(attribute);
    if (result === undefined) {
      if (attribute === TaskAttribute.END) return this.#computeEnd(allocation);

      if (attribute === TaskAttribute.START) return this.#computeStart(allocation);

      return Load.of(Duration.ofDays(1));
    }
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/solver/Solver.java:104 */
  #computeEnd(allocation: NGMAllocation): TimePoint {
    const start = asTimePoint(this.#values.get(TaskAttribute.START));
    const fullLoad = asLoad(this.#values.get(TaskAttribute.LOAD));
    const task = NGMTask.withFixedTotalEffort(allocation, start.toLocalDateTime(), fullLoad);
    return TimePoint.of(task.getEnd());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/solver/Solver.java:112 */
  #computeStart(allocation: NGMAllocation): TimePoint {
    const end = asTimePoint(this.#values.get(TaskAttribute.END));
    const fullLoad = asLoad(this.#values.get(TaskAttribute.LOAD));
    const task = NGMTask.withFixedTotalEffort(allocation, end.toLocalDateTime(), fullLoad);
    task.setEnd(end.toLocalDateTime());
    return TimePoint.of(task.getStart());
  }
}
