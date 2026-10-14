import type { HColor } from '../../style/Value.js';
import type { HColorGradient } from './HColorGradient.js';
import type { HColorSimple } from './HColorSimple.js';

/**
 * HColorAutomagic — the `automatic` colour: no value of its own, it resolves
 * at draw time to the contrast colour of whatever background it lands on.
 * Not an `HColorSimple`, which is what makes `colors automatic` draw the full
 * grid (PSystemColors.java:99,122).
 *
 * Inherited from `HColor` (HColor.java:105-127): `asString` is
 * `"?HColorAutomagic"`, `withDark`/`opposite` throw
 * `UnsupportedOperationException`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorAutomagic.java:36-44
 */
export class HColorAutomagic implements HColor {
  /** `back.opposite()`. Only `HColorSimple` ports `opposite`; any other
   *  `back` is the base `HColor#opposite` throw (HColor.java:129-131).
   *  @see HColorAutomagic.java:38-41 */
  getAppropriateColor(back: HColorSimple | HColorGradient | HColorAutomagic): HColorSimple {
    if (!('opposite' in back)) throw new Error('UnsupportedOperationException');
    return back.opposite();
  }

  /** The inherited `"?" + getClass().getSimpleName()`. @see HColor.java:113-115 */
  asString(): string {
    return '?HColorAutomagic';
  }

  /** @see HColor.java:125-127 */
  withDark(_dark: HColor): HColor {
    throw new Error('UnsupportedOperationException');
  }

  /** The inherited `HColor#opposite`. @see HColor.java:129-131 */
  opposite(): never {
    throw new Error('UnsupportedOperationException');
  }
}
