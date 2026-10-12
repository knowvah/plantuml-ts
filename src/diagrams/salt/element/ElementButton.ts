import { Back } from '../../../core/klimt/Back.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import type { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import { URectangle } from '../../../core/klimt/shape/URectangle.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UStroke } from '../../../core/klimt/UStroke.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import { AbstractElementText } from './AbstractElementText.js';
import type { Element } from './Element.js';

/** The rounded rect's corner. @see ElementButton.java:71 */
const CORNER = 10;

/**
 * ElementButton — `[text]`: the text centred in a rounded `#EEE` box with a
 * 2.5 px black border, reserving 8 px per source character.
 *
 * Colours: `color.bg()` / `ug.apply(color)` are `Back`/`Fore` of the
 * `HColorSimple` itself, mapped (dark partner included) by the klimt driver
 * (`UBackground.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementButton.java:47-75
 */
export class ElementButton extends AbstractElementText implements Element {
  /** @see ElementButton.java:49 */
  private readonly stroke = 2.5;
  /** @see ElementButton.java:50 */
  private readonly marginX = 2;
  /** @see ElementButton.java:51 */
  private readonly marginY = 2;

  /** @see ElementButton.java:53-55 */
  constructor(text: string, font: UFont, spriteContainer: ISkinSimple) {
    super(text, font, true, spriteContainer);
  }

  /** @see ElementButton.java:57-61 */
  getPreferredDimension(stringBounder: StringBounder, x: number, _y: number): XDimension2D {
    let dim = this.getTextDimensionAt(stringBounder, x + this.stroke + this.marginX);
    dim = dim.delta(2 * this.marginX, 2 * this.marginY);
    return dim.delta(2 * this.stroke);
  }

  /** @see ElementButton.java:63-74 */
  drawU(ug: UGraphic, zIndex: number, _dimToUse: XDimension2D | null): void {
    if (zIndex !== 0) return;

    const dim = this.getPreferredDimension(ug.getStringBounder(), 0, 0);
    ug = ug.apply(UStroke.withThickness(this.stroke));
    ug = ug.apply(new Back(this.getColorEE())).apply(new Fore(this.getBlack()));
    ug.apply(new UTranslate(this.stroke, this.stroke)).draw(
      URectangle.build(dim.getWidth() - 2 * this.stroke, dim.getHeight() - 2 * this.stroke).rounded(CORNER),
    );
    const dimPureText = this.getPureTextDimension(ug.getStringBounder());
    this.drawText(ug, (dim.getWidth() - dimPureText.getWidth()) / 2, this.stroke + this.marginY);
  }
}
