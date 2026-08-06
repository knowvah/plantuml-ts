import type { Colors } from './Colors.js';

/**
 * SpecificBackcolorable — implemented by anything that can carry a
 * user-specified color set.
 *
 * SI1/T5 — full port (2/2 live members; the commented-out
 * `setSpecificColorTOBEREMOVED` is dead upstream too).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/SpecificBackcolorable.java:42-49
 */
export interface SpecificBackcolorable {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/SpecificBackcolorable.java:44 */
  getColors(): Colors;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/SpecificBackcolorable.java:48 */
  setColors(colors: Colors): void;
}
