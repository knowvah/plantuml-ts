import { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import { NORMAL_FONT_FACE, type FontFace } from '../klimt/shape/UText.js';
import type { HColor, HColorSet, Value } from './Value.js';
import { ValueAbstract } from './ValueAbstract.js';

/** `HColors.BLACK` = `set.getColorOrWhite("#000000")` (HColors.java:86). */
const BLACK_CODE = '#000000';

/**
 * ValueNull — the absent-value singleton `NULL`: zero, false, empty,
 * normal face, `LEFT`, black. `getPriority` stays `ValueAbstract`'s throw.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ValueNull.java:44-95
 */
export class ValueNull extends ValueAbstract {
  /** @see ValueNull.java:46 */
  static readonly NULL: Value = new ValueNull();

  /** @see ValueNull.java:48-49 */
  private constructor() {
    super();
  }

  /** @see ValueNull.java:51-54 */
  override asInt(): number {
    return 0;
  }

  /** @see ValueNull.java:56-59 */
  override asIntButMinusOneIfError(): number {
    return 0;
  }

  /** @see ValueNull.java:61-64 */
  override asDouble(): number {
    return 0;
  }

  /** @see ValueNull.java:66-69 */
  override asDoubleDefaultTo(defaultValue: number): number {
    return defaultValue;
  }

  /** @see ValueNull.java:71-74 */
  override asBoolean(): boolean {
    return false;
  }

  /** @see ValueNull.java:76-79 */
  override asString(): string {
    return '';
  }

  /** `UFontFace.normal()`. @see ValueNull.java:81-84 */
  override asFontFace(): FontFace {
    return NORMAL_FONT_FACE;
  }

  /**
   * `HColors.BLACK`, reached through the set's `getColorOrWhite("#000000")`
   * exactly as `HColors.java:86` builds it (see `Value.ts#HColorSet`).
   * @see ValueNull.java:86-89
   */
  override asColor(set: HColorSet): HColor {
    return set.getColorOrWhite(BLACK_CODE);
  }

  /** @see ValueNull.java:91-94 */
  override asHorizontalAlignment(): HorizontalAlignment {
    return HorizontalAlignment.LEFT;
  }
}
