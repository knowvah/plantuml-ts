import type { LocalDate } from '../../core/time/LocalDate.js';
import type { GanttDiagram } from './GanttDiagram.js';

/**
 * MyIterator -- the inner `Iterator<LocalDate>` of `DaysAsDates`; walks day by day from `current` to `date2` inclusive.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/DaysAsDates.java:68-90
 */
class MyIterator {
  #current: LocalDate;
  readonly #date2: LocalDate;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/DaysAsDates.java:72-74 */
  constructor(current: LocalDate, date2: LocalDate) {
    this.#current = current;
    this.#date2 = date2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/DaysAsDates.java:76-78 */
  hasNext(): boolean {
    return this.#current.compareTo(this.#date2) <= 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/DaysAsDates.java:80-84 */
  next(): LocalDate {
    const result = this.#current;
    this.#current = this.#current.plusDays(1);
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/DaysAsDates.java:86-88 */
  remove(): never {
    throw new Error('UnsupportedOperationException');
  }
}

/**
 * DaysAsDates -- an inclusive range of days, iterable day by day.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/DaysAsDates.java:41-96
 */
export class DaysAsDates implements Iterable<LocalDate> {
  readonly #date1: LocalDate;
  readonly #date2: LocalDate;

  /**
   * Java's two constructors: `(LocalDate, LocalDate)` (:46-49) and `(GanttDiagram, LocalDate, int count)` (:56-66),
   * which ends `count` open days later.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/DaysAsDates.java:46-66
   */
  constructor(date1: LocalDate, date2: LocalDate);
  constructor(gantt: GanttDiagram, date1: LocalDate, count: number);
  constructor(a: LocalDate | GanttDiagram, b: LocalDate, c?: number) {
    if (c === undefined) {
      this.#date1 = a as LocalDate;
      this.#date2 = b;
      return;
    }
    const gantt = a as GanttDiagram;
    this.#date1 = b;
    let tmp = b;
    let count = c;
    while (count > 0) {
      if (gantt.isOpen(tmp)) count--;
      tmp = tmp.plusDays(1);
    }
    this.#date2 = tmp;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/DaysAsDates.java:52-54 */
  toString(): string {
    return `{ ${this.#date1.toString()} , ${this.#date2.toString()} }`;
  }

  /** `iterator()`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/DaysAsDates.java:92-94 */
  iterator(): MyIterator {
    return new MyIterator(this.#date1, this.#date2);
  }

  /** JS iteration protocol over Java's `iterator()` (`hasNext`/`next`). */
  *[Symbol.iterator](): Iterator<LocalDate> {
    const it = this.iterator();
    while (it.hasNext()) yield it.next();
  }
}
