import type { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { ResourceDraw } from '../draw/ResourceDraw.js';
import { OpenClose } from '../OpenClose.js';
import type { PiecewiseConstant } from '../ngm/math/PiecewiseConstant.js';

/**
 * Resource -- a named worker with its own open/close calendar.
 *
 * `addCloseDay(LocalDate)` / `addCloseDay(DayOfWeek)` (java:88, :96) are one method taking the union.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:44-116
 */
export class Resource {
  readonly #name: string;
  #draw: ResourceDraw | undefined;

  readonly #openClose: OpenClose = new OpenClose();

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:52-54 */
  constructor(name: string) {
    this.#name = name;
  }

  /** Java `String.hashCode` of the name. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:56-59 */
  public hashCode(): number {
    let h = 0;
    for (let i = 0; i < this.#name.length; i++) h = (Math.imul(31, h) + this.#name.charCodeAt(i)) | 0;
    return h;
  }

  /** Unchecked cast like Java. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:61-65 */
  public equals(obj: unknown): boolean {
    if (!(obj instanceof Resource)) throw new Error('ClassCastException');
    return this.#name === obj.#name;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:67-70 */
  public toString(): string {
    return this.#name;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:72-74 */
  public getName(): string {
    return this.#name;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:76-78 */
  public getResourceDraw(): ResourceDraw | undefined {
    return this.#draw;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:80-82 */
  public setTaskDraw(draw: ResourceDraw): void {
    this.#draw = draw;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:84-86 */
  public isClosedAt(day: LocalDate): boolean {
    return this.#openClose.isClosed(day);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:88-90 and :96-98 */
  public addCloseDay(day: LocalDate | DayOfWeek): void {
    this.#openClose.close(day);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:92-94 */
  public addForceOnDay(day: LocalDate): void {
    this.#openClose.open(day);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:100-102 */
  public setOffBeforeDate(day: LocalDate): void {
    this.#openClose.setOffBeforeDate(day);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:104-106 */
  public setOffAfterDate(day: LocalDate): void {
    this.#openClose.setOffAfterDate(day);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:108-110 */
  public getLastDayIfAny(): LocalDate | undefined {
    return this.#openClose.getLastDayIfAny();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java:112-114 */
  public asPiecewiseConstant(): PiecewiseConstant {
    return this.#openClose.asPiecewiseConstant();
  }
}
