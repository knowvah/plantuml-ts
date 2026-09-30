import type { AutomaticCounter } from './AutomaticCounter.js';

/**
 * AutomaticCounterBasic — a per-instance pre-incrementing counter (first
 * value 1). Mutable, as upstream; one instance is not shared across
 * builders.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/AutomaticCounterBasic.java:38-47
 */
export class AutomaticCounterBasic implements AutomaticCounter {
  /** @see AutomaticCounterBasic.java:40 */
  private counter = 0;

  /** `++counter`. @see AutomaticCounterBasic.java:42-45 */
  getNextInt(): number {
    return ++this.counter;
  }
}
