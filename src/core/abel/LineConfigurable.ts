import type { ColorType } from './ColorType.js';
import type { Colors, HColor } from './Colors.js';

/**
 * LineConfigurable — implemented by anything whose line/back/text colors
 * a command can override slot-by-slot.
 *
 * SI1/T5 — full port (2/2 members).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LineConfigurable.java:44-50
 */
export interface LineConfigurable {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LineConfigurable.java:46 */
  getColors(): Colors;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LineConfigurable.java:48 */
  setSpecificColorTOBEREMOVED(type: ColorType, color: HColor | undefined): void;
}
