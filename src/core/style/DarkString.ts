/**
 * DarkString — a style value's regular (`value1`) and `@media dark`
 * (`value2`) strings plus its priority. Immutable, as upstream.
 * `null` mirrors upstream's null fields: a regular value has a null
 * `value2`, a dark value a null `value1` (`ValueImpl.java:50-56`), and the
 * jar prints the null (`asString()` of a dark-only value is `null`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/DarkString.java
 */
export class DarkString {
  /** @see DarkString.java:44-48 */
  constructor(
    private readonly value1: string | null,
    private readonly value2: string | null,
    private readonly priority: number,
  ) {}

  /**
   * Regular+regular or dark+dark: the strictly bigger priority wins, else
   * `other`. Regular+dark (either order): combined, keeping the regular
   * side's priority. Anything else falls back to priority.
   * @see DarkString.java:50-72
   */
  mergeWith(other: DarkString | undefined): DarkString {
    if (other === undefined) return this;

    if (this.bothRegularOrBothDark(other)) {
      if (DarkString.isBigger(this.priority, other.priority)) return this;
      return other;
    }
    if (this.value2 === null && other.value1 === null) return new DarkString(this.value1, other.value2, this.priority);
    if (other.value2 === null && this.value1 === null) return new DarkString(other.value1, this.value2, other.priority);

    if (DarkString.isBigger(this.priority, other.priority)) return this;
    return other;
  }

  /**
   * The first `mergeWith` test, `(this.value2 == null && other.value2 == null)
   * || this.value1 == null && other.value1 == null`, split out only for the
   * complexity hook (CCN <= 10); evaluated at the same point, same operands.
   * @see DarkString.java:54
   */
  private bothRegularOrBothDark(other: DarkString): boolean {
    return (this.value2 === null && other.value2 === null) || (this.value1 === null && other.value1 === null);
  }

  /** Upstream's `DELTA_PRIORITY_FOR_STEREOTYPE` clamp is commented out; plain `a > b`. @see DarkString.java:73-79 */
  private static isBigger(a: number, b: number): boolean {
    return a > b;
  }

  /** @see DarkString.java:81-83 */
  addPriority(delta: number): DarkString {
    return new DarkString(this.value1, this.value2, delta + this.priority);
  }

  /** `value1 + "/" + value2 + " (" + priority + ")"`, nulls as `null`. @see DarkString.java:86-88 */
  toString(): string {
    return `${String(this.value1)}/${String(this.value2)} (${String(this.priority)})`;
  }

  /** @see DarkString.java:90-92 */
  getValue1(): string | null {
    return this.value1;
  }

  /** @see DarkString.java:94-96 */
  getValue2(): string | null {
    return this.value2;
  }

  /** @see DarkString.java:98-100 */
  getPriority(): number {
    return this.priority;
  }
}
