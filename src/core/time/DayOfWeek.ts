/**
 * `java.time.DayOfWeek` -- immutable singleton instances, Java ordinals
 * (MONDAY = 0 ... SUNDAY = 6). Gantt calls `values()`, `name()`, `ordinal`
 * (`time/DayOfWeekUtils.java`), identity `==` (`core/TaskImpl.java:156`) and
 * keys `EnumMap`s with it; `getValue()`/`plus()` are needed by `WeekFields`
 * and `LocalDate#getDayOfWeek`.
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/DayOfWeek.html
 */
import { DateTimeException } from './DateTimeException.js';
import { floorMod } from './time-math.js';

export class DayOfWeek {
  public static readonly MONDAY: DayOfWeek = new DayOfWeek('MONDAY', 0);
  public static readonly TUESDAY: DayOfWeek = new DayOfWeek('TUESDAY', 1);
  public static readonly WEDNESDAY: DayOfWeek = new DayOfWeek('WEDNESDAY', 2);
  public static readonly THURSDAY: DayOfWeek = new DayOfWeek('THURSDAY', 3);
  public static readonly FRIDAY: DayOfWeek = new DayOfWeek('FRIDAY', 4);
  public static readonly SATURDAY: DayOfWeek = new DayOfWeek('SATURDAY', 5);
  public static readonly SUNDAY: DayOfWeek = new DayOfWeek('SUNDAY', 6);

  static readonly #VALUES: readonly DayOfWeek[] = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY,
  ];

  readonly #name: string;
  readonly #ordinal: number;

  private constructor(name: string, ordinal: number) {
    this.#name = name;
    this.#ordinal = ordinal;
  }

  /** `DayOfWeek.values()` -- a fresh array, in ordinal order. */
  public static values(): DayOfWeek[] {
    return [...DayOfWeek.#VALUES];
  }

  /** `DayOfWeek.of(int)` (1 = Monday ... 7 = Sunday). */
  public static of(dayOfWeek: number): DayOfWeek {
    const found = DayOfWeek.#VALUES[dayOfWeek - 1];
    if (!Number.isInteger(dayOfWeek) || found === undefined) {
      throw new DateTimeException(`Invalid value for DayOfWeek: ${dayOfWeek}`);
    }
    return found;
  }

  /** `Enum#name()`. */
  public name(): string {
    return this.#name;
  }

  /** `Enum#ordinal()`. */
  public ordinal(): number {
    return this.#ordinal;
  }

  /** `DayOfWeek#getValue()` -- ISO 1 (Monday) to 7 (Sunday). */
  public getValue(): number {
    return this.#ordinal + 1;
  }

  /** `DayOfWeek#plus(long)`. */
  public plus(days: number): DayOfWeek {
    return DayOfWeek.#VALUES[floorMod(this.#ordinal + days, 7)] as DayOfWeek;
  }

  /** `DayOfWeek#minus(long)`. */
  public minus(days: number): DayOfWeek {
    return this.plus(-(days % 7));
  }

  /** `Enum#compareTo`. */
  public compareTo(other: DayOfWeek): number {
    return this.#ordinal - other.#ordinal;
  }

  public toString(): string {
    return this.#name;
  }
}
