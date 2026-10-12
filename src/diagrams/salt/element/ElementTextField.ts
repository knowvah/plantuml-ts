import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import type { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import { ULine } from '../../../core/klimt/shape/ULine.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import { AbstractElementText } from './AbstractElementText.js';
import type { Element } from './Element.js';

/**
 * ElementTextField — `"text"`: the trimmed text over an underline with a
 * 2 px tick at each end, reserving 8 px per source character.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementTextField.java:46-70
 */
export class ElementTextField extends AbstractElementText implements Element {
  /** @see ElementTextField.java:48-50 */
  constructor(text: string, font: UFont, spriteContainer: ISkinSimple) {
    super(text, font, true, spriteContainer);
  }

  /** @see ElementTextField.java:52-55 */
  getPreferredDimension(stringBounder: StringBounder, x: number, _y: number): XDimension2D {
    const dim = this.getTextDimensionAt(stringBounder, x);
    return dim.delta(6, 2);
  }

  /** @see ElementTextField.java:57-68 */
  drawU(ug: UGraphic, zIndex: number, _dimToUse: XDimension2D): void {
    if (zIndex !== 0) {
      return;
    }
    this.drawText(ug, 3, 0);
    const dim = this.getPreferredDimension(ug.getStringBounder(), 0, 0);
    const textDim = this.getTextDimensionAt(ug.getStringBounder(), 0);
    ug.apply(new UTranslate(1, textDim.getHeight())).draw(ULine.hline(dim.getWidth() - 3));
    const y3 = textDim.getHeight() - 3;
    ug.apply(new UTranslate(1, y3)).draw(ULine.vline(2));
    ug.apply(new UTranslate(3 + textDim.getWidth() + 1, y3)).draw(ULine.vline(2));
  }
}
