/**
 * GSide -- which side of a task bar an arrow attaches to. Java enum with
 * methods, so singleton instances with Java ordinals (LEFT = 0 ... BOTTOM_RIGHT = 5).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/GSide.java:33-57
 */
export class GSide {
  public static readonly LEFT: GSide = new GSide('LEFT', 0);
  public static readonly RIGHT: GSide = new GSide('RIGHT', 1);
  public static readonly TOP_LEFT: GSide = new GSide('TOP_LEFT', 2);
  public static readonly TOP_RIGHT: GSide = new GSide('TOP_RIGHT', 3);
  public static readonly BOTTOM_LEFT: GSide = new GSide('BOTTOM_LEFT', 4);
  public static readonly BOTTOM_RIGHT: GSide = new GSide('BOTTOM_RIGHT', 5);

  static readonly #VALUES: readonly GSide[] = [
    GSide.LEFT,
    GSide.RIGHT,
    GSide.TOP_LEFT,
    GSide.TOP_RIGHT,
    GSide.BOTTOM_LEFT,
    GSide.BOTTOM_RIGHT,
  ];

  readonly #name: string;
  readonly #ordinal: number;

  private constructor(name: string, ordinal: number) {
    this.#name = name;
    this.#ordinal = ordinal;
  }

  /** `GSide.values()` -- a fresh array, in ordinal order. */
  public static values(): GSide[] {
    return [...GSide.#VALUES];
  }

  /** `Enum#name()`. */
  public name(): string {
    return this.#name;
  }

  /** `Enum#ordinal()`. */
  public ordinal(): number {
    return this.#ordinal;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/GSide.java:36-38 */
  public isBottom(): boolean {
    return this === GSide.BOTTOM_LEFT || this === GSide.BOTTOM_RIGHT;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/GSide.java:40-42 */
  public isTop(): boolean {
    return this === GSide.TOP_LEFT || this === GSide.TOP_RIGHT;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/GSide.java:44-50 (`IllegalStateException` for every other constant) */
  public reverseBottomTop(): GSide {
    if (this === GSide.BOTTOM_LEFT) return GSide.TOP_LEFT;
    if (this === GSide.BOTTOM_RIGHT) return GSide.TOP_RIGHT;
    throw new Error('IllegalStateException');
  }

  public toString(): string {
    return this.#name;
  }
}
