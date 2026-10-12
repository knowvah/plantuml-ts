/**
 * Position — an immutable (row, col) pair with Java value semantics.
 *
 * `equals` takes a `Position`: upstream casts its `Object` argument
 * unconditionally (`(Position) obj`, java:63), so any other argument is a
 * `ClassCastException` there.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/Position.java:38-67
 */
export class Position {
  /** @see Position.java:40 */
  private readonly row: number;
  /** @see Position.java:41 */
  private readonly col: number;

  /** @see Position.java:43-46 */
  constructor(row: number, col: number) {
    this.row = row;
    this.col = col;
  }

  /** @see Position.java:48-50 */
  getRow(): number {
    return this.row;
  }

  /** @see Position.java:52-54 */
  getCol(): number {
    return this.col;
  }

  /** `row * 49 + col`, in Java `int` arithmetic. @see Position.java:56-59 */
  hashCode(): number {
    return (Math.imul(this.row, 49) + this.col) | 0;
  }

  /** @see Position.java:61-65 */
  equals(obj: Position): boolean {
    const other = obj;
    return this.row === other.row && this.col === other.col;
  }
}
