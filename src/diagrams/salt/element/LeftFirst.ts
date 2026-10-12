import type { Cell } from '../Cell.js';

/**
 * LeftFirst — orders cells narrowest first (`getNbCols`), then by leftmost
 * column: the order `ElementPyramid#init` widens columns in, so a spanning
 * cell only claims the width its single-column neighbours left missing.
 *
 * A `Comparator<Cell>` upstream (package-private; exported because each
 * class is its own module); `compare` is the function `Array#sort` takes.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/LeftFirst.java:42-53
 */
export class LeftFirst {
  /** @see LeftFirst.java:44-51 */
  compare(c0: Cell, c1: Cell): number {
    const diffNb = c0.getNbCols() - c1.getNbCols();
    if (diffNb !== 0) {
      return diffNb;
    }
    const diffPos = c0.getMinCol() - c1.getMinCol();
    return diffPos;
  }
}
