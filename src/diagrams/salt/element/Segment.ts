/**
 * Segment — a (row, col) cell edge `Grid` collects in its `horizontals` /
 * `verticals` hash sets (`Grid.java:57-58`).
 *
 * `hashCode`/`equals` are ported as plain methods: a TS `Set` keys on
 * identity, so a consumer de-duplicating segments must key on
 * `hashCode()` and confirm with `equals()` exactly as `HashSet` does.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Segment.java:38-67
 */
export class Segment {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Segment.java:43-46 */
  constructor(
    private readonly row: number,
    private readonly col: number,
  ) {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Segment.java:48-51 */
  hashCode(): number {
    return this.row * 47 + this.col;
  }

  /**
   * Upstream casts `Object` to `Segment` unchecked; the parameter is typed
   * `Segment` instead, which is every call the cast would not throw on.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Segment.java:53-57
   */
  equals(obj: Segment): boolean {
    const this2 = obj;
    return this.row === this2.row && this.col === this2.col;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Segment.java:59-61 */
  getRow(): number {
    return this.row;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Segment.java:63-65 */
  getCol(): number {
    return this.col;
  }
}
