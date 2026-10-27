/**
 * TaskAttribute -- START, END, LOAD. Java enum with a static factory, so
 * singleton instances with Java ordinals.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskAttribute.java:33-45
 */
export class TaskAttribute {
  public static readonly START: TaskAttribute = new TaskAttribute('START', 0);
  public static readonly END: TaskAttribute = new TaskAttribute('END', 1);
  public static readonly LOAD: TaskAttribute = new TaskAttribute('LOAD', 2);

  static readonly #VALUES: readonly TaskAttribute[] = [TaskAttribute.START, TaskAttribute.END, TaskAttribute.LOAD];

  readonly #name: string;
  readonly #ordinal: number;

  private constructor(name: string, ordinal: number) {
    this.#name = name;
    this.#ordinal = ordinal;
  }

  /** `TaskAttribute.values()` -- a fresh array, in ordinal order. */
  public static values(): TaskAttribute[] {
    return [...TaskAttribute.#VALUES];
  }

  /** `Enum#valueOf(String)`; unknown names throw `IllegalArgumentException`. */
  public static valueOf(name: string): TaskAttribute {
    const found = TaskAttribute.#VALUES.find((v) => v.#name === name);
    if (found === undefined) {
      throw new Error(
        `IllegalArgumentException: No enum constant net.sourceforge.plantuml.gantt.core.TaskAttribute.${name}`,
      );
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

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskAttribute.java:41-43 (`valueOf(value.toUpperCase())`) */
  public static fromString(value: string): TaskAttribute {
    return TaskAttribute.valueOf(value.toUpperCase());
  }

  public toString(): string {
    return this.#name;
  }
}
