import type { GanttConstraint } from '../GanttConstraint.js';
import type { Resource } from '../core/Resource.js';
import type { Task } from '../core/Task.js';
import type { TaskCode } from '../core/TaskCode.js';
import { TaskImpl } from '../core/TaskImpl.js';
import { TaskSeparator } from '../core/TaskSeparator.js';
import type { TimePoint } from '../time/TimePoint.js';

/**
 * Value object containing the core domain data of a Gantt diagram: tasks,
 * resources, and constraints.
 *
 * `LinkedHashMap<TaskCode, Task>` is a JS `Map` keyed by `TaskCode.getId()`
 * (`TaskCode.equals`/`hashCode` are on the id, TaskCode.java:59-69); both keep insertion order,
 * and a re-put keeps the original position.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/GanttModelData.java:51
 */
export class GanttModelData {
  readonly #constraints: GanttConstraint[] = [];
  readonly #tasks = new Map<string, Task>();
  readonly #resources = new Map<string, Resource>();

  /** @see GanttModelData.java:57-59 */
  public getTasks(): Task[] {
    return [...this.#tasks.values()];
  }

  /** @see GanttModelData.java:61-63 */
  public getResources(): Resource[] {
    return [...this.#resources.values()];
  }

  /** @see GanttModelData.java:65-67 */
  public getConstraints(): GanttConstraint[] {
    return [...this.#constraints];
  }

  // Mutators for building the model

  /** @see GanttModelData.java:71-73 */
  public addConstraint(constraint: GanttConstraint): void {
    this.#constraints.push(constraint);
  }

  /** @see GanttModelData.java:75-77 */
  public putTask(code: TaskCode, task: Task): void {
    this.#tasks.set(code.getId(), task);
  }

  /** @see GanttModelData.java:79-81 */
  public getTask(code: TaskCode): Task | undefined {
    return this.#tasks.get(code.getId());
  }

  /** @see GanttModelData.java:83-85 */
  public putResource(name: string, resource: Resource): void {
    this.#resources.set(name, resource);
  }

  /** @see GanttModelData.java:87-89 */
  public getResource(name: string): Resource | undefined {
    return this.#resources.get(name);
  }

  /** The Java `(TaskImpl) task` cast throws ClassCastException for a non-TaskImpl non-separator. @see GanttModelData.java:91-101 */
  public getLoadForResource(res: Resource, i: TimePoint): number {
    let result = 0;
    for (const task of this.getTasks()) {
      if (task instanceof TaskSeparator) continue;

      if (!(task instanceof TaskImpl)) throw new Error('ClassCastException: task is not a TaskImpl');
      result += task.loadForResource(res, i);
    }
    return result;
  }

  /** @see GanttModelData.java:103-110 */
  public getConstraintsForTask(task: Task): GanttConstraint[] {
    const result: GanttConstraint[] = [];
    for (const constraint of this.getConstraints()) if (constraint.isOn(task)) result.push(constraint);

    return result;
  }
}
