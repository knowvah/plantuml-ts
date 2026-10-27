/**
 * `RegexPartialMatch` -- the ordered captured strings of one named regex
 * leaf. Java `null` entries (a group that did not participate) are
 * `undefined`. `get` out of range throws `RangeError` (Java
 * `IndexOutOfBoundsException`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexPartialMatch.java
 */
export class RegexPartialMatch implements Iterable<string | undefined> {
  private readonly data: (string | undefined)[] = [];

  /** The Java constructor takes a `name` it never reads. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexPartialMatch.java */
  public constructor(_name: string) {
    // intentionally empty: upstream ignores `name`
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexPartialMatch.java */
  public add(group: string | undefined): void {
    this.data.push(group);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexPartialMatch.java */
  public size(): number {
    return this.data.length;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexPartialMatch.java */
  public get(i: number): string | undefined {
    if (!Number.isInteger(i) || i < 0 || i >= this.data.length)
      throw new RangeError('Index ' + String(i) + ' out of bounds for length ' + String(this.data.length));
    return this.data[i];
  }

  /** `Collections.unmodifiableCollection(data).iterator()`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexPartialMatch.java */
  public [Symbol.iterator](): Iterator<string | undefined> {
    return this.data.values();
  }

  /** `"{" + data + "}"` with `List#toString` (`null` for absent entries). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/RegexPartialMatch.java */
  public toString(): string {
    return '{[' + this.data.map((s) => (s === undefined ? 'null' : s)).join(', ') + ']}';
  }
}
