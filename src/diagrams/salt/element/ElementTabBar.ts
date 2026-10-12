import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import { Fore } from '../../../core/klimt/Fore.js';
import { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import { ULine } from '../../../core/klimt/shape/ULine.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import { AbstractElement } from './AbstractElement.js';
import type { Element } from './Element.js';
import { ElementText } from './ElementText.js';

/** The only z-index a tab bar draws at. @see ElementTabBar.java:92 */
const TAB_BAR_Z_INDEX = 0;

/**
 * ElementTabBar — a `{/` tab bar: each tab's text with an open outline,
 * left to right, or top to bottom once `setVertical(true)` (the factory sets
 * it when a tab ends a line).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementTabBar.java:50-152
 */
export class ElementTabBar extends AbstractElement {
  /** @see ElementTabBar.java:52 */
  private readonly tabs: Element[] = [];
  /** @see ElementTabBar.java:53 */
  private readonly font: UFont;
  /** @see ElementTabBar.java:54 */
  private readonly spriteContainer: ISkinSimple;

  /** @see ElementTabBar.java:56 */
  private readonly margin1 = 2;
  /** @see ElementTabBar.java:57 */
  private readonly margin2 = 3;
  /** @see ElementTabBar.java:58 */
  private readonly margin3 = 10;

  /** @see ElementTabBar.java:60 */
  private vertical = false;

  /** @see ElementTabBar.java:62-65 */
  constructor(font: UFont, spriteContainer: ISkinSimple) {
    super();
    this.font = font;
    this.spriteContainer = spriteContainer;
  }

  /** @see ElementTabBar.java:67-70 */
  addTab(tab: string): void {
    const elt: Element = new ElementText([tab], this.font, this.spriteContainer);
    this.tabs.push(elt);
  }

  /** @see ElementTabBar.java:72-78 */
  getPreferredDimension(stringBounder: StringBounder, x: number, y: number): XDimension2D {
    if (this.vertical) return this.getPreferredDimensionVertical(stringBounder, x, y);

    return this.getPreferredDimensionHorizontal(stringBounder, x, y);
  }

  /** @see ElementTabBar.java:80-89 */
  private getPreferredDimensionHorizontal(stringBounder: StringBounder, x: number, y: number): XDimension2D {
    let w = 0;
    let h = 0;
    for (const elt of this.tabs) {
      const dim = elt.getPreferredDimension(stringBounder, x, y);
      w += dim.getWidth() + this.margin1 + this.margin2 + this.margin3;
      h = Math.max(h, dim.getHeight());
    }
    return new XDimension2D(w, h);
  }

  /** @see ElementTabBar.java:91-101 */
  drawU(ug: UGraphic, zIndex: number, dimToUse: XDimension2D | null): void {
    if (zIndex !== TAB_BAR_Z_INDEX) return;
    ug = ug.apply(new Fore(this.getBlack()));

    if (this.vertical) this.drawUVertical(ug, 0, 0, zIndex, dimToUse);
    else this.drawUHorizontal(ug, 0, 0, zIndex, dimToUse);
  }

  /** @see ElementTabBar.java:103-115 */
  private drawUHorizontal(ug: UGraphic, x: number, y: number, zIndex: number, dimToUse: XDimension2D | null): void {
    const { margin1, margin2, margin3 } = this;
    let x1 = x;
    for (const elt of this.tabs) {
      elt.drawU(ug.apply(new UTranslate(x1 + margin1, y)), zIndex, dimToUse);
      const dimText = elt.getPreferredDimension(ug.getStringBounder(), x1, y);
      const w = dimText.getWidth();
      ug.apply(new UTranslate(x1, y)).draw(ULine.vline(dimText.getHeight()));
      ug.apply(new UTranslate(x1, y)).draw(ULine.hline(w + margin1 + margin2));
      ug.apply(new UTranslate(x1 + w + margin1 + margin2, y)).draw(ULine.vline(dimText.getHeight()));
      ug.apply(new UTranslate(x1 + w + margin1 + margin2, y + dimText.getHeight())).draw(ULine.hline(margin3));
      x1 += w + margin1 + margin2 + margin3;
    }
  }

  /** @see ElementTabBar.java:117-126 */
  private getPreferredDimensionVertical(stringBounder: StringBounder, x: number, y: number): XDimension2D {
    let w = 0;
    let h = 0;
    for (const elt of this.tabs) {
      const dim = elt.getPreferredDimension(stringBounder, x, y);
      h += dim.getHeight() + this.margin1 + this.margin2 + this.margin3;
      w = Math.max(w, dim.getWidth());
    }
    return new XDimension2D(w, h);
  }

  /** `y1` starts at `x`, as upstream writes it (java:131).
   *  @see ElementTabBar.java:128-142 */
  private drawUVertical(ug: UGraphic, x: number, y: number, zIndex: number, dimToUse: XDimension2D | null): void {
    const { margin1, margin2, margin3 } = this;
    const preferred = this.getPreferredDimension(ug.getStringBounder(), x, y);
    ug = ug.apply(new UTranslate(x, y));
    let y1 = x;
    for (const elt of this.tabs) {
      elt.drawU(ug.apply(UTranslate.dy(y1 + margin1)), zIndex, dimToUse);
      const dimText = elt.getPreferredDimension(ug.getStringBounder(), x, y1);
      const h = dimText.getHeight();
      ug.apply(UTranslate.dy(y1)).draw(ULine.hline(preferred.getWidth()));
      ug.apply(UTranslate.dy(y1)).draw(ULine.vline(h + margin1 + margin2));
      ug.apply(UTranslate.dy(y1 + h + margin1 + margin2)).draw(ULine.hline(preferred.getWidth()));
      ug.apply(new UTranslate(preferred.getWidth(), y1 + h + margin1 + margin2)).draw(ULine.vline(margin3));
      y1 += h + margin1 + margin2 + margin3;
    }
  }

  /** @see ElementTabBar.java:144-146 */
  isVertical(): boolean {
    return this.vertical;
  }

  /** @see ElementTabBar.java:148-150 */
  setVertical(vertical: boolean): void {
    this.vertical = vertical;
  }
}
