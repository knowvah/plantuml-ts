/**
 * `java.time.Month` -- immutable singleton instances, Java ordinals
 * (JANUARY = 0 ... DECEMBER = 11). Gantt calls `values()`, `name()` and
 * `ordinal()` (`time/MonthUtils.java`, `time/TimePoint.java:131`); `length()`,
 * `getValue()` and `of()` are what `LocalDate` needs internally.
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Month.html
 */
import { DateTimeException } from './DateTimeException.js';
import { floorMod } from './time-math.js';

/** `Month#length(boolean)` day counts, February as the non-leap 28. */
const MONTH_LENGTHS: readonly number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export class Month {
  public static readonly JANUARY: Month = new Month('JANUARY', 0);
  public static readonly FEBRUARY: Month = new Month('FEBRUARY', 1);
  public static readonly MARCH: Month = new Month('MARCH', 2);
  public static readonly APRIL: Month = new Month('APRIL', 3);
  public static readonly MAY: Month = new Month('MAY', 4);
  public static readonly JUNE: Month = new Month('JUNE', 5);
  public static readonly JULY: Month = new Month('JULY', 6);
  public static readonly AUGUST: Month = new Month('AUGUST', 7);
  public static readonly SEPTEMBER: Month = new Month('SEPTEMBER', 8);
  public static readonly OCTOBER: Month = new Month('OCTOBER', 9);
  public static readonly NOVEMBER: Month = new Month('NOVEMBER', 10);
  public static readonly DECEMBER: Month = new Month('DECEMBER', 11);

  static readonly #VALUES: readonly Month[] = [
    Month.JANUARY,
    Month.FEBRUARY,
    Month.MARCH,
    Month.APRIL,
    Month.MAY,
    Month.JUNE,
    Month.JULY,
    Month.AUGUST,
    Month.SEPTEMBER,
    Month.OCTOBER,
    Month.NOVEMBER,
    Month.DECEMBER,
  ];

  readonly #name: string;
  readonly #ordinal: number;

  private constructor(name: string, ordinal: number) {
    this.#name = name;
    this.#ordinal = ordinal;
  }

  /** `Month.values()` -- a fresh array, in ordinal order. */
  public static values(): Month[] {
    return [...Month.#VALUES];
  }

  /** `Month.of(int)` (1 = January ... 12 = December). */
  public static of(month: number): Month {
    const found = Month.#VALUES[month - 1];
    if (!Number.isInteger(month) || found === undefined) {
      throw new DateTimeException(`Invalid value for MonthOfYear: ${month}`);
    }
    return found;
  }

  public name(): string {
    return this.#name;
  }

  public ordinal(): number {
    return this.#ordinal;
  }

  /** `Month#getValue()` -- 1 to 12. */
  public getValue(): number {
    return this.#ordinal + 1;
  }

  /** `Month#length(boolean leapYear)`. */
  public length(leapYear: boolean): number {
    if (this.#ordinal === 1) return leapYear ? 29 : 28;
    return MONTH_LENGTHS[this.#ordinal] as number;
  }

  /** `Month#plus(long)`. */
  public plus(months: number): Month {
    return Month.#VALUES[floorMod(this.#ordinal + months, 12)] as Month;
  }

  public compareTo(other: Month): number {
    return this.#ordinal - other.#ordinal;
  }

  public toString(): string {
    return this.#name;
  }
}
