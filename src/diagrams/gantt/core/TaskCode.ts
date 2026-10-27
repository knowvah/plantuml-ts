/**
 * TaskCode -- a task's identity (`id`) and what is drawn (`display`).
 * Equality and hash are by `id` only.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskCode.java:35-81
 */
export class TaskCode {
  readonly #id: string;
  readonly #display: string;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskCode.java:42-44 */
  public static fromId(id: string): TaskCode {
    return new TaskCode(id, id);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskCode.java:46-52 (a null `id` falls back to `display`) */
  public static fromIdAndDisplay(id: string | null | undefined, display: string | null | undefined): TaskCode {
    const effectiveId = id ?? display;
    if (display === null || display === undefined) return TaskCode.fromId(requireNonNull(effectiveId));
    return new TaskCode(requireNonNull(effectiveId), display);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskCode.java:54-57 (`Objects.requireNonNull`) */
  private constructor(id: string, display: string) {
    this.#id = requireNonNull(id);
    this.#display = requireNonNull(display);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskCode.java:59-62 (`String.hashCode` of the id) */
  public hashCode(): number {
    let h = 0;
    for (let i = 0; i < this.#id.length; i++) h = (Math.imul(31, h) + this.#id.charCodeAt(i)) | 0;
    return h;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskCode.java:64-68 (unchecked cast: any other type is a ClassCastException) */
  public equals(arg: unknown): boolean {
    if (!(arg instanceof TaskCode)) throw new Error('ClassCastException');
    return this.#id === arg.#id;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskCode.java:70-72 */
  public getDisplay(): string {
    return this.#display;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskCode.java:74-76 */
  public getId(): string {
    return this.#id;
  }
}

/** `Objects.requireNonNull`. */
function requireNonNull(value: string | null | undefined): string {
  if (value === null || value === undefined) throw new Error('NullPointerException');
  return value;
}
