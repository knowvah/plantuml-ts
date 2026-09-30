import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { FontFace } from '../klimt/shape/UText.js';
import type { HColor, HColorSet, Value } from './Value.js';

/**
 * ValueAbstract — every accessor throws `UnsupportedOperationException(
 * "Class=" + getClass())`; subclasses override what they support.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ValueAbstract.java:43-85
 */
export abstract class ValueAbstract implements Value {
  /** `new UnsupportedOperationException("Class=" + getClass())`. @see ValueAbstract.java:46 */
  protected unsupported(): Error {
    return new Error(`UnsupportedOperationException: Class=${this.constructor.name}`);
  }

  /** @see ValueAbstract.java:45-47 */
  asString(): string | null {
    throw this.unsupported();
  }

  /** @see ValueAbstract.java:49-51 */
  asColor(_set: HColorSet): HColor {
    throw this.unsupported();
  }

  /** @see ValueAbstract.java:53-55 */
  asInt(): number {
    throw this.unsupported();
  }

  /** @see ValueAbstract.java:57-59 */
  asIntButMinusOneIfError(): number {
    throw this.unsupported();
  }

  /** @see ValueAbstract.java:62-64 */
  asDouble(): number {
    throw this.unsupported();
  }

  /** @see ValueAbstract.java:66-68 */
  asDoubleDefaultTo(_defaultValue: number): number {
    throw this.unsupported();
  }

  /** @see ValueAbstract.java:70-72 */
  asBoolean(): boolean {
    throw this.unsupported();
  }

  /** @see ValueAbstract.java:74-76 */
  asFontFace(): FontFace {
    throw this.unsupported();
  }

  /** @see ValueAbstract.java:78-80 */
  asHorizontalAlignment(): HorizontalAlignment | undefined {
    throw this.unsupported();
  }

  /** @see ValueAbstract.java:82-84 */
  getPriority(): number {
    throw this.unsupported();
  }
}
