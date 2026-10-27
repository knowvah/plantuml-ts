import { LocalDate } from '../../../core/time/LocalDate.js';
import type { Month } from '../../../core/time/Month.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { fromString as monthFromString } from '../time/MonthUtils.js';
import { toUbrexA_DD_MONTH_YYYY, toUbrexB_YYYY_MM_DD, toUbrexC_MONTH_DD_YYYY } from './TimeResolution.js';

/**
 * `Integer.parseInt(s)`: optional sign then digits, else `NumberFormatException`;
 * a null argument (`findFirstValueByKey` found nothing) is also a
 * `NumberFormatException` upstream.
 */
function parseInt32(s: string | undefined): number {
  if (s === undefined || !/^[+-]?[0-9]+$/.test(s)) throw new Error('NumberFormatException');
  const n = Number.parseInt(s, 10);
  if (n > 2147483647 || n < -2147483648) throw new Error('NumberFormatException');
  return n;
}

/**
 * DayPattern -- a date written day-month-year, year-month-day or
 * month-day-year, captured under id-suffixed keys.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/DayPattern.java:47-110
 */
export class DayPattern {
  readonly #yearKeyA: string;
  readonly #yearKeyB: string;
  readonly #yearKeyC: string;
  readonly #monthKeyA: string;
  readonly #monthKeyB: string;
  readonly #monthKeyC: string;
  readonly #dayKeyA: string;
  readonly #dayKeyB: string;
  readonly #dayKeyC: string;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/DayPattern.java:59-69 */
  public constructor(id: string) {
    this.#yearKeyA = 'AYEAR' + id;
    this.#yearKeyB = 'BYEAR' + id;
    this.#yearKeyC = 'CYEAR' + id;
    this.#monthKeyA = 'AMONTH' + id;
    this.#monthKeyB = 'BMONTH' + id;
    this.#monthKeyC = 'CMONTH' + id;
    this.#dayKeyA = 'ADAY' + id;
    this.#dayKeyB = 'BDAY' + id;
    this.#dayKeyC = 'CDAY' + id;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/DayPattern.java:71-75 */
  public toUbrex(): UBrexPart {
    return new UBrexOr(
      toUbrexA_DD_MONTH_YYYY(this.#yearKeyA, this.#monthKeyA, this.#dayKeyA),
      toUbrexB_YYYY_MM_DD(this.#yearKeyB, this.#monthKeyB, this.#dayKeyB),
      toUbrexC_MONTH_DD_YYYY(this.#yearKeyC, this.#monthKeyC, this.#dayKeyC),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/DayPattern.java:77-87 (Java `null` is `undefined`) */
  public getDay(arg: CaptureLookup): LocalDate | undefined {
    if (arg.findFirstValueByKey(this.#dayKeyA) !== undefined) return this.#resultA(arg);

    if (arg.findFirstValueByKey(this.#dayKeyB) !== undefined) return this.#resultB(arg);

    if (arg.findFirstValueByKey(this.#dayKeyC) !== undefined) return this.#resultC(arg);
    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/DayPattern.java:89-94 */
  #resultA(arg: CaptureLookup): LocalDate {
    const day = parseInt32(arg.findFirstValueByKey(this.#dayKeyA));
    const month: Month = monthFromString(arg.findFirstValueByKey(this.#monthKeyA) ?? this.#npe());
    const year = parseInt32(arg.findFirstValueByKey(this.#yearKeyA));
    return LocalDate.of(year, month, day);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/DayPattern.java:96-101 */
  #resultB(arg: CaptureLookup): LocalDate {
    const day = parseInt32(arg.findFirstValueByKey(this.#dayKeyB));
    const month = parseInt32(arg.findFirstValueByKey(this.#monthKeyB));
    const year = parseInt32(arg.findFirstValueByKey(this.#yearKeyB));
    return LocalDate.of(year, month, day);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/DayPattern.java:103-108 */
  #resultC(arg: CaptureLookup): LocalDate {
    const day = parseInt32(arg.findFirstValueByKey(this.#dayKeyC));
    const month: Month = monthFromString(arg.findFirstValueByKey(this.#monthKeyC) ?? this.#npe());
    const year = parseInt32(arg.findFirstValueByKey(this.#yearKeyC));
    return LocalDate.of(year, month, day);
  }

  /** A null month string dereferenced by `MonthUtils.fromString` upstream. */
  #npe(): never {
    throw new Error('NullPointerException');
  }
}
