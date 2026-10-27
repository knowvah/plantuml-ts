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
import { TaskCode } from './TaskCode.js';

/**
 * TaskSeparator -- a `--comment--` row; no dates, every mutator throws.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:49-140
 */
export class TaskSeparator extends AbstractTask implements Task {
  readonly #comment: string;

  /** Code is `TaskCode.fromId("##" + id)`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:53-56 */
  constructor(styleBuilder: StyleBuilder, comment: string, id: number) {
    super(styleBuilder, TaskCode.fromId('##' + id));
    this.#comment = comment;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:58-61 */
  public getStart(): TimePoint {
    return unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:63-66 */
  public getEnd(): TimePoint {
    return unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:68-71 */
  public setStart(_start: TimePoint): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:73-76 */
  public setEnd(_end: TimePoint): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:78-81 */
  public setColors(..._colors: CenterBorderColor[]): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:83-85 */
  public getName(): string {
    return this.#comment;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:87-90 */
  public addResource(_resource: Resource, _percentage: number): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:92-95 */
  public getLoad(): Load {
    return unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:97-99 */
  public setLoad(_load: Load): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:101-104 */
  public setDiamond(_diamond: boolean): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:106-109 */
  public isDiamond(): boolean {
    return unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:111-114 */
  public setCompletion(_completion: number): void {
    unsupportedOperation();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:116-119 */
  public setUrl(_url: Url): void {
    unsupportedOperation();
  }

  /** Both `addPause` overloads (:121-129). */
  public addPause(_pause: LocalDate | DayOfWeek): void {
    unsupportedOperation();
  }

  /** Does nothing. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:131-133 */
  public setNote(_note: Display, _stereotype: Stereotype | undefined): void {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java:135-138 */
  public isAssignedTo(_res: Resource): boolean {
    return false;
  }
}
