import { NORMAL_FONT_FACE, type FontFace } from '../shape/UText.js';
import type { FontStack } from './FontStack.js';

/**
 * UFont — a font stack, face (CSS weight + italic axis, {@link FontFace})
 * and integer size. Immutable, as upstream.
 *
 * Ported slice: the constructor, `getFontFace`, `getSize`, `getSize2D`,
 * `getFontStack` (port-only read of the private field; upstream reads it
 * through `getFamily`), `toString`. `toString` is upstream's
 * TeaVM branch (`getSvgFamily() + "/" + size`, java:139-149) — the JVM
 * branch prints AWT's portable font name, which has no browser analogue.
 * Not ported: `getUnderlayingFont`/`createTextLayout` (AWT), `getFamily`
 * (needs `UFontContext`), `withSize`/`withFontFace`, `equals`/`hashCode` (not reached yet).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/UFont.java:46-177
 */
export class UFont {
  /** @see UFont.java:53 */
  private readonly face: FontFace;

  /** A null face is `UFontFace.normal()`. @see UFont.java:61-65 */
  constructor(
    /** @see UFont.java:48 */
    private readonly fontStack: FontStack,
    face: FontFace | undefined,
    /** @see UFont.java:54 */
    private readonly size: number,
  ) {
    this.face = face ?? NORMAL_FONT_FACE;
  }

  /** @see UFont.java:85-87 */
  getFontFace(): FontFace {
    return this.face;
  }

  /** @see UFont.java:95-97 */
  getSize(): number {
    return this.size;
  }

  /** @see UFont.java:99-101 */
  getSize2D(): number {
    return this.size;
  }

  /** Port-only accessor for the `fontStack` field (UFont.java:48). */
  getFontStack(): FontStack {
    return this.fontStack;
  }

  /** TeaVM branch: `getSvgFamily() + "/" + getSize()`. @see UFont.java:139-149 */
  toString(): string {
    return `${this.fontStack.getSvgFamily()}/${String(this.size)}`;
  }
}
