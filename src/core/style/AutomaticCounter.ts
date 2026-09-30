/**
 * AutomaticCounter — the source of style-value priorities: each parsed
 * value takes the next int (`ValueImpl.regular/dark`, ValueImpl.java:50-60).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/AutomaticCounter.java:38-42
 */
export interface AutomaticCounter {
  /** @see AutomaticCounter.java:40 */
  getNextInt(): number;
}
