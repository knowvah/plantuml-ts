import { NORMAL_FONT_FACE, type FontFace } from '../shape/UText.js';
import type { FontStack } from './FontStack.js';

/** `UFontFace.BOLD` (UFontFace.java:56). */
const BOLD_FONT_FACE: FontFace = { cssWeight: 700, italic: false };
/** `UFontFace.ITALIC` (UFontFace.java:57). */
const ITALIC_FONT_FACE: FontFace = { cssWeight: 400, italic: true };
/** `UFontFace.BOLD_ITALIC` (UFontFace.java:58). */
const BOLD_ITALIC_FONT_FACE: FontFace = { cssWeight: 700, italic: true };

/**
 * UFontFace — the standard faces of upstream's immutable `UFontFace`
 * (a style + CSS weight pair; the port's value type is {@link FontFace}).
 * Ported slice: `normal()`, `bold()`, `italic()`, `boldItalic()`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/UFontFace.java:55-58,71-94
 */
export const UFontFace = {
  /** weight 400, upright. @see UFontFace.java:55,71-73 */
  normal: (): FontFace => NORMAL_FONT_FACE,
  /** weight 700, upright. @see UFontFace.java:56,78-80 */
  bold: (): FontFace => BOLD_FONT_FACE,
  /** weight 400, italic. @see UFontFace.java:57,85-87 */
  italic: (): FontFace => ITALIC_FONT_FACE,
  /** weight 700, italic. @see UFontFace.java:58,92-94 */
  boldItalic: (): FontFace => BOLD_ITALIC_FONT_FACE,
} as const;

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
 * (needs `UFontContext`), `withSize`, `equals`/`hashCode` (not reached yet).
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

  /** A null face returns this font. @see UFont.java:89-93 */
  withFontFace(newFace: FontFace | undefined): UFont {
    if (newFace === undefined) return this;
    return new UFont(this.fontStack, newFace, this.size);
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
