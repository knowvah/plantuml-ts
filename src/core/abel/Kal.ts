import type { Direction } from './Direction.js';

/**
 * Kal — ADR-2 consumed-interface stub for `svek/Kal.java` (an edge-end
 * association-label drawable). `Entity` keeps a `Direction`-keyed map of
 * them (`addKal`/`getKals`) and reads only `getPosition()` when filing
 * one; the full class (drawing, translation, style resolution) lands
 * with the svek edge-label port, which implements this interface and
 * moves it to `src/core/svek/Kal.ts`. Journaled (T5).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Kal.java:66
 */
export interface Kal {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Kal.java (getPosition) */
  getPosition(): Direction;
}
