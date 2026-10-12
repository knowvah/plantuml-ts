import { Back } from '../../../core/klimt/Back.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import { Fore } from '../../../core/klimt/Fore.js';
import { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import { ULine } from '../../../core/klimt/shape/ULine.js';
import { URectangle } from '../../../core/klimt/shape/URectangle.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import { AbstractElement } from './AbstractElement.js';
import { ElementMenuEntry } from './ElementMenuEntry.js';

/** The entry text a popup draws as a horizontal line. @see ElementMenuPopup.java:87 */
const SEPARATOR = '-';
/** The only z-index a popup draws at. @see ElementMenuPopup.java:77 */
const POPUP_Z_INDEX = 1;

/**
 * ElementMenuPopup — the drop-down under a menu-bar entry: entries stacked
 * top to bottom on a `#DDD` background, a `-` entry drawn as a line across
 * the popup. Draws at z-index 1 only, over the z-index 0 layer.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementMenuPopup.java:50-96
 */
export class ElementMenuPopup extends AbstractElement {
  /** @see ElementMenuPopup.java:52 */
  private readonly entries: ElementMenuEntry[] = [];
  /** @see ElementMenuPopup.java:53 */
  private readonly font: UFont;
  /** @see ElementMenuPopup.java:54 */
  private readonly spriteContainer: ISkinSimple;

  /** @see ElementMenuPopup.java:56-59 */
  constructor(font: UFont, spriteContainer: ISkinSimple) {
    super();
    this.font = font;
    this.spriteContainer = spriteContainer;
  }

  /** @see ElementMenuPopup.java:61-63 */
  addEntry(s: string): void {
    this.entries.push(new ElementMenuEntry(s, this.font, this.spriteContainer));
  }

  /** @see ElementMenuPopup.java:65-74 */
  getPreferredDimension(stringBounder: StringBounder, x: number, y: number): XDimension2D {
    let w = 0;
    let h = 0;
    for (const entry of this.entries) {
      const dim = entry.getPreferredDimension(stringBounder, x, y);
      w = Math.max(w, dim.getWidth());
      h += dim.getHeight();
    }
    return new XDimension2D(w, h);
  }

  /** @see ElementMenuPopup.java:76-94 */
  drawU(ug: UGraphic, zIndex: number, dimToUse: XDimension2D | null): void {
    if (zIndex !== POPUP_Z_INDEX) return;

    ug = ug.apply(new Fore(this.getBlack().asPaint()));

    // Unguarded like upstream: a null dimToUse is ElementMenuPopup.java:82's NullPointerException.
    ug.apply(new Back(this.getColorDD().asPaint())).draw(URectangle.build(dimToUse!.getWidth(), dimToUse!.getHeight()));

    let y1 = 0;
    for (const entry of this.entries) {
      const h = entry.getPreferredDimension(ug.getStringBounder(), 0, y1).getHeight();
      if (entry.getText() === SEPARATOR) ug.apply(UTranslate.dy(y1 + h / 2)).draw(ULine.hline(dimToUse!.getWidth()));
      else entry.drawU(ug.apply(UTranslate.dy(y1)), zIndex, dimToUse);

      y1 += h;
    }
  }
}
