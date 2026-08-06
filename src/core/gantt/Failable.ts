/**
 * Failable — upstream's ok-or-error result carrier (an ad-hoc
 * `Result<O, string>` living in the gantt package but consumed across
 * the codebase; `CucaDiagram#quarkInContextSafe` returns one).
 *
 * SI1/T10 closure pull — full port (6/6 members). Java `null` fields →
 * `undefined` per the translation table; the private constructor's
 * XOR guard is preserved verbatim.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/Failable.java:38-93
 */
export class Failable<O> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/Failable.java:40-42 */
  private readonly data: O | undefined;
  private readonly error: string | undefined;
  private readonly score: number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/Failable.java:44-46 */
  static ok<O>(data: O): Failable<O> {
    return new Failable<O>(data, undefined, 0);
  }

  /** Java's two `error` overloads (:48-54) merged via a default score. */
  static error<O>(error: string, score = 0): Failable<O> {
    return new Failable<O>(undefined, error, score);
  }

  /** Private upstream (:56-66) — construct via `ok`/`error`. */
  private constructor(data: O | undefined, error: string | undefined, score: number) {
    if (data === undefined && error === undefined) throw new Error('IllegalArgumentException');

    if (data !== undefined && error !== undefined) throw new Error('IllegalArgumentException');

    this.data = data;
    this.error = error;
    this.score = score;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/Failable.java:68-73 */
  get(): O {
    if (this.data === undefined) throw new Error('IllegalStateException');

    return this.data;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/Failable.java:75-77 */
  isFail(): boolean {
    return this.data === undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/Failable.java:79-84 */
  getError(): string {
    if (this.error === undefined) throw new Error('IllegalStateException');

    return this.error;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/Failable.java:86-91 */
  getScore(): number {
    if (this.error === undefined) throw new Error('IllegalStateException');

    return this.score;
  }
}
