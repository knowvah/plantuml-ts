import type { Cell } from '../Cell.js';

/**
 * TopFirst — orders cells shortest first (`getNbRows`), then by topmost
 * row: the order `ElementPyramid#init` heightens rows in.
 *
 * A `Comparator<Cell>` upstream (package-private; exported because each
 * class is its own module); `compare` is the function `Array#sort` takes.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/TopFirst.java:42-53
 */
export class TopFirst {
  /** @see TopFirst.java:44-51 */
  compare(c0: Cell, c1: Cell): number {
    const diffNb = c0.getNbRows() - c1.getNbRows();
    if (diffNb !== 0) {
      return diffNb;
    }
    const diffPos = c0.getMinRow() - c1.getMinRow();
    return diffPos;
  }
}
