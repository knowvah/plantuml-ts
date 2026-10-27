import type { Display } from '../../../core/klimt/creole/Display.js';
import type { Stereotype } from '../../../core/stereo/Stereotype.js';
import type { StyleBuilder } from '../../../core/style/StyleBuilder.js';
import type { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { Url } from '../../../core/url/Url.js';
import type { CenterBorderColor } from '../lang/CenterBorderColor.js';
import type { Load } from '../ngm/Load.js';
import type { TimePoint } from '../time/TimePoint.js';
import { AbstractTask, unsupportedOperation } from './AbstractTask.js';
import type { Resource } from './Resource.js';
import type { Task } from './Task.js';
import type { TaskCode } from './TaskCode.js';

/**
 * TaskGroup -- a task whose start/end are the min/max of its children; every mutator throws.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:51-164
 */
export class TaskGroup extends AbstractTask implements Task {
  readonly #parent: TaskGroup | undefined;
  readonly #children: Task[] = [];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:56-59 */
  constructor(parent: TaskGroup | undefined, styleBuilder: StyleBuilder, code: TaskCode) {
    super(styleBuilder, code);
    this.#parent = parent;
  }

  /** Earliest child start. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:61-72 */
  public getStart(): TimePoint {
    let min: TimePoint | undefined;
    for (const child of this.#children)
      if (min === undefined || min.compareTo(child.getStart()) > 0) min = child.getStart();

    if (min !== undefined) return min;

    return unsupportedOperation();
  }

  /** Latest child end. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:74-85 */
  public getEnd(): TimePoint {
    let max: TimePoint | undefined;
    for (const child of this.#children)
      if (max === undefined || max.compareTo(child.getEnd()) < 0) max = child.getEnd();

    if (max !== undefined) return max;

    return unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:87-90 */
  public setStart(): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:92-95 */
  public setEnd(): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:97-100 */
  public setColors(..._colors: CenterBorderColor[]): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:102-105 */
  public addResource(_resource: Resource, _percentage: number): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:107-110 */
  public getLoad(): Load {
    return unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:112-115 */
  public setLoad(_load: Load): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:117-120 */
  public setDiamond(_diamond: boolean): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:122-125 */
  public isDiamond(): boolean {
    return unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:127-130 */
  public setCompletion(_completion: number): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:132-135 */
  public setUrl(_url: Url): void {
    unsupportedOperation();
  }

  /** Both `addPause` overloads (:137-145). */
  public addPause(_pause: LocalDate | DayOfWeek): void {
    unsupportedOperation();
  }

  /** Does nothing. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:147-149 */
  public setNote(_note: Display, _stereotype: Stereotype | undefined): void {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:151-153 */
  public addTask(child: Task): void {
    this.#children.push(child);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:155-157 */
  public getParent(): TaskGroup | undefined {
    return this.#parent;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java:159-162 */
  public isAssignedTo(_res: Resource): boolean {
    return false;
  }
}
