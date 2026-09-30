import type { FontConfiguration as StyleFontConfiguration } from '../../abel/FontConfiguration.js';
import { HColorSimple } from '../color/HColorSimple.js';
import { FontStyle, type FontConfiguration } from '../shape/UText.js';
import { UFont } from './UFont.js';

/** `UFontFace#isBold`: CSS weight 700 and above. @see UFontFace.java:158-160 */
const BOLD_CSS_WEIGHT = 700;

/**
 * PORT-ONLY bridge between the port's two `FontConfiguration` types: the
 * `abel` class `Style#getFontConfiguration` builds (`UFont` + `HColor`,
 * FontConfiguration.java:57-61) and the structural `klimt/shape/UText`
 * one the creole `SheetBuilder`/`DriverTextSvg` read
 * (`{family, size, color, styles, fontFace}`). Upstream has ONE class; the
 * split is the port's (`abel/FontConfiguration.ts` doc comment), so this
 * adapter carries exactly what upstream's single object would:
 *
 *  - `family`: the `FontStack` definition (`DriverTextSvg` maps the three
 *    logical names to CSS generics, `svg-graphics-elements.ts`);
 *  - `size`: `UFont#getSize`;
 *  - `styles`: `FontConfiguration#getStyles(font)` — BOLD / ITALIC from the
 *    font face (FontConfiguration.java:67-80);
 *  - `fontFace`: the `UFont` face (`currentFont.getFontFace()`);
 *  - `color`: `HColor#toSvg` of the light colour, `null` when transparent
 *    (`UText.ts`'s documented stand-in for `isTransparent()`).
 *
 * Throws where the abel object carries a stand-in the style engine never
 * builds (a non-`UFont` font or a non-`HColorSimple` colour) — Java's
 * checked cast.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontConfiguration.java:57-80
 */
export function bridgeFontConfiguration(fc: StyleFontConfiguration): FontConfiguration {
  const font = fc.getFont();
  if (!(font instanceof UFont)) throw new Error('ClassCastException: FontConfiguration font is not a UFont');
  const color = fc.getColor();
  if (!(color instanceof HColorSimple))
    throw new Error('ClassCastException: FontConfiguration color is not an HColorSimple');

  const face = font.getFontFace();
  return {
    family: font.getFontStack().getFullDefinition(),
    size: font.getSize(),
    color: color.isTransparent() ? null : solidPaint(color),
    styles: getStyles(face.cssWeight >= BOLD_CSS_WEIGHT, face.italic),
    fontFace: face,
  };
}

/** `HColorSimple#asPaint` is always a solid `XColor#toSvg` string (HColorSimple.ts). */
function solidPaint(color: HColorSimple): string {
  const paint = color.asPaint();
  if (typeof paint !== 'string') throw new Error('ClassCastException: HColorSimple painted a gradient');
  return paint;
}

/** @see FontConfiguration.java:67-80 */
function getStyles(bold: boolean, italic: boolean): ReadonlySet<FontStyle> {
  if (bold && italic) return new Set([FontStyle.ITALIC, FontStyle.BOLD]);
  if (bold) return new Set([FontStyle.BOLD]);
  if (italic) return new Set([FontStyle.ITALIC]);
  return new Set();
}
