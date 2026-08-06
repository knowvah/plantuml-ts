/**
 * SquareLinker — the two link-emitting callbacks `SquareMaker` drives
 * while chaining items into a square grid.
 *
 * SI1/T10 closure pull — full port (2/2 members).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/SquareLinker.java:38-43
 */
export interface SquareLinker<O> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/SquareLinker.java:40 */
  topDown(top: O, down: O): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/SquareLinker.java:42 */
  leftRight(left: O, right: O): void;
}
