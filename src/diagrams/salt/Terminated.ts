import type { Terminator } from './Terminator.js';

/**
 * Terminated — a salt token (or a built element) paired with the
 * `Terminator` that followed it in the source.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/Terminated.java:40-62
 */
export class Terminated<O> {
  /** @see Terminated.java:42 */
  private readonly element: O;
  /** @see Terminated.java:43 */
  private readonly terminator: Terminator;

  /**
   * `Objects.requireNonNull(terminator)` (java:47) is kept as an explicit
   * throw: the type forbids a missing terminator, the guard mirrors the Java.
   * @see Terminated.java:45-48
   */
  constructor(element: O, terminator: Terminator) {
    this.element = element;
    if (terminator == null) throw new Error('NullPointerException');
    this.terminator = terminator;
  }

  /** @see Terminated.java:50-52 */
  getElement(): O {
    return this.element;
  }

  /** @see Terminated.java:54-56 */
  getTerminator(): Terminator {
    return this.terminator;
  }

  /**
   * `element.toString() + " " + terminator`; the enum prints its constant
   * name, which is the as-const value.
   * @see Terminated.java:58-60
   */
  toString(): string {
    return String(this.element) + ' ' + this.terminator;
  }
}
