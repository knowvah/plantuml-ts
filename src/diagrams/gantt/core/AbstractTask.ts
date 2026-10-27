import type { Stereotype } from '../../../core/stereo/Stereotype.js';
import type { StyleBuilder } from '../../../core/style/StyleBuilder.js';
import type { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { Display } from '../../../core/klimt/creole/Display.js';
import type { Url } from '../../../core/url/Url.js';
import type { CenterBorderColor } from '../lang/CenterBorderColor.js';
import type { Load } from '../ngm/Load.js';
import type { TimePoint } from '../time/TimePoint.js';
import { getEndMinusOneDayTOBEREMOVED } from './Moment.js';
import type { Resource } from './Resource.js';
import type { Task } from './Task.js';
import type { TaskCode } from './TaskCode.js';

/** Java `new UnsupportedOperationException()` (thrown by the task kinds that do not support an operation). */
export function unsupportedOperation(): never {
  throw new Error('UnsupportedOperationException');
}

/**
 * AbstractTask -- code, style builder, row, display string and stereotype shared by every task kind.
 *
 * `getEndMinusOneDayTOBEREMOVED` is the `Moment` interface's `default` method (Moment.java), which a Java
 * implementer inherits; here it delegates to the free function.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/AbstractTask.java:41-96
 */
export abstract class AbstractTask implements Task {
  readonly #code: TaskCode;
  readonly #styleBuilder: StyleBuilder;

  #row: Task | undefined;
  #displayString: string | undefined;
  #stereotype: Stereotype | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/AbstractTask.java:50-53 */
  protected constructor(styleBuilder: StyleBuilder, code: TaskCode) {
    this.#styleBuilder = styleBuilder;
    this.#code = code;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/AbstractTask.java:55-59 */
  public putInSameRowAs(row: Task): void {
    if (this !== row) this.#row = row;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/AbstractTask.java:61-64 */
  public getRow(): Task | undefined {
    return this.#row;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/AbstractTask.java:66-69 */
  public getCode(): TaskCode {
    return this.#code;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/AbstractTask.java:71-74 */
  public getStyleBuilder(): StyleBuilder {
    return this.#styleBuilder;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/AbstractTask.java:76-79 */
  public setDisplay(displayString: string | undefined): void {
    this.#displayString = displayString;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/AbstractTask.java:81-84 */
  public getDisplayString(): string | undefined {
    return this.#displayString;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/AbstractTask.java:86-89 */
  public getStereotype(): Stereotype | undefined {
    return this.#stereotype;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/AbstractTask.java:91-94 */
  public setStereotype(stereotype: Stereotype | undefined): void {
    this.#stereotype = stereotype;
  }

  /** `Moment#getEndMinusOneDayTOBEREMOVED` (default method). */
  public getEndMinusOneDayTOBEREMOVED(): TimePoint {
    return getEndMinusOneDayTOBEREMOVED(this);
  }

  // Task members left abstract (AbstractTask.java implements Task without defining them).
  public abstract getStart(): TimePoint;
  public abstract getEnd(): TimePoint;
  public abstract getLoad(): Load;
  public abstract setLoad(load: Load): void;
  public abstract setStart(start: TimePoint): void;
  public abstract setEnd(end: TimePoint): void;
  public abstract setColors(...colors: CenterBorderColor[]): void;
  public abstract addResource(resource: Resource, percentage: number): void;
  public abstract setDiamond(diamond: boolean): void;
  public abstract isDiamond(): boolean;
  public abstract setCompletion(completion: number): void;
  public abstract setUrl(url: Url): void;
  public abstract addPause(pause: LocalDate | DayOfWeek): void;
  public abstract setNote(note: Display, stereotype: Stereotype | undefined): void;
  public abstract isAssignedTo(res: Resource): boolean;
}
