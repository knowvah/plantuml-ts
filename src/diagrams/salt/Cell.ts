/**
 * Cell — the grid span (rows `minRow..maxRow`, columns `minCol..maxCol`) an
 * element occupies in a salt pyramid; built by `Positionner2`, widened to the
 * right by `mergeLeft`. Mutable, as upstream.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/Cell.java:38-86
 */
export class Cell {
  /** @see Cell.java:41 */
  private minRow: number;
  /** @see Cell.java:42 */
  private maxRow: number;
  /** @see Cell.java:43 */
  private minCol: number;
  /** @see Cell.java:44 */
  private maxCol: number;

  /** @see Cell.java:46-51 */
  constructor(row: number, col: number) {
    this.minRow = row;
    this.maxRow = row;
    this.minCol = col;
    this.maxCol = col;
  }

  /** @see Cell.java:53-55 */
  mergeLeft(): void {
    this.maxCol++;
  }

  /** @see Cell.java:57-59 */
  getMinRow(): number {
    return this.minRow;
  }

  /** @see Cell.java:61-63 */
  getMaxRow(): number {
    return this.maxRow;
  }

  /** @see Cell.java:65-67 */
  getMinCol(): number {
    return this.minCol;
  }

  /** @see Cell.java:69-71 */
  getMaxCol(): number {
    return this.maxCol;
  }

  /** @see Cell.java:73-75 */
  getNbRows(): number {
    return this.maxRow - this.minRow + 1;
  }

  /** @see Cell.java:77-79 */
  getNbCols(): number {
    return this.maxCol - this.minCol + 1;
  }

  /** @see Cell.java:81-84 */
  toString(): string {
    return '(' + this.minRow + ',' + this.minCol + ')-(' + this.maxRow + ',' + this.maxCol + ')';
  }
}
