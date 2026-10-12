import { Cell } from './Cell.js';
import type { Element } from './element/Element.js';
import type { Terminated } from './Terminated.js';
import { Terminator } from './Terminator.js';

/**
 * Positionner2 — lays a salt pyramid's elements out in reading order: each
 * `add` takes the current (row, col) cell, then a `NEWCOL` terminator moves
 * one column right and anything else starts the next row. `mergeLeft` (a `*`
 * cell) widens the last cell by one column instead of adding one.
 *
 * `positions` is a `LinkedHashMap` upstream; a JS `Map` keeps the same
 * insertion order and, like `LinkedHashMap#put` on an existing key, keeps a
 * re-put key in its first position. Mutable, as upstream.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/Positionner2.java:44-113
 */
export class Positionner2 {
  /** @see Positionner2.java:46 */
  private row = 0;
  /** @see Positionner2.java:47 */
  private col = 0;

  /** @see Positionner2.java:49 */
  private maxRow = 0;
  /** @see Positionner2.java:50 */
  private maxCol = 0;

  /** @see Positionner2.java:52 */
  private readonly positions = new Map<Element, Cell>();

  /** Java `null` until the first `add`. @see Positionner2.java:54 */
  private last: Cell | undefined;

  /** @see Positionner2.java:56-64 */
  add(element: Terminated<Element>): void {
    this.addWithoutMove(element.getElement());
    const terminator = element.getTerminator();
    if (terminator === Terminator.NEWCOL) {
      this.moveNextColumn();
    } else {
      this.moveNextRow();
    }
  }

  /** @see Positionner2.java:66-68 */
  private moveNextColumn(): void {
    this.col++;
  }

  /** @see Positionner2.java:70-73 */
  private moveNextRow(): void {
    this.row++;
    this.col = 0;
  }

  /** @see Positionner2.java:75-79 */
  private addWithoutMove(elmt: Element): void {
    this.last = new Cell(this.row, this.col);
    this.positions.set(elmt, this.last);
    this.updateMax();
  }

  /**
   * `last.mergeLeft()` on a never-added positionner is Java's
   * `NullPointerException` (jar-probed: `*` as a pyramid's first cell),
   * thrown after the max/row/col updates, as upstream.
   * @see Positionner2.java:81-90
   */
  mergeLeft(terminator: Terminator): void {
    this.updateMax();
    if (terminator === Terminator.NEWCOL) {
      this.col++;
    } else {
      this.row++;
      this.col = 0;
    }
    if (this.last === undefined) throw new TypeError('NullPointerException: Positionner2.last is null');
    this.last.mergeLeft();
  }

  /** @see Positionner2.java:92-99 */
  private updateMax(): void {
    if (this.row > this.maxRow) {
      this.maxRow = this.row;
    }
    if (this.col > this.maxCol) {
      this.maxCol = this.col;
    }
  }

  /** `Collections.unmodifiableMap(positions)`. @see Positionner2.java:101-103 */
  getAll(): ReadonlyMap<Element, Cell> {
    return this.positions;
  }

  /** @see Positionner2.java:105-107 */
  getNbRows(): number {
    return this.maxRow + 1;
  }

  /** @see Positionner2.java:109-111 */
  getNbCols(): number {
    return this.maxCol + 1;
  }
}
