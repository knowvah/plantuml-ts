/**
 * PrintScale -- the timeline compression presets. Java enum with a field and
 * methods, so singleton instances with Java ordinals.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/PrintScale.java:35-67
 */
export class PrintScale {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/PrintScale.java:36 */
  public static readonly DAILY: PrintScale = new PrintScale('DAILY', 0, 1);
  public static readonly WEEKLY: PrintScale = new PrintScale('WEEKLY', 1, 4);
  public static readonly MONTHLY: PrintScale = new PrintScale('MONTHLY', 2, 15);
  public static readonly QUARTERLY: PrintScale = new PrintScale('QUARTERLY', 3, 40);
  public static readonly YEARLY: PrintScale = new PrintScale('YEARLY', 4, 60);

  static readonly #VALUES: readonly PrintScale[] = [
    PrintScale.DAILY,
    PrintScale.WEEKLY,
    PrintScale.MONTHLY,
    PrintScale.QUARTERLY,
    PrintScale.YEARLY,
  ];

  readonly #name: string;
  readonly #ordinal: number;
  readonly #defaultScale: number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/PrintScale.java:40-42 */
  private constructor(name: string, ordinal: number, compress: number) {
    this.#name = name;
    this.#ordinal = ordinal;
    this.#defaultScale = 1.0 / compress;
  }

  /** `PrintScale.values()` -- a fresh array, in ordinal order. */
  public static values(): PrintScale[] {
    return [...PrintScale.#VALUES];
  }

  /** `Enum#name()`. */
  public name(): string {
    return this.#name;
  }

  /** `Enum#ordinal()`. */
  public ordinal(): number {
    return this.#ordinal;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/PrintScale.java:44-46 */
  public getDefaultScale(): number {
    return this.#defaultScale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/PrintScale.java:48-65 (prefix match; anything else is DAILY) */
  public static fromString(value: string): PrintScale {
    if (value.startsWith('w')) return PrintScale.WEEKLY;

    if (value.startsWith('m')) return PrintScale.MONTHLY;

    if (value.startsWith('q')) return PrintScale.QUARTERLY;

    if (value.startsWith('y')) return PrintScale.YEARLY;

    return PrintScale.DAILY;
  }

  public toString(): string {
    return this.#name;
  }
}
